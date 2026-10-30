import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ui/ProductCard";

export const dynamic = "force-dynamic";

export default async function Beranda() {
  const [kategori, favorit] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { isActive: true, archivedAt: null },
      include: { variants: { where: { isActive: true } }, category: true },
      take: 3,
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      {/* Judul halaman di atas kanvas krem, tanpa kotak — mengikuti pola judul Stitch */}
      <section className="py-4 md:py-8 text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold">
          Bolu hangat langsung dari oven rumahan
        </h1>
        <p className="text-teks2 max-w-xl mx-auto">
          Pesan bolu untuk kumpul keluarga. Ambil di toko di Pontianak Kota atau kami antar ke
          sekitar Pontianak — pembayaran QRIS manual, verifikasi oleh kami.
        </p>
        <Link
          href="/katalog"
          className="inline-flex min-h-11 items-center rounded-lg bg-aksen text-atas font-medium px-6 py-3 hover:bg-aksen/90"
        >
          Belanja bolu
        </Link>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-3">Kategori</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/katalog"
            className="min-h-11 inline-flex items-center rounded-full border border-kakao/20 bg-permukaan px-4 py-2 text-sm hover:border-aksen"
          >
            Semua bolu
          </Link>
          {kategori.map((k) => (
            <Link
              key={k.id}
              href={`/katalog?kategori=${encodeURIComponent(k.name)}`}
              className="min-h-11 inline-flex items-center rounded-full border border-kakao/20 bg-permukaan px-4 py-2 text-sm hover:border-aksen"
            >
              {k.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-3">Favorit dari oven</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {favorit.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              nama={p.name}
              kategori={p.category.name}
              hargaMin={Math.min(...p.variants.map((v) => v.price))}
              stok={p.variants.reduce((n, v) => n + v.stock, 0)}
              imageUrl={p.imageUrl}
            />
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-permukaan border border-kakao/10 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-1">Ambil di toko</h3>
          <p className="text-sm text-teks2">
            Jl. Melati No. 12, Pontianak Kota, Pontianak 78111 · Buka 08.00–18.00. Datang setelah
            status Siap Diambil, tunjukkan nomor pesanan. Tanpa biaya.
          </p>
        </div>
        <div className="bg-permukaan border border-kakao/10 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-1">Antar sekitar Anda</h3>
          <p className="text-sm text-teks2">
            Zona A Pontianak Kota Rp10.000, Zona B Pontianak Utara Rp20.000. Pilih jadwal 08.00–17.00.
            Tanpa pelacakan GPS — kami konfirmasi lewat status pesanan.
          </p>
        </div>
      </section>
    </div>
  );
}
