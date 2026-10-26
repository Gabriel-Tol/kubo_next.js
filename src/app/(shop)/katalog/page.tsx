import { db } from "@/lib/db";
import { ProductCard } from "@/components/ui/ProductCard";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

function ambil(sp: SP, k: string): string {
  const v = sp[k];
  return typeof v === "string" ? v : "";
}

export default async function Katalog({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = ambil(sp, "q");
  const kategori = ambil(sp, "kategori");
  const hargaMin = Number(ambil(sp, "harga_min") || 0);
  const hargaMaks = Number(ambil(sp, "harga_maks") || 100000);
  const urut = ambil(sp, "urut");

  const [kategoriList, produk] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: {
        isActive: true,
        archivedAt: null,
        ...(kategori ? { category: { name: kategori } } : {}),
        ...(q ? { name: { contains: q } } : {}),
        variants: {
          some: { isActive: true, price: { gte: hargaMin, lte: isNaN(hargaMaks) ? 100000 : hargaMaks } },
        },
      },
      include: { variants: { where: { isActive: true } }, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasil =
    urut === "harga-asc"
      ? [...produk].sort(
          (a, b) => Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price))
        )
      : urut === "harga-desc"
        ? [...produk].sort(
            (a, b) => Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price))
          )
        : produk;

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6">
      <aside className="md:sticky md:top-20 h-fit">
        <form className="bg-permukaan border border-kakao/10 rounded-xl p-4 space-y-4" method="get">
          <h2 className="font-bold text-lg">Filter</h2>
          <div>
            <label htmlFor="q" className="block text-sm font-medium mb-1">
              Cari nama bolu
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="mis. marmer"
              className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium mb-1">Kategori</legend>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm min-h-11">
                <input type="radio" name="kategori" value="" defaultChecked={!kategori} /> Semua bolu
              </label>
              {kategoriList.map((k) => (
                <label key={k.id} className="flex items-center gap-2 text-sm min-h-11">
                  <input
                    type="radio"
                    name="kategori"
                    value={k.name}
                    defaultChecked={kategori === k.name}
                  />{" "}
                  {k.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium mb-1">Rentang harga</legend>
            <div className="flex gap-2 items-center text-sm">
              <input
                name="harga_min"
                type="number"
                min={0}
                defaultValue={hargaMin || ""}
                placeholder="0"
                aria-label="Harga minimum"
                className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2"
              />
              <span aria-hidden>–</span>
              <input
                name="harga_maks"
                type="number"
                min={0}
                defaultValue={ambil(sp, "harga_maks") || ""}
                placeholder="100000"
                aria-label="Harga maksimum"
                className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2"
              />
            </div>
            <p className="text-xs text-teks2 mt-1">
              {rupiah(hargaMin)} – {rupiah(isNaN(hargaMaks) ? 100000 : hargaMaks)}
            </p>
          </fieldset>
          <div>
            <label htmlFor="urut" className="block text-sm font-medium mb-1">
              Urutkan
            </label>
            <select
              id="urut"
              name="urut"
              defaultValue={urut}
              className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan"
            >
              <option value="">Nama A–Z</option>
              <option value="harga-asc">Harga terendah</option>
              <option value="harga-desc">Harga tertinggi</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="min-h-11 flex-1 rounded-lg bg-kakao text-kanvas font-medium py-2">
              Terapkan filter
            </button>
            <a
              href="/katalog"
              className="min-h-11 inline-flex items-center justify-center rounded-lg border border-kakao/25 px-3 py-2 text-sm"
            >
              Reset
            </a>
          </div>
        </form>
      </aside>

      <section>
        <p className="text-sm text-teks2 mb-3" aria-live="polite">
          {hasil.length} produk
        </p>
        {hasil.length === 0 ? (
          <div className="bg-permukaan border border-kakao/10 rounded-xl p-10 text-center space-y-3">
            <p className="font-judul text-2xl">Belum ketemu.</p>
            <p className="text-sm text-teks2">Coba kata kunci lain atau atur ulang filter.</p>
            <a
              href="/katalog"
              className="inline-flex min-h-11 items-center rounded-lg bg-aksen text-white font-medium px-5 py-2"
            >
              Reset pencarian &amp; filter
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {hasil.map((p) => (
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
        )}
      </section>
    </div>
  );
}
