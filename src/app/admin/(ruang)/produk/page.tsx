import Link from "next/link";
import { db } from "@/lib/db";
import { rupiah } from "@/lib/format";
import { arsipProduk } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminProduk({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; arsip?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const arsip = sp.arsip === "1";

  const [kategori, semua] = await Promise.all([
    db.category.findMany(),
    db.product.findMany({
      include: { variants: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const aktif = semua.filter((p) => !p.archivedAt);
  const daftar = semua.filter((p) =>
    arsip ? !!p.archivedAt : !p.archivedAt && (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  );
  const jmlArsip = semua.length - aktif.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold flex-1">Produk</h1>
        <Link href="/admin/produk/baru" className="min-h-11 inline-flex items-center rounded-lg bg-aksen text-white font-medium px-5 py-2">
          Tambah produk
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <form method="get" className="flex gap-2 flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari produk"
            className="min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan"
          />
          <button className="min-h-11 rounded-lg border border-kakao/25 px-4">Cari</button>
        </form>
        <Link
          href={arsip ? "/admin/produk" : "/admin/produk?arsip=1"}
          className={`min-h-11 inline-flex items-center rounded-lg px-4 py-2 border ${
            arsip ? "bg-kakao text-kanvas border-kakao" : "bg-permukaan border-kakao/25"
          }`}
        >
          Arsip ({jmlArsip})
        </Link>
      </div>

      <div className="bg-permukaan border border-kakao/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-kakao/10 text-left text-teks2">
              <th className="p-3">Produk</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Varian &amp; harga</th>
              <th className="p-3">Stok</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((p) => (
              <tr key={p.id} className="border-b border-kakao/5">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.category.name}</td>
                <td className="p-3">
                  {p.variants.map((v) => (
                    <span key={v.id} className="block">
                      {v.label} · {rupiah(v.price)}
                    </span>
                  ))}
                </td>
                <td className="p-3">{p.variants.reduce((n, v) => n + v.stock, 0)}</td>
                <td className="p-3">
                  {p.archivedAt ? (
                    <span className="rounded-full border border-error/40 bg-error/10 text-error px-2 py-0.5 text-xs">
                      Diarsipkan
                    </span>
                  ) : p.isActive ? (
                    <span className="rounded-full border border-sukses/40 bg-sukses/10 text-sukses px-2 py-0.5 text-xs">
                      Publik
                    </span>
                  ) : (
                    <span className="rounded-full border border-kakao/30 bg-kanvas text-teks2 px-2 py-0.5 text-xs">
                      Draft
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/produk/${p.id}/edit`} className="underline text-aksen min-h-11 inline-flex items-center">
                      Edit
                    </Link>
                    <form action={arsipProduk}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-error min-h-11">
                        {p.archivedAt ? "Pulihkan" : "Arsipkan"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-teks2">
                  Tidak ada produk{arsip ? " di arsip" : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-teks2">
        Produk tidak dihapus permanen (BR-09). Arsip menyembunyikan dari katalog; pesanan lama tetap memakai nama dan
        harga saat dipesan. {kategori.length} kategori terdaftar.
      </p>
    </div>
  );
}
