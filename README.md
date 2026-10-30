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

Kedaluwarsa: cron `POST /api/cron/expire-orders` dengan header `x-cron-secret: $CRON_SECRET` (Vercel Cron memakai GET + `Authorization: Bearer $CRON_SECRET`, terjadwal di `vercel.json`), plus pemeriksaan lazy di halaman terkait.

## Deviasi dari PRD (sengaja, agar langsung jalan)

- **Database SQLite** (bukan MySQL) — tanpa server DB. Skema Prisma identik dengan model PRD; pindah MySQL cukup ganti `provider` + `DATABASE_URL`.
- **Tanpa NextAuth** — sesi cookie HMAC (scrypt untuk kata sandi), peran CUSTOMER/ADMIN. Auth.js bisa menggantikan nanti tanpa mengubah halaman.
- Tanpa cache/revalidateTag, rate limit, foto produk via unggah (pakai URL opsional), halaman Kelola Kategori, Stok & Kuota, dan Laporan (semuanya v1.1/TBD di PRD).
- Font Lora/Inter memakai stack CSS (fallback Georgia/system-ui) agar build tidak butuh unduhan font.
- Penyimpanan bukti: blob di kolom `PaymentProof.data` (DB) — serverless-friendly, tetap disajikan lewat route terautorisasi.

## Catatan keamanan yang sudah ada

Otorisasi dicek di layout admin **dan** setiap Server Action/DAL; bukti disajikan lewat route handler terautorisasi (bukan `public/`); magic bytes dicek saat unggah; stok dipotong atomik (update bersyarat, tidak negatif); QRIS demo — jangan bayar sungguhan.

## Deploy ke Vercel

Persiapan sekali di komputer:

1. Buat database **Turso** (SQLite-compatible, cocok dengan skema Prisma ini):
   ```bash
   turso db create kubo
   turso db show kubo          # dapatkan URL, mis. libsql://kubo-org.turso.io
   turso db tokens create kubo # dapatkan token
   ```
2. Salin `.env.example` → `.env`, isi `DATABASE_URL` dengan URL Turso + `TURSO_AUTH_TOKEN` (variabel `AUTH_SECRET` & `CRON_SECRET` diisi acak).
3. Push skema + isi data contoh ke Turso (sekali, atau ulang setelah ubah skema/seed):
   ```bash
   npm run db:push
   npm run db:seed
   ```
   Lokal tetap jalan tanpa Turso: `DATABASE_URL=file:./prisma/dev.db` tanpa `TURSO_AUTH_TOKEN`.

Di Vercel (import repositori GitHub):

1. Environment Variables (Production & Preview): `DATABASE_URL` (URL Turso), `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `CRON_SECRET` — nilai sama dengan di atas.
2. Deploy. `postinstall` menjalankan `prisma generate` otomatis; `vercel.json` menjadwalkan `GET /api/cron/expire-orders` tiap tengah malam (plan Hobby Vercel hanya mengizinkan cron harian; Vercel otomatis mengirim `Authorization: Bearer $CRON_SECRET`).
3. Cron butuh plan yang mendukung Vercel Cron; bila tidak ada, jalankan cron dari penyedia eksternal (mis. cron-job.org) dengan `POST /api/cron/expire-orders` + header `x-cron-secret`. Tanpa cron pun pesanan kedaluwarsa tetap dibatalkan lewat pemeriksaan lazy saat halaman dibuka.

Catatan: bukti bayar disimpan sebagai blob di DB (`PaymentProof.data`), foto produk di `public/images/` — tidak ada yang bergantung pada disk lokal, jadi aman untuk serverless.
