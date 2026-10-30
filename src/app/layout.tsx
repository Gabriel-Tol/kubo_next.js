import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getKeranjang } from "@/lib/services/cart";

export const metadata: Metadata = {
  title: "Bolu Hangat (KUBO) — Bolu rumahan Kubu Raya",
  description: "Pesan bolu segar dari oven, ambil di toko atau antar sekitar Pontianak.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const [cart, setting] = await Promise.all([
    getKeranjang(),
    db.setting.findMany(),
  ]);
  const jml = cart?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
  const kontak = setting.find((x) => x.key === "kontak_toko")?.value ?? "0812-0000-0000";

  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col">
        <header className="bg-permukaan sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-5 lg:px-10 py-3 flex items-center gap-4">
            <Link href="/" className="font-judul text-xl font-bold text-aksen">
              KUBO
            </Link>
            <nav className="flex gap-1 text-sm ml-auto flex-wrap">
              <Link href="/" className="px-3 py-2 min-h-11 flex items-center rounded-lg hover:bg-kanvas">
                Beranda
              </Link>
              <Link href="/katalog" className="px-3 py-2 min-h-11 flex items-center rounded-lg hover:bg-kanvas">
                Katalog
              </Link>
              <Link href="/pesanan" className="px-3 py-2 min-h-11 flex items-center rounded-lg hover:bg-kanvas">
                Pesanan
              </Link>
              <Link href="/akun" className="px-3 py-2 min-h-11 flex items-center rounded-lg hover:bg-kanvas">
                {s ? "Akun" : "Masuk"}
              </Link>
              <Link
                href="/keranjang"
                className="px-3 py-2 min-h-11 flex items-center rounded-lg bg-kakao text-kanvas font-medium"
              >
                Keranjang{jml > 0 ? ` (${jml})` : ""}
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-5 lg:px-10 py-6">{children}</main>
        <footer className="bg-permukaan mt-12">
          <div className="mx-auto max-w-6xl px-5 lg:px-10 py-6 text-sm text-teks2">
            <p className="font-medium text-kakao">Bolu Hangat (KUBO)</p>
            <p>Lingga, Kec. Sungai Ambawang, Kabupaten Kubu Raya, Kalbar 78393 · Buka 08.00–18.00 · WA {kontak}</p>
            <p className="mt-2">
              QRIS demo — jangan scan bayar sungguhan. Pembayaran diverifikasi manual oleh admin.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
