import { z } from "zod";

export const daftarSchema = z.object({
  fullName: z.string().min(1, "Nama wajib diisi"),
  phone: z
    .string()
    .regex(/^\d{10,15}$/, "Nomor HP harus 10–15 digit angka"),
  email: z.string().email("Format email belum benar"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  setuju: z.string().refine((v) => v === "ya", {
    message: "Persetujuan penggunaan data wajib dicentang",
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Format email belum benar"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const checkoutSchema = z
  .object({
    customerName: z.string().min(1, "Nama wajib diisi"),
    customerPhone: z
      .string()
      .regex(/^\d{10,15}$/, "Nomor HP harus 10–15 digit angka"),
    customerEmail: z.string().email("Format email belum benar"),
    fulfillment: z.enum(["PICKUP", "DELIVERY"]),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus yyyy-mm-dd"),
    slotId: z.string().min(1, "Pilih jadwal pengambilan/pengantaran"),
    zoneId: z.string().optional(),
    addressSnapshot: z.string().max(500, "Alamat terlalu panjang").optional(),
  })
  .refine((d) => d.fulfillment !== "DELIVERY" || (d.zoneId && d.addressSnapshot), {
    message: "Pengantaran wajib memilih zona dan mengisi alamat",
    path: ["zoneId"],
  });

export const cartSchema = z.object({
  variantId: z.string().min(1),
  qty: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  note: z.string().max(150, "Hapus setidaknya 1 karakter (maksimal 150)").optional(),
});

export const produkSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama produk wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  composition: z.string().min(1, "Komposisi wajib diisi"),
  allergens: z.string().optional(),
  storageNote: z.string().optional(),
  imageUrl: z.string().url("URL gambar tidak valid").or(z.literal("")).optional(),
  isActive: z.boolean(),
  // JSON string dari array varian (dikirim input tersembunyi oleh form admin)
  variants: z.string().min(1, "Minimal satu varian wajib diisi"),
});

// Dipakai admin setelah JSON.parse dari field `variants`
export const varianArraySchema = z
  .array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, "Ukuran varian wajib diisi"),
      price: z.coerce.number().int().min(1, "Harga harus lebih dari Rp0"),
      stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
    })
  )
  .min(1, "Minimal satu varian wajib diisi");

export const tolakBuktiSchema = z.object({
  proofId: z.string().min(1),
  alasan: z.string().min(3, "Alasan penolakan wajib diisi"),
});

export const batalSchema = z.object({
  orderId: z.string().min(1),
  alasan: z.string().min(3, "Alasan pembatalan wajib diisi"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProdukInput = z.infer<typeof produkSchema>;
