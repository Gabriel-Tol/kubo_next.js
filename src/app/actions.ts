"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  buatSesi,
  getSession,
  hapusSesi,
  peekGuestToken,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { getOrCreateKeranjang, gabungKeranjangTamu } from "@/lib/services/cart";
import { buatPesanan, LayananError } from "@/lib/services/order";
import { cartSchema, checkoutSchema, daftarSchema, loginSchema } from "@/lib/validators";

type Hasil = { error?: string } | undefined;

export async function daftar(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const parse = daftarSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    setuju: formData.get("setuju"),
  });
  if (!parse.success) {
    return { error: parse.error.issues[0].message };
  }
  const d = parse.data;
  const ada = await db.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (ada) return { error: "Email ini sudah terdaftar. Gunakan Masuk." };
  const user = await db.user.create({
    data: {
      email: d.email.toLowerCase(),
      passwordHash: hashPassword(d.password),
      fullName: d.fullName,
      phone: d.phone,
      role: "CUSTOMER",
    },
  });
  await gabungKeranjangTamu(user.id, await peekGuestToken());
  await buatSesi(user.id, "CUSTOMER");
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/katalog");
}

export async function masuk(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const parse = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parse.success) return { error: parse.error.issues[0].message };
  const user = await db.user.findUnique({ where: { email: parse.data.email.toLowerCase() } });
  if (!user || !verifyPassword(parse.data.password, user.passwordHash)) {
    return { error: "Email atau kata sandi tidak sesuai." };
  }
  if (user.role === "ADMIN") return { error: "Akun ini akun admin. Gunakan halaman login admin." };
  await gabungKeranjangTamu(user.id, await peekGuestToken());
  await buatSesi(user.id, "CUSTOMER");
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/pesanan");
}

export async function keluar() {
  await hapusSesi();
  redirect("/");
}

export async function tambahKeranjang(formData: FormData) {
  const parse = cartSchema.safeParse({
    variantId: formData.get("variantId"),
    qty: formData.get("qty"),
    note: formData.get("note") || undefined,
  });
  if (!parse.success) redirect("/keranjang");
  const { variantId, qty, note } = parse.data;

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || !variant.isActive || variant.product.archivedAt) redirect("/katalog");

  const cart = await getOrCreateKeranjang();
  const existing = cart.items.find((i) => i.variantId === variantId);
  const baruQty = (existing?.qty ?? 0) + qty;
  if (baruQty > variant.stock) {
    redirect(`/produk/${variant.product.slug}?err=${encodeURIComponent(
      `Jumlah maksimal tercapai. Stok tersisa ${variant.stock}.`
    )}`);
  }
  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { qty: baruQty, note: note ?? existing.note } });
  } else {
    await db.cartItem.create({ data: { cartId: cart.id, variantId, qty, note: note || null } });
  }
  redirect("/keranjang");
}

export async function ubahKeranjang(formData: FormData) {
  const id = String(formData.get("itemId"));
  const qty = Math.max(1, Number(formData.get("qty")) || 1);
  const cart = await getOrCreateKeranjang();
  const item = cart.items.find((i) => i.id === id);
  if (!item) redirect("/keranjang");
  if (qty > item.variant.stock) {
    redirect(`/keranjang?err=${encodeURIComponent(`Jumlah maksimal tercapai. Stok tersisa ${item.variant.stock}.`)}`);
  }
  await db.cartItem.update({ where: { id }, data: { qty } });
  redirect("/keranjang");
}

export async function hapusKeranjang(formData: FormData) {
  const id = String(formData.get("itemId"));
  const cart = await getOrCreateKeranjang();
  if (cart.items.some((i) => i.id === id)) {
    await db.cartItem.delete({ where: { id } });
  }
  redirect("/keranjang");
}

export async function checkout(prev: Hasil, formData: FormData): Promise<Hasil> {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk?next=/checkout");
  const parse = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail"),
    fulfillment: formData.get("fulfillment"),
    scheduledDate: formData.get("scheduledDate"),
    slotId: formData.get("slotId"),
    zoneId: formData.get("zoneId") || undefined,
    addressSnapshot: formData.get("addressSnapshot") || undefined,
  });
  if (!parse.success) return { error: parse.error.issues[0].message };
  try {
    const order = await buatPesanan(s.userId, parse.data);
    redirect(`/pesanan/${order.orderNo}/bayar`);
  } catch (e) {
    if (e instanceof LayananError) return { error: e.message };
    throw e;
  }
}

const MAX_BUKTI = 2 * 1024 * 1024;

function magicBytes(buf: Buffer): "image/jpeg" | "image/png" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length > 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return "image/png";
  return null;
}

export async function unggahBukti(prev: Hasil, formData: FormData): Promise<Hasil> {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk");
  const orderNo = String(formData.get("orderNo"));
  const order = await db.order.findUnique({ where: { orderNo }, include: { proofs: true } });
  if (!order || order.userId !== s.userId) redirect("/pesanan");
  if (order.status !== "Menunggu Pembayaran") {
    return { error: "Pesanan ini sudah tidak menunggu pembayaran." };
  }
  if (order.paymentDueAt < new Date()) redirect(`/pesanan/${orderNo}`);

  const file = formData.get("bukti");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih berkas bukti pembayaran terlebih dahulu." };
  }
  if (file.size > MAX_BUKTI) {
    return { error: "Ukuran berkas terlalu besar. Maksimal 2 MB — foto ulang atau screenshot lebih kecil." };
  }
  const mime = ["image/jpeg", "image/png"].includes(file.type)
    ? (file.type as "image/jpeg" | "image/png")
    : null;
  if (!mime) {
    return { error: "Format berkas salah. Hanya JPG atau PNG yang diterima." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const magic = magicBytes(buf);
  if (!magic || magic !== mime) {
    return { error: "Isi berkas bukan gambar JPG/PNG yang sah. Unggah ulang foto bukti asli." };
  }

  const { randomBytes } = await import("node:crypto");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const namaAcak = randomBytes(16).toString("hex") + (mime === "image/png" ? ".png" : ".jpg");
  const dir = path.join(process.cwd(), "storage", "bukti");
  await mkdir(dir, { recursive: true });
  const rel = path.join("storage", "bukti", namaAcak);
  await writeFile(path.join(process.cwd(), rel), buf);

  await db.paymentProof.create({
    data: {
      orderId: order.id,
      filePath: rel,
      originalName: file.name,
      sizeBytes: file.size,
      mime,
      status: "SUBMITTED",
    },
  });
  redirect(`/pesanan/${orderNo}/konfirmasi`);
}

export async function simpanProfil(formData: FormData) {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk?next=/akun");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!fullName) redirect("/akun?err=" + encodeURIComponent("Nama wajib diisi"));
  if (!/^\d{10,15}$/.test(phone)) {
    redirect("/akun?err=" + encodeURIComponent("Nomor HP harus 10–15 digit angka"));
  }
  await db.user.update({ where: { id: s.userId }, data: { fullName, phone } });
  redirect("/akun?ok=" + encodeURIComponent("Profil tersimpan"));
}

export async function tambahAlamat(formData: FormData) {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk?next=/akun");
  const label = String(formData.get("label") ?? "").trim();
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const zoneId = String(formData.get("zoneId") ?? "");
  const landmark = String(formData.get("landmark") ?? "").trim();
  const zone = await db.deliveryZone.findUnique({ where: { id: zoneId } });
  if (!label || !recipientName || !street || !zone) {
    redirect("/akun?err=" + encodeURIComponent("Semua kolom wajib alamat kecuali patokan wajib diisi"));
  }
  if (!/^\d{10,15}$/.test(phone)) {
    redirect("/akun?err=" + encodeURIComponent("Nomor HP penerima harus 10–15 digit angka"));
  }
  await db.address.create({
    data: { userId: s.userId, label, recipientName, phone, street, zoneId, landmark: landmark || null },
  });
  redirect("/akun?ok=" + encodeURIComponent("Alamat tersimpan"));
}
