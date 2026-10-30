# Product Requirements Document (PRD)

## Web E-Commerce Toko Bolu "Bolu Hangat" (KUBO) — Next.js

| Atribut | Isi |
|---|---|
| Versi dokumen | 1.2 (draf) — disesuaikan dengan implementasi berjalan: pembayaran QRIS manual, foto produk lokal `public/images/`, 5 produk, domisili Pontianak, token tema + mode gelap |
| Tanggal | 30 Oktober 2026 |
| Sumber kebutuhan | Rancangan UI `My_Best.pdf` (pelanggan 360/768/1280 px, admin 1280/360 px, papan *states & handoff*) |
| Framework | Next.js (App Router, TypeScript) |
| Konteks | Studi kasus / tugas kuliah; toko tunggal, satu outlet di Pontianak |
| Status nama & data | Nama toko "Bolu Hangat" (logo **KUBO**) bersifat **sementara**. Produk, harga, zona, kode QRIS, kontak, dan jadwal adalah **data contoh** dan perlu dikonfirmasi pemilik toko |

> **Catatan penggunaan label.** `[ASUMSI]` = keputusan sementara agar PRD bisa dieksekusi; `[TBD]` = harus ditetapkan pemilik/dosen sebelum implementasi.

---

## 1. Executive Summary

### 1.1 Problem Statement

Toko kue bolu rumahan dengan satu outlet menerima pesanan secara manual (chat), sehingga rawan salah catat jumlah, ucapan, jadwal ambil/antar, dan sulit memverifikasi bukti pembayaran. Pemilik tidak memiliki ringkasan pesanan, status produksi, maupun riwayat yang rapi.

### 1.2 Proposed Solution

Web e-commerce berbahasa Indonesia berbasis **Next.js** dengan dua sisi: (a) **toko pelanggan** (katalog → keranjang → checkout ambil di toko / antar lokal → bayar via QRIS & unggah bukti → lacak status) dan (b) **ruang admin** (kelola produk, verifikasi pembayaran, ubah status pesanan, dashboard operasional). Pembayaran **QRIS manual** (kode statis, scan di aplikasi bank/e-wallet) diverifikasi admin; tanpa payment gateway/QRIS dinamis, GPS, voucher, atau antar kota.

### 1.3 Success Criteria (KPI)

| # | KPI | Target terukur | Cara ukur |
|---|---|---|---|
| K1 | Alur utama pelanggan end-to-end (daftar → pesan → unggah bukti → lihat status) berjalan | 100% skenario uji utama lulus (minimal 25 test case blackbox, 0 *blocker*) | Uji blackbox + Vitest + Playwright |
| K2 | Waktu pelanggan terdaftar menyelesaikan pemesanan (keranjang → bukti terkirim) | ≤ 3 menit pada uji 5 responden | Uji kegunaan terjadwal |
| K3 | Akurasi data pesanan (total, ongkir, ucapan, jadwal) antara layar checkout dan detail admin | 100% konsisten pada 30 pesanan uji | Uji perbandingan otomatis |
| K4 | Waktu muat halaman katalog (5 produk) pada server lokal/hosting uji | p95 ≤ 2 detik (jaringan 4G simulasi) | Lighthouse / DevTools |
| K5 | Aksesibilitas halaman pelanggan | Skor Lighthouse Accessibility ≥ 90; kontras teks ≥ 4,5:1; target sentuh ≥ 44 px | Lighthouse + inspeksi manual |
| K6 | Integritas stok | 0 kasus stok negatif pada uji 20 konfirmasi/pembatalan acak | Test otomatis model/service |

---

## 2. User Experience & Functionality

### 2.1 User Personas

| Persona | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Pelanggan (mis. Nabila Putri)** | Pembeli lokal Pontianak, mobile-first (360 px), memesan bolu untuk acara keluarga | Memilih bolu cepat, menulis ucapan, memilih ambil/antar + slot waktu, tahu status pesanan jujur |
| **Admin / Staf toko (mis. Ayu)** | Staf/pemilik yang memeriksa bukti pembayaran (QRIS) dan memproses pesanan, memakai desktop & sesekali ponsel | Antrian pesanan jelas, verifikasi pembayaran aman, ubah status tercatat, produk mudah diperbarui |
| **Pemilik toko** | Pengambil keputusan aturan bisnis | Ringkasan penjualan, kontrol harga/stok, aturan batas bayar & ongkir |

Akun pelanggan **terpisah** dari akses admin (grup/peran berbeda, halaman login berbeda).

### 2.2 Peta Layar

**Pelanggan (360 px)**: Beranda → Katalog → Detail produk → Keranjang → Checkout (ambil / antar) → Pembayaran → Konfirmasi → Lacak. Pendukung: Riwayat pesanan, Masuk, Daftar, Akun & alamat.
**Responsif (768 & 1280 px)**: Beranda, Katalog, Checkout antar.
**Admin (1280 px)**: Login admin, Dashboard, Produk, Edit produk & kategori, Pesanan, Detail & verifikasi, Stok/kuota *(v1.1)*, Laporan *(v1.1)*. Dashboard & Detail pesanan juga 360 px.
**States**: keranjang kosong, katalog tanpa hasil, loading skeleton, stok habis, batas jumlah, di luar layanan, kolom wajib, kata sandi tidak valid, catatan >150 karakter, format/ukuran bukti salah, pembayaran kedaluwarsa, validasi produk admin, tolak bukti.

### 2.3 User Stories & Acceptance Criteria

#### Modul A — Katalog & Produk (Pelanggan)

**US-01** — *Sebagai pelanggan, saya ingin melihat beranda toko agar tahu pilihan favorit dan cara menerima pesanan.*
- Beranda menampilkan hero, chip kategori (Semua bolu + kategori aktif — kini hanya **Bolu klasik**), 3 produk "Favorit dari oven", info Ambil di toko & Antar sekitar Anda.
- Tombol "Belanja bolu" mengarah ke katalog.
- Menu: Beranda, Katalog, Pesanan, Akun; menu admin tidak pernah tampil di toko.

**US-02** — *Sebagai pelanggan, saya ingin mencari, memfilter, dan mengurutkan bolu agar cepat menemukan rasa favorit.*
- Pencarian berdasarkan nama (parsial, tidak peka huruf besar/kecil).
- Filter kategori dan rentang harga (Rp0–Rp100.000); tombol "Terapkan filter" dan "Reset filter".
- Urutan default: Nama A–Z; menampilkan jumlah hasil ("5 produk").
- Produk habis tampil dengan label **Habis** dan tombol nonaktif "Stok habis".
- Tanpa hasil: pesan "Belum ketemu." dengan tombol "Reset pencarian & filter".
- Loading menggunakan kerangka kartu agar layout tidak melompat.
- Hanya produk berstatus aktif (tidak diarsipkan) yang tampil.

**US-03** — *Sebagai pelanggan, saya ingin melihat detail bolu dan memilih ukuran, jumlah, serta ucapan.*
- Breadcrumb: Katalog / Kategori / Nama produk; label stok ("Tersedia 8 bolu ukuran 20 cm").
- Pilihan varian (mis. 20 cm & 24 cm keduanya Rp20.000) memperbarui harga, perkiraan potongan, dan stok tersedia.
- Jumlah minimal 1; tombol minus nonaktif saat 1; maksimal = stok varian (contoh 8); pesan "Jumlah maksimal tercapai" saat batas.
- Catatan/ucapan opsional maksimal **150 karakter** dengan penghitung (mis. 24/150); >150 menampilkan error "Hapus setidaknya 1 karakter" dan tombol tambah ke keranjang tertahan.
- Subtotal baris dihitung langsung (mis. 2 × Rp20.000 = Rp40.000).
- Komposisi, alergen, dan saran penyimpanan ditampilkan.

#### Modul B — Keranjang & Checkout

**US-04** — *Sebagai pelanggan, saya ingin mengelola keranjang agar bisa mengubah pesanan sebelum checkout.*
- Keranjang menampilkan stepper 4 langkah (Keranjang, Checkout, Bayar, Konfirmasi), item, harga satuan, ucapan, ubah jumlah, hapus, subtotal.
- Keranjang **tetap tersimpan setelah reload** (cookie token tamu → tabel keranjang; digabung ke akun saat login).
- Keranjang kosong menampilkan ajakan "Jelajahi katalog".
- Pengguna belum login diarahkan ke Masuk saat menekan "Lanjut ke checkout", lalu kembali ke checkout.
- Jika stok berubah, tampil pesan dan pelanggan diminta memperbarui jumlah.

**US-05** — *Sebagai pelanggan, saya ingin memilih ambil di toko atau antar lokal serta jadwalnya.*
- Data pemesan (nama, HP, email) terisi otomatis dari akun dan tetap dapat diedit untuk pesanan itu.
- **Ambil di toko**: menampilkan alamat toko, jam buka, ongkir Rp0.
- **Antar lokal**: pilih alamat tersimpan atau isi baru; pilih **zona** (contoh: Zona A Pontianak Kota Rp10.000, Zona B Pontianak Utara Rp20.000); patokan opsional; ongkir tetap sesuai zona.
- Alamat di luar zona menampilkan "Area ini belum terlayani" dengan aksi "Ganti ke ambil di toko".
- Pilih **tanggal** dan **slot waktu** (08.00–10.00, 10.00–12.00, 13.00–15.00, 15.00–17.00). Slot **Lewat** (melewati batas pemesanan) dan **Penuh** tidak dapat dipilih.
- Validasi sisi server untuk stok, harga, zona, alamat, dan slot sebelum pesanan dibuat; validasi kolom wajib menyebut sebab dan perbaikan (tidak hanya warna): nama wajib; HP 10–15 digit; email valid.
- Ringkasan pesanan: item, ucapan, subtotal, ongkir, total (mis. Rp40.000 + Rp20.000 = Rp60.000).

**US-06** — *Sebagai pelanggan, saya ingin membayar lewat QRIS dan mengunggah bukti.*
- Pesanan dibuat dengan status **Menunggu Pembayaran**, nomor format `#BH-DDMMYY-NNN` (mis. BH-161026-024).
- Halaman bayar menampilkan batas waktu (**contoh 60 menit** sejak pesanan dibuat) dengan hitung mundur, **kode QRIS** (gambar hasil crop dari poster statis toko, `public/images/qris-qr.webp`, dengan quiet zone putih), total pembayaran, dan 3 langkah cara bayar (buka aplikasi bank/e-wallet berlogo QRIS → scan → bayar tepat total).
- Karena QR statis tidak membawa nominal otomatis, pelanggan mengetik nominal sesuai total; halaman menampilkan peringatan "QRIS demo — jangan bayar sungguhan".
- Unggah bukti: screenshot struk QRIS, **hanya JPG/PNG, maksimal 2 MB**, divalidasi di klien **dan server**; pesan error spesifik untuk format salah dan ukuran terlalu besar; tombol "Ganti berkas".
- Setelah kirim: layar Konfirmasi menyatakan "Menunggu verifikasi manual — bukti terkirim bukan berarti pembayaran disetujui".
- Pelanggan dapat mengunggah ulang bila bukti ditolak selama batas waktu belum habis.
- Bila batas waktu habis tanpa pembayaran diterima, pesanan otomatis **Dibatalkan** (alasan "Batas pembayaran berakhir") dan tersedia "Buat pesanan baru".

#### Modul C — Pelacakan & Akun

**US-07** — *Sebagai pelanggan, saya ingin melacak status pesanan agar tahu kapan bolu siap.*
- Linimasa status: Menunggu Pembayaran → Dikonfirmasi → Diproses → Siap Diambil / Sedang Diantar → Selesai, masing-masing dengan stempel waktu; tahap berikutnya menampilkan "Menunggu tahap sebelumnya".
- Cabang ambil: instruksi "Datang setelah status Siap Diambil, tunjukkan nomor pesanan". Cabang antar: "Tidak ada pelacakan GPS".
- Tombol "Hubungi toko" (kontak dari pengaturan).
- Riwayat pesanan memiliki tab **Semua** dan **Aktif (n)** dengan kartu ringkasan (nomor, status, tanggal, item, metode, total) dan tautan "Lihat detail pesanan".

**US-08** — *Sebagai pelanggan, saya ingin mendaftar, masuk, dan mengelola profil serta alamat.*
- Daftar: nama lengkap, HP, email (unik), kata sandi **minimal 8 karakter**; pesan error "Kata sandi minimal 8 karakter" dan tombol "Buat akun" tertahan saat tidak valid; persetujuan penggunaan data.
- Masuk dengan email + kata sandi, tombol tampil/sembunyi kata sandi.
- Profil dapat disimpan; alamat tersimpan (label, penerima, alamat lengkap, area layanan, patokan) dapat ditambah/diedit; tombol "Keluar dari akun".
- Data pribadi dibatasi pada nama, HP, email, alamat.

#### Modul D — Admin

**US-09** — *Sebagai admin, saya ingin masuk ke ruang admin dengan akun peran admin.*
- Halaman login admin terpisah dari pelanggan; akun pelanggan **ditolak** (redirect/403) pada rute `/admin/*`.
- Navigasi sidebar 220 px (Dashboard, Produk, Pesanan, Stok & kuota, Laporan) dan tautan "Lihat toko", "Keluar dari admin".

**US-10** — *Sebagai admin, saya ingin dashboard operasional agar tahu prioritas hari ini.*
- Kartu: Pesanan hari ini, Penjualan terkonfirmasi (tanpa ongkir, tanpa batal), Perlu verifikasi (bukti masuk + belum unggah).
- Antrian produksi (Diproses, Siap diambil, Sedang diantar), kartu "Butuh perhatian" dengan tombol "Verifikasi pembayaran", daftar "Pesanan terbaru".
- Seluruh angka dihitung dari database, bukan hard-code.

**US-11** — *Sebagai admin, saya ingin mengelola produk, varian, dan kategori tanpa kehilangan riwayat pesanan.*
- Daftar produk: cari, filter kategori & status, kolom varian/harga, stok/status, aksi Edit & Arsipkan; tautan "Arsip (n)".
- Form tambah/edit: nama*, deskripsi*, komposisi* (termasuk alergen), kategori*, varian (ukuran, harga > Rp0, stok) minimal satu varian aktif, foto produk opsional (URL eksternal atau path lokal `/images/…`, rasio 1:1), status publikasi.
- Validasi: nama wajib, harga > Rp0, `imageUrl` berupa URL valid atau path `/…` (boleh kosong); fokus ke error pertama, nilai lain tidak hilang.
- **Arsip** menyembunyikan dari katalog; **tidak ada penghapusan** yang merusak riwayat. Pesanan lama memakai *snapshot* nama/harga saat pesanan dibuat.
- Kelola kategori: tambah, ubah nama; kategori yang masih dipakai tidak dapat dihapus kecuali produk dipindahkan terlebih dahulu.

**US-12** — *Sebagai admin, saya ingin memverifikasi pembayaran dengan teliti.*
- Detail pesanan menampilkan bukti (pratinjau + "Perbesar bukti"), nominal yang harus diterima, metode QRIS, pelanggan, penerimaan (alamat hanya untuk antar), item, ringkasan, dan riwayat perubahan.
- Aksi **Terima pembayaran** (→ Dikonfirmasi) dan **Tolak bukti** (wajib alasan; pesanan tetap Menunggu Pembayaran dan pelanggan bisa unggah ulang).
- Teks di gambar bukti tidak dianggap verifikasi; admin mengonfirmasi lewat mutasi QRIS di aplikasi penyedia (peringatan tampil di UI).
- Setiap perubahan status mencatat **waktu dan pelaku**.

**US-13** — *Sebagai admin, saya ingin mengubah status pesanan sesuai urutan yang valid.*
- Urutan valid: Menunggu Pembayaran → Dikonfirmasi → Diproses → Siap Diambil (ambil) / Sedang Diantar (antar) → Selesai. **Dibatalkan** adalah cabang terpisah, bukan tahap setelah Selesai.
- Sistem menolak loncatan status tidak valid (mis. Menunggu Pembayaran → Diproses) dan transisi dari Selesai/Dibatalkan.
- Pembatalan wajib alasan; jika pesanan pernah mengurangi stok, stok dikembalikan; jika belum, stok tidak berubah.
- Daftar pesanan: cari nomor/nama, filter tanggal & status, tombol cepat "Perlu verifikasi (n)", paginasi.

**US-14** *(v1.1)* — *Sebagai admin, saya ingin mengatur stok harian dan kuota produksi per slot.*
- Halaman Stok & Kuota per tanggal produksi: stok awal, terkonfirmasi, tersedia, status; kuota per slot (terpakai/tersisa/Penuh/Lewat batas).

**US-15** *(v1.1)* — *Sebagai pemilik, saya ingin laporan penjualan harian/bulanan.*
- Pesanan terkonfirmasi, penjualan produk (tanpa ongkir, tanpa batal), bolu terjual, grafik 7 hari, 5 produk terlaris; harga historis mengikuti harga saat pesanan dibuat.

### 2.4 Non-Goals

Tidak dibangun pada proyek ini: aplikasi native (Android/iOS), payment gateway / pembayaran otomatis & QRIS dinamis (QRIS **statis manual** sudah dipakai), voucher/promo, pelacakan GPS, pengiriman antar kota/kurir pihak ketiga, multi-outlet/multi-toko, ulasan & rating, notifikasi WhatsApp/SMS otomatis, program loyalitas, refund otomatis, serta multi-bahasa (hanya Bahasa Indonesia).

### 2.5 Aturan Bisnis Utama

| Kode | Aturan |
|---|---|
| BR-01 | Jumlah per item: min 1, maks = stok varian. Catatan maks 150 karakter. |
| BR-02 | Ongkir tetap per zona; hanya zona terdaftar (contoh: A Pontianak Kota Rp10.000, B Pontianak Utara Rp20.000). Ambil di toko Rp0. |
| BR-03 | Total = subtotal item + ongkir. Ongkir **tidak** dihitung sebagai penjualan produk di laporan. |
| BR-04 | Batas bayar default 60 menit sejak pesanan dibuat `[TBD pemilik]`. Lewat batas tanpa pembayaran diterima → Dibatalkan otomatis. |
| BR-05 | Bukti masuk ≠ pembayaran terverifikasi. Hanya admin yang mengubah ke Dikonfirmasi. |
| BR-06 | Stok berkurang **saat Dikonfirmasi** (bukan saat checkout/bukti masuk). Pembatalan setelah konfirmasi mengembalikan stok; pengembalian hanya untuk pesanan yang pernah mengurangi stok. |
| BR-07 | Slot **Lewat** (melewati batas pemesanan `[TBD: lead time]`) dan **Penuh** tidak dapat dipilih. |
| BR-08 | Harga & nama produk pada pesanan adalah *snapshot*; perubahan katalog tidak mengubah pesanan lama. |
| BR-09 | Produk tidak dihapus permanen jika pernah dipesan; gunakan arsip. |
| BR-10 | Pembayaran hanya QRIS manual (kode statis; nominal diketik sesuai total, verifikasi admin); pesanan tanpa pembayaran diterima dibatalkan setelah batas waktu. |

---

## 3. AI System Requirements

**Tidak berlaku.** Produk ini tidak memakai fitur AI di dalam aplikasi. (Asisten AI hanya boleh dipakai pada proses pengembangan, di luar lingkup produk.)

---

## 4. Technical Specifications

### 4.1 Tech Stack

| Lapisan | Pilihan | Keterangan |
|---|---|---|
| Framework | **Next.js (App Router)** + React + **TypeScript** | Sesuai permintaan. Versi stabil terbaru `[TBD]` saat inisialisasi; Node.js LTS |
| Rendering | Server Components (RSC) untuk katalog/detail; Client Components hanya untuk interaksi | Katalog & detail memakai cache + `revalidateTag` saat admin mengubah produk; checkout/akun/admin bersifat dinamis (tanpa cache) |
| Mutasi | **Server Actions** (form) + **Route Handlers** (unggah berkas, cron, penyajian bukti) | Semua mutasi divalidasi ulang di server |
| Database | MySQL / MariaDB `[ASUMSI]` | `utf8mb4`, *foreign key* aktif, zona waktu `Asia/Jakarta` pada aplikasi |
| ORM & migrasi | **Prisma** `[ASUMSI]` | `prisma migrate` + `prisma db seed`; transaksi lewat `prisma.$transaction` |
| Autentikasi | **Auth.js (NextAuth) Credentials** `[ASUMSI]` | Peran `CUSTOMER` / `ADMIN`; kata sandi di-hash dengan argon2/bcrypt |
| Validasi | **Zod** | Skema bersama untuk form (klien) dan Server Action (server) |
| Tampilan | Tailwind CSS + komponen sendiri (aksesibel, boleh berbasis Radix primitives) `[ASUMSI]` | Token warna & tipografi dari papan handoff (lihat 4.8) |
| Font | `next/font` — Lora & Inter | Tanpa lompatan layout |
| Grafik (v1.1) | Recharts `[ASUMSI]` | Grafik penjualan 7 hari |
| Penyimpanan berkas | Penyimpanan **privat**: disk server (VPS) atau object storage S3-compatible `[TBD]` | Foto produk publik; bukti bayar privat |
| Penjadwalan | Cron sistem / cron platform memanggil Route Handler terproteksi | Kedaluwarsa pesanan otomatis |
| Pengujian | Vitest (unit/service), Playwright (E2E) | Lihat 4.10 |
| Hosting | `[TBD]` | Disarankan Node server/VPS atau container; bila memakai platform serverless, berkas bukti **wajib** di object storage (disk tidak persisten) |

### 4.2 Arsitektur

Aplikasi **monolit Next.js** satu repositori: UI, Server Actions, Route Handlers, dan lapisan domain berjalan di proses Node yang sama.

```
Browser (pelanggan / admin)
        │ HTTPS
        ▼
 Next.js (App Router)
   ├─ middleware / proxy        → pemeriksaan sesi awal & redirect (BUKAN satu-satunya otorisasi)
   ├─ app/(shop)/…              → Beranda, Katalog, Produk, Keranjang, Checkout, Bayar, Pesanan, Akun
   ├─ app/(auth)/…              → Masuk, Daftar
   ├─ app/admin/…               → Dashboard, Produk, Kategori, Pesanan, Stok*, Laporan*
   └─ app/api/…                 → upload bukti, /berkas/bukti/[id], /cron/expire-orders
            │
            ▼
   Server Actions / Route Handlers  (validasi Zod → panggil service)
            │
            ▼
   lib/services/   cart · checkout · pricing · slot · payment-proof · order-status · stock · expiry
   lib/dal/        Data Access Layer: SETIAP fungsi membaca sesi & memeriksa peran/kepemilikan
            │
            ▼
   Prisma ──► MySQL          Penyimpanan berkas (privat/publik)
```
\* = v1.1

**Prinsip:**
1. Semua aturan bisnis (harga, ongkir, stok, slot, transisi status) berada di `lib/services` dan divalidasi ulang di server; data dari klien hanyalah *input*.
2. **Otorisasi dilakukan di Data Access Layer dan di setiap Server Action/Route Handler**, bukan hanya di middleware. Middleware hanya untuk redirect cepat.
3. Server Action diperlakukan sebagai endpoint publik: selalu cek sesi, peran, dan kepemilikan sebelum membaca/menulis.

**Struktur folder (usulan)**

```
src/
  app/
    (shop)/ page.tsx, katalog/, produk/[slug]/, keranjang/, checkout/, pesanan/, akun/
    (auth)/ masuk/, daftar/
    admin/  page.tsx, produk/, kategori/, pesanan/, stok/, laporan/
    api/    upload/bukti/, berkas/bukti/[id]/, cron/expire-orders/
  lib/ services/, dal/, validators/ (zod), auth.ts, db.ts, storage.ts, format.ts
  components/ ui/ (ProductCard, FormField, OrderRow, StatusBadge, SummaryRow), shop/, admin/
prisma/ schema.prisma, migrations/, seed.ts
tests/  unit/, e2e/
```

### 4.3 Model Data (Entitas Utama)

| Tabel / Model | Kolom penting |
|---|---|
| `User` (+ `Account`/`Session` bila memakai adapter) | id, email (unik), passwordHash, role (`CUSTOMER`/`ADMIN`), createdAt |
| `CustomerProfile` | userId (FK), fullName, phone |
| `Address` | id, userId, label, recipientName, phone, street, zoneId (FK), landmark, isDefault |
| `DeliveryZone` | id, name (Zona A/B), areaLabel (Pontianak Kota/Utara), fee, isActive |
| `Category` | id, name, slug, sortOrder |
| `Product` | id, categoryId, name, slug, description, composition, allergens, storageNote, imageUrl (opsional; URL eksternal atau path `/images/…`), isActive, archivedAt |
| `ProductVariant` | id, productId, label (20 cm / 24 cm), price (>0), stock (≥0), servingNote, isActive |
| `Cart`, `CartItem` | cartId, userId / guestToken, variantId, qty, note (≤150) |
| `TimeSlot` | id, startTime, endTime, isActive; MVP: `isFull` manual; v1.1: kuota harian |
| `Order` | id, orderNo (unik), userId, customerName/phone/email (snapshot), fulfillment (`PICKUP`/`DELIVERY`), scheduledDate, slotId, addressSnapshot, zoneId, deliveryFee, subtotal, total, status, paymentDueAt, cancelReason, stockDeducted (bool), createdAt |
| `OrderItem` | orderId, variantId, productName, variantLabel, unitPrice (snapshot), qty, note, lineTotal |
| `PaymentProof` | id, orderId, filePath, originalName, sizeBytes, mime, status (`SUBMITTED`/`ACCEPTED`/`REJECTED`), rejectReason, reviewedBy, reviewedAt, uploadedAt |
| `OrderStatusLog` | id, orderId, fromStatus, toStatus, actorId/actorName, note, createdAt |
| `Setting` | key/value: nama toko, alamat toko, jam buka, kontak, batas bayar (menit), lead time slot (rekening demo lama tidak lagi ditampilkan — pembayaran via QRIS statis) |
| `StockAdjustment` *(v1.1)* | variantId, date, initialStock, delta, reason |
| `SlotQuota` *(v1.1)* | slotId, date, quota |

Indeks: `Order.orderNo` unik, `Order(userId, createdAt)`, `Order(status, paymentDueAt)`, `ProductVariant(productId)`, `PaymentProof(orderId)`.

Nomor pesanan: `BH-DDMMYY-NNN`, urutan harian dibuat atomik di dalam transaksi (tabel counter harian atau `SELECT … FOR UPDATE`) agar tidak ganda.

### 4.4 Mesin Status Pesanan

```
Menunggu Pembayaran ──(admin terima bukti)──► Dikonfirmasi ──► Diproses ──┬─► Siap Diambil ──┐
        │                                              │                  └─► Sedang Diantar ─┴─► Selesai
        └──(batas bayar habis / batal)──► Dibatalkan ◄──(batal admin, stok dikembalikan jika sudah terpotong)
```

| Dari | Ke yang diizinkan |
|---|---|
| Menunggu Pembayaran | Dikonfirmasi, Dibatalkan |
| Dikonfirmasi | Diproses, Dibatalkan |
| Diproses | Siap Diambil *(hanya ambil)*, Sedang Diantar *(hanya antar)*, Dibatalkan |
| Siap Diambil / Sedang Diantar | Selesai, Dibatalkan `[TBD pemilik]` |
| Selesai, Dibatalkan | — (final) |

Transisi dijalankan oleh `order-status` service dalam **satu `prisma.$transaction`** (ubah status + tulis log + penyesuaian stok). Pengurangan stok memakai pembaruan bersyarat (`UPDATE … SET stock = stock - :qty WHERE id = :id AND stock >= :qty`) sehingga stok tidak pernah negatif walau dua admin menekan bersamaan.

### 4.5 Rute Utama

**Pelanggan** (App Router)

| Rute | Jenis | Fungsi |
|---|---|---|
| `/` | Page (RSC) | Beranda |
| `/katalog?q=&kategori=&harga_min=&harga_maks=&urut=` | Page (RSC, state di URL) | Katalog |
| `/produk/[slug]` | Page (RSC + client island) | Detail produk |
| `/keranjang` | Page + Server Actions `tambah/ubah/hapus` | Keranjang |
| `/masuk`, `/daftar` | Page + Server Action | Autentikasi pelanggan |
| `/checkout` | Page dinamis + Server Action `buatPesanan` (peran: CUSTOMER) | Checkout |
| `/pesanan/[orderNo]/bayar` | Page + `POST /api/upload/bukti` | Bayar + unggah bukti |
| `/pesanan/[orderNo]/konfirmasi`, `/pesanan/[orderNo]` | Page | Konfirmasi & lacak |
| `/pesanan` | Page (tab Semua/Aktif) | Riwayat |
| `/akun` | Page + Server Actions profil & alamat | Akun |
| `GET /api/berkas/bukti/[id]` | Route Handler | Bukti — hanya pemilik pesanan atau admin |

**Admin** (`/admin/*`, peran ADMIN diperiksa di layout **dan** DAL)

| Rute | Fungsi |
|---|---|
| `/admin/masuk` | Login admin (terpisah dari pelanggan) |
| `/admin` | Dashboard |
| `/admin/produk`, `/admin/produk/baru`, `/admin/produk/[id]/edit` | Produk (aksi arsip) |
| `/admin/kategori` | Kategori |
| `/admin/pesanan`, `/admin/pesanan/[id]` | Daftar & detail; aksi: terima, tolak, ubah status, batal |
| `/admin/stok` *(v1.1)*, `/admin/laporan` *(v1.1)* | Stok/kuota & laporan |
| `POST /api/cron/expire-orders` | Kedaluwarsa pesanan; dilindungi header rahasia `CRON_SECRET` |

Mutasi memakai Server Action (proteksi *origin* bawaan Next.js) atau Route Handler dengan pemeriksaan sesi; rute sensitif (login, daftar, unggah bukti) diberi **rate limit**.

### 4.6 Aturan Validasi (Server)

| Objek | Aturan |
|---|---|
| Daftar | nama wajib; HP 10–15 digit; email valid & unik; kata sandi ≥ 8 karakter |
| Keranjang | `qty` ≥ 1 dan ≤ stok; `note` ≤ 150 karakter; varian aktif |
| Checkout | nama/HP/email wajib; metode ∈ {PICKUP, DELIVERY}; DELIVERY → alamat & zona aktif wajib; tanggal ≥ hari ini; slot aktif, tidak Lewat/Penuh; stok seluruh item cukup |
| Bukti | MIME `image/jpeg` atau `image/png` (cek *magic bytes*, bukan hanya ekstensi/Content-Type); ≤ 2 MB; nama berkas diganti acak |
| Produk | nama, deskripsi, komposisi wajib; ≥ 1 varian aktif; harga > 0; stok ≥ 0; ≥ 1 foto utama; kategori wajib |
| Tolak bukti | alasan wajib |
| Kategori | hapus ditolak bila masih dipakai |

Skema Zod yang sama dipakai di klien (pesan error cepat) dan server (otoritatif). Pesan error menyebut sebab dan tindakan perbaikan, bukan hanya warna.

### 4.7 Integrasi & Jadwal Otomatis

- **Integrasi eksternal:** tidak ada pada MVP (tanpa gateway, kurir, GPS).
- **Kedaluwarsa pesanan:** cron memanggil `POST /api/cron/expire-orders` tiap 1–5 menit; membatalkan pesanan `Menunggu Pembayaran` dengan `paymentDueAt < now()` dan mencatat log pelaku "Sistem". Sebagai pengaman, halaman pesanan/dashboard juga memeriksa kedaluwarsa secara *lazy*.
- **Email transaksional:** `[TBD]` — di luar MVP; status dilihat lewat halaman Lacak.

### 4.8 Panduan UI dari Papan Handoff

| Item | Spesifikasi |
|---|---|
| Palet | Token CSS + `@theme` Tailwind v4: Kanvas `#FDF9F3`, Permukaan `#FFFFFF`, Kakao `#34231D`, Aksen `#A23F1D`, Teks sekunder `#4F4441`, Sukses `#125138`, Error `#BA1A1A`, **Teks di atas warna solid `#FFFFFF` (token `atas`)** — menggantikan pemakaian `text-white` hard-coded. **Mode gelap** mengikuti `prefers-color-scheme` (kanvas `#16120F`, permukaan `#211C18`, kakao `#F4F0EA`, aksen `#FFB59E`) |
| Tipografi | Lora (judul editorial), Inter (isi, formulir, navigasi, data). Display 38/58, Judul 30, Bagian 24, Isi 16/14, Metadata 12; line-height UI 1,5, display 1,12 |
| Ritme | Skala 4/8/16/24/32/48 px; gutter 20 px (mobile), 40 px (tablet/desktop); gap kartu 12/20; radius kontrol 8, kartu 12, hero 20 |
| Tata letak | Mobile satu kolom + katalog dua kolom; tablet katalog tiga kolom; desktop filter samping, checkout form + ringkasan; sidebar admin 220 px |
| Interaksi | Tinggi minimal aksi & target sentuh 44 px; fokus terlihat (ring 2 px, jarak 3 px); tidak bergantung pada hover; transisi halus 200 ms & dukungan `prefers-reduced-motion` |
| Status | Label teks wajib (Menunggu Pembayaran, Dikonfirmasi, Diproses, Siap Diambil, Sedang Diantar, Selesai, Dibatalkan, Habis), tidak hanya warna |
| Komponen | `ProductCard`, `FormField`, `OrderRow`, `StatusBadge`, `SummaryRow` (nama semantik) |
| Loading & kosong | `loading.tsx` dengan skeleton kartu agar layout tidak melompat; state kosong/tanpa hasil sesuai papan states |
| Foto | Latar netral, cahaya alami, tanpa teks pada foto, rasio 1:1 katalog; disajikan dengan `<img>` + kelas `aspect-square object-cover` (belum memakai `next/image`); foto disimpan di `public/images/` (`.webp`) |

### 4.9 Security & Privacy

- **HTTPS** wajib; cookie sesi `Secure`, `HttpOnly`, `SameSite=Lax`.
- Kata sandi di-hash (argon2/bcrypt); tidak pernah disimpan atau dicatat plaintext.
- **Akses berbasis peran**: pemeriksaan peran di layout admin, **di DAL, dan di setiap Server Action/Route Handler** (tidak mengandalkan middleware saja). Pelanggan hanya dapat melihat pesanan miliknya (cek kepemilikan di setiap query, mencegah IDOR).
- Berkas bukti disimpan **privat** (bukan di `public/`), disajikan lewat Route Handler dengan otorisasi; verifikasi *magic bytes*; nama acak; batas 2 MB. Foto produk boleh publik.
- Proteksi: validasi Zod di server, ORM ber-parameter (tanpa SQL mentah dari input), *output escaping* bawaan React (hindari `dangerouslySetInnerHTML`), *rate limiting* login/daftar/unggah, header keamanan (CSP, `X-Content-Type-Options`, `Referrer-Policy`).
- **Perlindungan data pribadi:** hanya nama, HP, email, alamat; persetujuan eksplisit saat daftar dan checkout; tidak ada data kartu/rekening pelanggan; log tidak menyimpan kata sandi atau isi bukti.
- Rahasia (`DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`) hanya di variabel lingkungan; tidak masuk repositori; hanya variabel berawalan `NEXT_PUBLIC_` yang terbuka ke klien.
- Kode QRIS pada rancangan adalah kode **demo — jangan bayar**; kode asli pemilik menggantikan `public/images/qris.webp`, lalu di-crop menjadi `qris-qr.webp` (quiet zone putih) untuk ditampilkan di halaman bayar.
- Keamanan di atas merupakan **persyaratan implementasi**, bukan klaim fitur yang sudah berjalan.

### 4.10 Non-Functional Requirements

| Aspek | Target |
|---|---|
| Kinerja | Katalog p95 ≤ 2 dtk (4G simulasi); LCP ≤ 2,5 dtk pada halaman katalog; operasi checkout ≤ 1,5 dtk pada data uji ≤ 1.000 pesanan |
| Aksesibilitas | Lighthouse A11y ≥ 90; kontras ≥ 4,5:1; error menyebut sebab + tindakan |
| Responsif | Teruji pada 360, 768, 1280 px tanpa *scroll* horizontal |
| Keandalan | Transisi status & stok atomik (`$transaction`); pencadangan database harian `[TBD]` |
| Pengujian | Vitest untuk service (harga, ongkir, stok, transisi status, validasi); Playwright E2E untuk alur pelanggan & verifikasi admin; uji blackbox manual |
| Kompatibilitas | Chrome, Firefox, Safari (2 versi mayor terakhir), Android Chrome |
| Kualitas kode | TypeScript `strict`, ESLint, Prettier; CI menjalankan lint + typecheck + test pada setiap PR |

---

## 5. Risks & Roadmap

### 5.1 Phased Rollout

| Fase | Cakupan |
|---|---|
| **MVP** | Beranda, katalog (cari/filter/urut), detail + varian + ucapan, keranjang persisten, daftar/masuk, akun & alamat, checkout ambil/antar dengan zona & slot, bayar QRIS statis + unggah bukti, konfirmasi, lacak, riwayat; admin: login, dashboard, produk + kategori, daftar & detail pesanan, verifikasi (terima/tolak), ubah status, pembatalan, kedaluwarsa otomatis, stok per varian manual dengan potong saat Dikonfirmasi |
| **v1.1** | Stok & kuota harian per tanggal produksi/slot (otomatis), laporan penjualan harian/bulanan + grafik, notifikasi email status |
| **v2.0** | `[TBD]` Opsi pembayaran otomatis (payment gateway / QRIS dinamis dengan nominal), notifikasi WhatsApp, voucher — saat ini seluruhnya Non-Goals |

### 5.2 Risiko Teknis & Bisnis

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | **Stok tidak dicadangkan** sampai Dikonfirmasi; dua pelanggan dapat membayar untuk stok terakhir | Pesanan tidak dapat dipenuhi | Validasi ulang stok saat checkout & saat admin menerima; bila kurang, admin menolak dengan alasan dan menghubungi pelanggan (refund manual) `[TBD kebijakan]`. Alternatif: reservasi stok sampai batas bayar |
| R2 | Verifikasi manual lambat/terlewat | Pesanan menggantung, pelanggan kesal | Penanda "Perlu verifikasi (n)" di dashboard, urutan bukti tertua, batas bayar jelas |
| R3 | Bukti palsu/diedit | Kerugian finansial | Admin wajib mencocokkan mutasi QRIS; peringatan UI; riwayat pelaku |
| R4 | Unggahan berkas berbahaya | Kompromi server | Validasi *magic bytes* berkas, simpan privat (bukan `public/`), nama acak, batas 2 MB |
| R5 | Cron kedaluwarsa tidak berjalan atau hosting serverless tanpa disk persisten | Pesanan kedaluwarsa tidak dibatalkan; berkas bukti hilang | Pemeriksaan *lazy* + cron utama dengan `CRON_SECRET`; object storage bila serverless; log eksekusi |
| R10 | Otorisasi hanya di middleware | Akses admin/pesanan orang lain bocor | Otorisasi wajib di DAL dan setiap Server Action/Route Handler; uji E2E akses lintas peran |
| R6 | Aturan bisnis belum final (batas bayar, lead time slot, kebijakan refund, kode QRIS asli) | Revisi ulang | Simpan di tabel `Setting`, bukan hard-code; kumpulkan keputusan di bagian 6 |
| R7 | Data demo ikut ke produksi | Informasi salah/menyesatkan | Pisahkan *seed* demo vs produksi; checklist rilis |
| R8 | Zona ongkir hanya dua contoh | Penolakan pesanan sah | Tabel `delivery_zones` dapat dikelola; `[TBD]` daftar zona final |
| R9 | Zona waktu & jam operasional | Slot/kedaluwarsa salah hitung | Gunakan `Asia/Jakarta` pada konfigurasi aplikasi dan DB |

---

## 6. Pertanyaan Terbuka & Catatan Konsistensi Rancangan

| # | Hal | Usulan default (`[ASUMSI]`) |
|---|---|---|
| Q1 | Pada rancangan, aturan stok diberi label "v1.1" sedangkan halaman detail/katalog sudah menampilkan stok dan batas jumlah. | MVP: stok disimpan per varian dan dipotong saat Dikonfirmasi (BR-06); **halaman** Stok & Kuota per tanggal + otomatisasi kuota = v1.1 |
| Q2 | Slot "Penuh/Lewat" pada MVP tanpa halaman kuota. | Slot dikelola lewat `Setting`/`TimeSlot` (flag penuh manual + batas waktu); kuota otomatis v1.1 |
| Q3 | Batas bayar 60 menit dan lead time pemesanan disebut "contoh". | Konfigurabel di `Setting`; final ditentukan pemilik |
| Q4 | Kebijakan refund bila pembayaran diterima tetapi stok habis. | Refund manual di luar sistem; dicatat pada log |
| Q5 | Pembatalan oleh pelanggan setelah Dikonfirmasi. | Hanya admin yang dapat membatalkan (pelanggan menghubungi toko) |
| Q6 | Data stok pada layar Edit Produk (Marmer 24 cm = 4) dan papan Stok (4 tersedia) serta kolom "Terkonfirmasi" yang selalu 2 tampak sebagai data ilustrasi. | Diperlakukan sebagai *seed* contoh, bukan aturan |
| Q7 | Satu pesanan dapat memuat banyak produk? Desain hanya memperlihatkan satu item. | Ya — keranjang multi-item didukung (tombol "Tambah bolu lainnya") |
| Q8 | Nama toko final, domain, logo, kontak, kode QRIS asli, jam buka. | `[TBD pemilik]`; tersimpan di `Setting` |
| Q9 | Pengiriman email konfirmasi/notifikasi. | Di luar MVP |
| Q10 | Hosting & domain produksi. | `[TBD]`; menentukan lokasi penyimpanan bukti (disk vs object storage) dan cara menjalankan cron |

---

## Lampiran A — Seed Data Contoh (dari Rancangan)

| Produk | Kategori | Varian | Harga | Stok contoh | Foto (`public/images/`) |
|---|---|---|---|---|---|
| Bolu Marmer | Bolu klasik | 20 cm / 24 cm | Rp20.000 / Rp20.000 | 8 / 4 | `bolu-marmer-cokelat.webp` |
| Bolu Pandan | Bolu klasik | 20 cm | Rp20.000 | 12 | `bolu-marmer-pandan.webp` |
| Bolu Cokelat | Bolu klasik | 20 cm | Rp20.000 | 6 | `bolu-panggang-meses-cokelat.webp` |
| Bolu Meses Warna-warni | Bolu klasik | 20 cm | Rp25.000 | 7 | `bolu-meses-warna-warni.webp` |
| Bolu Pisang | Bolu klasik | 20 cm | Rp25.000 | 0 (Habis) | `bolu-pisang.webp` |

Kategori: hanya **Bolu klasik** (Bolu premium & Bolu gulung dihapus karena tidak ada produknya; Bolu Keju & Bolu Gulung dihapus dari seed). Zona: **A — Pontianak Kota Rp10.000**, **B — Pontianak Utara Rp20.000**. Slot: 08.00–10.00, 10.00–12.00, 13.00–15.00, 15.00–17.00. Toko: Jl. Melati No. 12, Pontianak Kota, Pontianak 78111, buka 08.00–18.00 (contoh). Aset lain: `logo KUBO.webp`, poster `qris.webp` + hasil crop `qris-qr.webp` (dipakai halaman bayar).

## Lampiran B — Skenario Uji Utama (Ringkas)

1. Tamu menambah produk → keranjang tersimpan setelah reload → diminta masuk saat checkout.
2. Daftar dengan kata sandi 7 karakter → ditolak; 8 karakter → berhasil.
3. Jumlah 8 (stok 8) → tombol tambah nonaktif; ucapan 151 karakter → ditolak.
4. Checkout ambil di toko: total = subtotal, ongkir Rp0.
5. Checkout antar Zona B: total = subtotal + Rp20.000; alamat Sambas → "di luar layanan".
6. Slot Penuh/Lewat tidak dapat dipilih.
7. Unggah PDF → ditolak; PNG 3,4 MB → ditolak; JPG 1,2 MB → diterima.
8. Admin tolak bukti tanpa alasan → ditolak; dengan alasan → status tetap Menunggu Pembayaran, pelanggan dapat unggah ulang.
9. Admin terima pembayaran → Dikonfirmasi, stok berkurang sesuai jumlah, log tercatat.
10. Batalkan setelah Dikonfirmasi → stok kembali; batalkan sebelum Dikonfirmasi → stok tidak berubah.
11. Lompat status tidak valid → ditolak.
12. Batas bayar habis → otomatis Dibatalkan.
13. Pelanggan mengakses `/admin` dan pesanan milik orang lain → ditolak (403/404).
14. Produk yang pernah dipesan diarsipkan → hilang dari katalog, pesanan lama utuh.