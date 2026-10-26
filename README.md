# KUBO — Toko Bolu "Bolu Hangat" (Next.js)

Implementasi MVP PRD (App Router, TypeScript, Tailwind, Prisma, SQLite). Dua sisi: toko pelanggan + ruang admin.

## Menjalankan

```bash
npm install
npx prisma migrate dev --name init   # buat tabel
npm run db:seed                      # data contoh (Lampiran A PRD)
npm run dev                          # http://localhost:3000
npm run test                         # unit test mesin status & total
```

## Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | admin@kubo.id | admin12345 |
| Pelanggan | nabila@contoh.id | cobain123 |

Admin masuk lewat `/admin/masuk` (terpisah dari pelanggan).

## Alur utama

Pelanggan: katalog → keranjang (persisten, tamu digabung saat login) → checkout (ambil/antar + zona + slot) → bayar (unggah bukti JPG/PNG ≤ 2 MB, batas 60 menit) → lacak status.
Admin: dashboard → verifikasi bukti (terima/tolak) → ubah status sesuai urutan valid → batal (stok kembali bila sudah terpotong).

Kedaluwarsa: cron `POST /api/cron/expire-orders` dengan header `x-cron-secret: $CRON_SECRET`, plus pemeriksaan lazy di halaman terkait.

## Deviasi dari PRD (sengaja, agar langsung jalan)

- **Database SQLite** (bukan MySQL) — tanpa server DB. Skema Prisma identik dengan model PRD; pindah MySQL cukup ganti `provider` + `DATABASE_URL`.
- **Tanpa NextAuth** — sesi cookie HMAC (scrypt untuk kata sandi), peran CUSTOMER/ADMIN. Auth.js bisa menggantikan nanti tanpa mengubah halaman.
- Tanpa cache/revalidateTag, rate limit, foto produk via unggah (pakai URL opsional), halaman Kelola Kategori, Stok & Kuota, dan Laporan (semuanya v1.1/TBD di PRD).
- Font Lora/Inter memakai stack CSS (fallback Georgia/system-ui) agar build tidak butuh unduhan font.
- Penyimpanan bukti: `./storage/bukti` (disk lokal) — wajib object storage bila deploy serverless.

## Catatan keamanan yang sudah ada

Otorisasi dicek di layout admin **dan** setiap Server Action/DAL; bukti disajikan lewat route handler terautorisasi (bukan `public/`); magic bytes dicek saat unggah; stok dipotong atomik (update bersyarat, tidak negatif); rekening demo — jangan transfer.
