"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { buatSesi, getSession, hapusSesi, verifyPassword, hashPassword } from "@/lib/auth";
import {
  batalkanPesanan,
  LayananError,
  terimaPembayaran,
  tolakBukti,
  ubahStatusPesanan,
} from "@/lib/services/order";
import { produkSchema, tolakBuktiSchema, batalSchema, varianArraySchema } from "@/lib/validators";
import { slugify } from "@/lib/format";

type Hasil = { error?: string } | undefined;

async function wajibAdmin() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") redirect("/admin/masuk");
  return s;
}

export async function masukAdmin(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN" || !verifyPassword(password, user.passwordHash)) {
    return { error: "Email atau kata sandi admin tidak sesuai." };
  }
  await buatSesi(user.id, "ADMIN");
  redirect("/admin");
}

export async function keluarAdmin() {
  await hapusSesi();
  redirect("/admin/masuk");
}

export async function simpanProduk(_prev: Hasil, formData: FormData): Promise<Hasil> {
  await wajibAdmin();
  const parsed = produkSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      categoryId: formData.get("categoryId"),
      description: formData.get("description"),
      composition: formData.get("composition"),
      allergens: formData.get("allergens") || undefined,
      storageNote: formData.get("storageNote") || undefined,
      imageUrl: formData.get("imageUrl") || "",
      isActive: formData.get("isActive") === "on",
      variants: formData.get("variants"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  let varianMentah: unknown;
  try {
    varianMentah = JSON.parse(d.variants);
  } catch {
    return { error: "Data varian tidak valid. Periksa harga dan stok setiap varian." };
  }
  const varian = varianArraySchema.safeParse(varianMentah);
  if (!varian.success) return { error: varian.error.issues[0]?.message ?? "Data varian tidak valid." };

  let slug = slugify(d.name);
  const bentrok = await db.product.findFirst({ where: { slug, NOT: { id: d.id } } });
  if (bentrok) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const data = {
    categoryId: d.categoryId,
    name: d.name,
    slug,
    description: d.description,
    composition: d.composition,
    allergens: d.allergens || null,
    storageNote: d.storageNote || null,
    imageUrl: d.imageUrl || null,
    isActive: d.isActive,
  };

  if (d.id) {
    const lama = await db.product.findUnique({ where: { id: d.id }, include: { variants: true } });
    if (!lama) return { error: "Produk tidak ditemukan." };
    const idsDipakai = varian.data.filter((v) => v.id).map((v) => v.id!);
    // Varian yang dihapus dari form tidak di-drop (bisa dirujuk pesanan lama) — nonaktifkan saja.
    await db.$transaction([
      db.product.update({
        where: { id: d.id },
        data: {
          ...data,
          variants: {
            create: varian.data.filter((v) => !v.id).map((v) => ({ label: v.label, price: v.price, stock: v.stock })),
            update: varian.data
              .filter((v) => v.id)
              .map((v) => ({ where: { id: v.id! }, data: { label: v.label, price: v.price, stock: v.stock } })),
          },
        },
      }),
      db.productVariant.updateMany({
        where: { productId: d.id, id: { notIn: idsDipakai }, isActive: true },
        data: { isActive: false },
      }),
    ]);
  } else {
    await db.product.create({
      data: {
        ...data,
        variants: {
          create: varian.data.map((v) => ({ label: v.label, price: v.price, stock: v.stock })),
        },
      },
    });
  }
  revalidatePath("/katalog");
  redirect("/admin/produk?ok=" + encodeURIComponent("Produk tersimpan"));
}

export async function arsipProduk(formData: FormData) {
  await wajibAdmin();
  const id = String(formData.get("id"));
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return;
  // Arsip, bukan hapus permanen (BR-09): pesanan lama tetap utuh memakai snapshot.
  await db.product.update({
    where: { id },
    data: p.archivedAt
      ? { archivedAt: null, isActive: true }
      : { archivedAt: new Date(), isActive: false },
  });
  revalidatePath("/katalog");
  redirect("/admin/produk");
}

export async function verifikasiBayar(formData: FormData) {
  const s = await wajibAdmin();
  const id = String(formData.get("orderId"));
  try {
    await terimaPembayaran(id, "Admin");
  } catch (e) {
    redirect(`/admin/pesanan/${id}?err=${encodeURIComponent(e instanceof Error ? e.message : "Gagal")}`);
  }
  redirect(`/admin/pesanan/${id}?ok=${encodeURIComponent("Pembayaran diterima, pesanan Dikonfirmasi")}`);
}

export async function tolakBuktiAksi(formData: FormData) {
  await wajibAdmin();
  const parse = tolakBuktiSchema.safeParse({
    proofId: formData.get("proofId"),
    alasan: formData.get("alasan"),
  });
  if (!parse.success) {
    const orderId = String(formData.get("orderId"));
    redirect(`/admin/pesanan/${orderId}?err=${encodeURIComponent(parse.error.issues[0].message)}`);
  }
  try {
    await tolakBukti(parse.data.proofId, parse.data.alasan, "Admin");
  } catch (e) {
    const orderId = String(formData.get("orderId"));
    redirect(`/admin/pesanan/${orderId}?err=${encodeURIComponent(e instanceof Error ? e.message : "Gagal")}`);
  }
  const orderId = String(formData.get("orderId"));
  redirect(`/admin/pesanan/${orderId}?ok=${encodeURIComponent("Bukti ditolak. Pelanggan bisa unggah ulang.")}`);
}

export async function ubahStatusAksi(formData: FormData) {
  await wajibAdmin();
  const orderId = String(formData.get("orderId"));
  const to = String(formData.get("toStatus"));
  try {
    await ubahStatusPesanan(orderId, to, "Admin");
  } catch (e) {
    redirect(`/admin/pesanan/${orderId}?err=${encodeURIComponent(e instanceof Error ? e.message : "Gagal")}`);
  }
  redirect(`/admin/pesanan/${orderId}?ok=${encodeURIComponent(`Status diubah ke ${to}`)}`);
}

export async function batalAksi(formData: FormData) {
  await wajibAdmin();
  const orderId = String(formData.get("orderId"));
  const parse = batalSchema.safeParse({ orderId, alasan: formData.get("alasan") });
  if (!parse.success) {
    redirect(`/admin/pesanan/${orderId}?err=${encodeURIComponent(parse.error.issues[0].message)}`);
  }
  try {
    await batalkanPesanan(orderId, parse.data.alasan, "Admin");
  } catch (e) {
    redirect(`/admin/pesanan/${orderId}?err=${encodeURIComponent(e instanceof Error ? e.message : "Gagal")}`);
  }
  redirect(`/admin/pesanan/${orderId}?ok=${encodeURIComponent("Pesanan dibatalkan.")}`);
}
