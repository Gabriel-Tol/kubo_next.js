// Self-check alur inti PRD dijalankan via tsx: checkout → verifikasi → status → batal → kedaluwarsa.
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { PrismaClient } = await import("@prisma/client");
const { buatPesanan, terimaPembayaran, ubahStatusPesanan, batalkanPesanan, cekKedaluwarsa, LayananError } =
  await import("../src/lib/services/order");
const { STATUS, isValidTransition } = await import("../src/lib/services/order-status");

const db = new PrismaClient();
let gagal = 0;
function cek(nama: string, kondisi: boolean, detail = "") {
  console.log(`${kondisi ? "OK   " : "GAGAL"} ${nama}${detail ? " — " + detail : ""}`);
  if (!kondisi) gagal++;
}

const user = await db.user.findUniqueOrThrow({ where: { email: "nabila@contoh.id" } });
const variant = await db.productVariant.findFirstOrThrow({
  where: { product: { slug: "bolu-marmer" }, label: "20 cm" },
});
const slot = await db.timeSlot.findFirstOrThrow({ orderBy: { startTime: "asc" } });

// bersihkan sisa uji sebelumnya
await db.order.deleteMany({ where: { userId: user.id } });
await db.cart.deleteMany({ where: { userId: user.id } });

const stokAwal = variant.stock;
const cart = await db.cart.create({
  data: {
    userId: user.id,
    items: { create: { variantId: variant.id, qty: 2, note: "Selamat ulang tahun" } },
  },
});
void cart;

const hariIni = new Date().toISOString().slice(0, 10);
const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

// 1. checkout ambil di toko: total = subtotal, ongkir 0
const order = await buatPesanan(user.id, {
  customerName: "Nabila Putri",
  customerPhone: "081200000002",
  customerEmail: "nabila@contoh.id",
  fulfillment: "PICKUP",
  scheduledDate: besok,
  slotId: slot.id,
});
cek("nomor pesanan format BH-DDMMYY-NNN", /^BH-\d{6}-\d{3}$/.test(order.orderNo), order.orderNo);
cek("status awal Menunggu Pembayaran", order.status === STATUS.MENUNGGU);
cek("total = subtotal (ongkir Rp0)", order.total === variant.price * 2 && order.deliveryFee === 0, `total ${order.total}`);
cek("stok belum dipotong saat checkout", (await db.productVariant.findUnique({ where: { id: variant.id } }))!.stock === stokAwal);

// checkout antar Zona B: total = subtotal + 20000
const zoneB = await db.deliveryZone.findFirstOrThrow({ where: { name: "Zona B" } });
await db.cartItem.create({ data: { cartId: cart.id, variantId: variant.id, qty: 1 } });
const orderAntar = await buatPesanan(user.id, {
  customerName: "Nabila Putri",
  customerPhone: "081200000002",
  customerEmail: "nabila@contoh.id",
  fulfillment: "DELIVERY",
  scheduledDate: besok,
  slotId: slot.id,
  zoneId: zoneB.id,
  addressSnapshot: "Jl. Cempaka No. 5, Coblong",
});
cek("antar Zona B: ongkir 20000 masuk total", orderAntar.deliveryFee === 20000 && orderAntar.total === variant.price + 20000, `total ${orderAntar.total}`);
await db.order.delete({ where: { id: orderAntar.id } });

// slot terlarang: kemarin → ditolak
let slotKemarinDitolak = false;
try {
  await buatPesanan(user.id, {
    customerName: "Nabila",
    customerPhone: "081200000002",
    customerEmail: "nabila@contoh.id",
    fulfillment: "PICKUP",
    scheduledDate: hariIni,
    slotId: slot.id,
  });
} catch (e) {
  slotKemarinDitolak = e instanceof LayananError;
}
cek("jadwal hari ini yang sudah lewat ditolak", slotKemarinDitolak);

// 2. bukti SUBMITTED → verifikasi
await db.paymentProof.create({
  data: { orderId: order.id, filePath: "storage/bukti/uji.jpg", originalName: "bukti.jpg", sizeBytes: 1000, mime: "image/jpeg", status: "SUBMITTED" },
});
await terimaPembayaran(order.id, "Admin");
const setelah = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { proofs: true, logs: true } });
cek("verifikasi → Dikonfirmasi", setelah.status === STATUS.DIKONFIRMASI);
cek("stok berkurang saat konfirmasi", (await db.productVariant.findUnique({ where: { id: variant.id } }))!.stock === stokAwal - 2, `stok ${(await db.productVariant.findUnique({ where: { id: variant.id } }))!.stock}`);
cek("bukti ACCEPTED + pelaku tercatat", setelah.proofs[0].status === "ACCEPTED" && setelah.proofs[0].reviewedBy === "Admin");
cek("log status tercatat", setelah.logs.some((l) => l.toStatus === STATUS.DIKONFIRMASI));

// 3. transisi status
let lompatDitolak = false;
try {
  await ubahStatusPesanan(order.id, STATUS.SELESAI, "Admin");
} catch (e) {
  lompatDitolak = e instanceof LayananError;
}
cek("lompat Dikonfirmasi → Selesai ditolak", lompatDitolak);
await ubahStatusPesanan(order.id, STATUS.DIPROSES, "Admin");
await ubahStatusPesanan(order.id, STATUS.SIAP, "Admin");
cek("urutan ambil: Diproses → Siap Diambil", (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status === STATUS.SIAP);
cek("cabang antar tidak menawarkan Siap Diambil", !isValidTransition(STATUS.DIPROSES, STATUS.SIAP, "DELIVERY"));

// 4. pembatalan setelah konfirmasi mengembalikan stok
await batalkanPesanan(order.id, "Pelanggan minta tukar jadwal", "Admin");
cek("batal setelah konfirmasi → stok kembali", (await db.productVariant.findUnique({ where: { id: variant.id } }))!.stock === stokAwal);
cek("alasan pembatalan tersimpan", (await db.order.findUniqueOrThrow({ where: { id: order.id } })).cancelReason === "Pelanggan minta tukar jadwal");

// 5. kedaluwarsa otomatis
await db.cartItem.create({ data: { cartId: cart.id, variantId: variant.id, qty: 1 } });
const order2 = await buatPesanan(user.id, {
  customerName: "Nabila Putri",
  customerPhone: "081200000002",
  customerEmail: "nabila@contoh.id",
  fulfillment: "PICKUP",
  scheduledDate: besok,
  slotId: slot.id,
});
await db.order.update({ where: { id: order2.id }, data: { paymentDueAt: new Date(Date.now() - 60000) } });
const kedaluwarsa = await cekKedaluwarsa();
cek("pesanan lewat batas bayar dibatalkan sistem", kedaluwarsa >= 1);
const o2 = await db.order.findUniqueOrThrow({ where: { id: order2.id }, include: { logs: true } });
cek("status kedaluwarsa Dibatalkan + alasan", o2.status === STATUS.BATAL && o2.cancelReason === "Batas pembayaran berakhir");
cek("stok tidak dipotong untuk pesanan yang belum konfirmasi", (await db.productVariant.findUnique({ where: { id: variant.id } }))!.stock === stokAwal);

// bersihkan
await db.order.deleteMany({ where: { userId: user.id } });
await db.cart.deleteMany({ where: { userId: user.id } });
await db.$disconnect();

console.log(gagal === 0 ? "\nSEMUA Pemeriksaan LULUS" : `\n${gagal} pemeriksaan GAGAL`);
process.exit(gagal === 0 ? 0 : 1);
