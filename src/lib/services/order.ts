import { db } from "@/lib/db";
import { STATUS, allowedNext, isValidTransition, type Fulfillment } from "@/lib/services/order-status";
import { hitungTotal } from "@/lib/services/pricing";
import type { CheckoutInput } from "@/lib/validators";

export class LayananError extends Error {}

async function getSetting(key: string, fallback: string): Promise<string> {
  const s = await db.setting.findUnique({ where: { key } });
  return s?.value ?? fallback;
}

function buatNomorUrut(harian: number): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `BH-${dd}${mm}${yy}-${String(harian).padStart(3, "0")}`;
}

// Pesanan dibuat: validasi ulang stok/harga/zona/slot di server (PRD 4.6).
// Nomor harian diambil dari jumlah pesanan hari ini + retry bila bentrok (PRD 4.3).
export async function buatPesanan(userId: string, input: CheckoutInput) {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!cart || cart.items.length === 0) {
    throw new LayananError("Keranjang kosong. Tambahkan bolu dulu sebelum checkout.");
  }

  for (const item of cart.items) {
    const v = item.variant;
    if (!v.isActive || v.product.archivedAt || !v.product.isActive) {
      throw new LayananError(`Produk ${v.product.name} (${v.label}) tidak lagi tersedia.`);
    }
    if (v.stock < item.qty) {
      throw new LayananError(
        `Stok ${v.product.name} (${v.label}) tinggal ${v.stock}. Perbarui jumlah di keranjang.`
      );
    }
  }

  const hariIni = new Date().toISOString().slice(0, 10);
  if (input.scheduledDate < hariIni) {
    throw new LayananError("Tanggal jadwal tidak boleh sebelum hari ini.");
  }

  const slot = await db.timeSlot.findUnique({ where: { id: input.slotId } });
  if (!slot || !slot.isActive) {
    throw new LayananError("Jadwal yang dipilih tidak tersedia.");
  }
  if (slot.isFull) {
    throw new LayananError(`Slot ${slot.label} penuh. Pilih jadwal lain.`);
  }
  // Slot "Lewat": untuk pesanan hari ini, slot yang sudah berakhir + lead time 60 menit tidak bisa dipilih.
  if (input.scheduledDate === hariIni) {
    const now = new Date(Date.now() + 60 * 60 * 1000);
    const [h, m] = slot.endTime.split(":").map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes >= h * 60 + m) {
      throw new LayananError(`Slot ${slot.label} sudah lewat untuk hari ini. Pilih tanggal lain.`);
    }
  }

  let deliveryFee = 0;
  let zoneId: string | null = null;
  if (input.fulfillment === "DELIVERY") {
    const zone = await db.deliveryZone.findUnique({ where: { id: input.zoneId! } });
    if (!zone || !zone.isActive) {
      throw new LayananError("Area ini belum terlayani. Ganti ke ambil di toko atau pilih zona lain.");
    }
    deliveryFee = zone.fee;
    zoneId = zone.id;
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.variant.price * i.qty, 0);
  const total = hitungTotal(subtotal, deliveryFee);

  const batasMenit = Number(await getSetting("batas_bayar_menit", "60"));
  const paymentDueAt = new Date(Date.now() + batasMenit * 60 * 1000);

  let terakhirError: unknown;
  for (let coba = 0; coba < 3; coba++) {
    try {
      return await db.$transaction(async (tx) => {
        const urut = await tx.order.count({
          where: { createdAt: { gte: mulaiHariIni() } },
        });
        const orderNo = buatNomorUrut(urut + 1);
        const order = await tx.order.create({
          data: {
            orderNo,
            userId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail,
            fulfillment: input.fulfillment,
            scheduledDate: input.scheduledDate,
            slotId: slot.id,
            addressSnapshot: input.addressSnapshot ?? null,
            zoneId,
            deliveryFee,
            subtotal,
            total,
            status: STATUS.MENUNGGU,
            paymentDueAt,
            items: {
              create: cart.items.map((i) => ({
                variantId: i.variantId,
                productName: i.variant.product.name,
                variantLabel: i.variant.label,
                unitPrice: i.variant.price,
                qty: i.qty,
                note: i.note ?? null,
                lineTotal: i.variant.price * i.qty,
              })),
            },
          },
        });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: STATUS.MENUNGGU,
            actorName: input.customerName,
            note: "Pesanan dibuat",
          },
        });
        return order;
      });
    } catch (e) {
      terakhirError = e;
      // Bentrok nomor harian → coba lagi (P2002 pada orderNo)
    }
  }
  throw new LayananError(
    `Gagal membuat pesanan. Coba lagi. (${terakhirError instanceof Error ? terakhirError.message : "unknown"})`
  );
}

function mulaiHariIni(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Verifikasi pembayaran (BR-05/BR-06): stok dipotong atomik saat Dikonfirmasi.
export async function terimaPembayaran(orderId: string, actorName: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, proofs: true },
  });
  if (!order) throw new LayananError("Pesanan tidak ditemukan.");
  if (order.status !== STATUS.MENUNGGU) {
    throw new LayananError(`Pesanan bukan berstatus ${STATUS.MENUNGGU}.`);
  }
  const proof = order.proofs.find((p) => p.status === "SUBMITTED");
  if (!proof) throw new LayananError("Belum ada bukti pembayaran yang diunggah.");

  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      const res = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (res.count === 0) {
        throw new LayananError(
          `Stok ${item.productName} (${item.variantLabel}) tidak mencukupi. Tolak bukti dan hubungi pelanggan.`
        );
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: STATUS.DIKONFIRMASI, stockDeducted: true },
    });
    await tx.paymentProof.update({
      where: { id: proof.id },
      data: { status: "ACCEPTED", reviewedBy: actorName, reviewedAt: new Date() },
    });
    await tx.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: STATUS.MENUNGGU,
        toStatus: STATUS.DIKONFIRMASI,
        actorName,
        note: "Pembayaran diterima (verifikasi manual QRIS)",
      },
    });
  });
}

export async function tolakBukti(proofId: string, alasan: string, actorName: string) {
  const proof = await db.paymentProof.findUnique({
    where: { id: proofId },
    include: { order: true },
  });
  if (!proof) throw new LayananError("Bukti tidak ditemukan.");
  if (proof.order.status !== STATUS.MENUNGGU) {
    throw new LayananError("Pesanan sudah tidak menunggu pembayaran.");
  }
  await db.paymentProof.update({
    where: { id: proofId },
    data: { status: "REJECTED", rejectReason: alasan, reviewedBy: actorName, reviewedAt: new Date() },
  });
}

export async function ubahStatusPesanan(
  orderId: string,
  to: string,
  actorName: string,
  note?: string
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new LayananError("Pesanan tidak ditemukan.");
  if (!isValidTransition(order.status, to, order.fulfillment as Fulfillment)) {
    throw new LayananError(
      `Transisi ${order.status} → ${to} tidak valid. Pilihan: ${allowedNext(
        order.status,
        order.fulfillment as Fulfillment
      ).join(", ") || "tidak ada (sudah final)"}.`
    );
  }
  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status: to } }),
    db.orderStatusLog.create({
      data: { orderId, fromStatus: order.status, toStatus: to, actorName, note: note ?? null },
    }),
  ]);
}

// Pembatalan: stok dikembalikan hanya untuk pesanan yang pernah mengurangi stok (BR-06).
export async function batalkanPesanan(orderId: string, alasan: string, actorName: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new LayananError("Pesanan tidak ditemukan.");
  if (!allowedNext(order.status, order.fulfillment as Fulfillment).includes(STATUS.BATAL)) {
    throw new LayananError(`Pesanan berstatus ${order.status} tidak bisa dibatalkan.`);
  }
  await db.$transaction(async (tx) => {
    if (order.stockDeducted) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: STATUS.BATAL, cancelReason: alasan },
    });
    await tx.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: STATUS.BATAL,
        actorName,
        note: alasan,
      },
    });
  });
}

// Kedaluwarsa otomatis (BR-04): Menunggu Pembayaran lewat batas → Dibatalkan.
export async function cekKedaluwarsa(): Promise<number> {
  const kedaluwarsa = await db.order.findMany({
    where: { status: STATUS.MENUNGGU, paymentDueAt: { lt: new Date() } },
  });
  for (const o of kedaluwarsa) {
    await batalkanPesanan(o.id, "Batas pembayaran berakhir", "Sistem");
  }
  return kedaluwarsa.length;
}
