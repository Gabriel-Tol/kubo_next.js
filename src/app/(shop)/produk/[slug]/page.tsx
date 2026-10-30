import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProdukDetailClient } from "@/components/shop/ProdukDetailClient";

export const dynamic = "force-dynamic";

export default async function DetailProduk({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { slug } = await params;
  const { err } = await searchParams;
  const p = await db.product.findUnique({
    where: { slug },
    include: { category: true, variants: { where: { isActive: true } } },
  });
  if (!p || p.archivedAt || !p.isActive) notFound();

  const totalStok = p.variants.reduce((n, v) => n + v.stock, 0);

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-teks2">
        <Link href="/katalog" className="hover:text-aksen">
          Katalog
        </Link>{" "}
        /{" "}
        <Link href={`/katalog?kategori=${encodeURIComponent(p.category.name)}`} className="hover:text-aksen">
          {p.category.name}
        </Link>{" "}
        / <span className="text-kakao">{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={`Foto ${p.name}`}
            className="aspect-square w-full object-cover rounded-xl border border-kakao/10"
          />
        ) : (
          <div
            className="aspect-square w-full rounded-xl flex items-center justify-center text-7xl font-judul text-kanvas bg-kakao"
            aria-hidden="true"
          >
            {p.name.replace(/^Bolu\s+/i, "").charAt(0)}
          </div>
        )}

        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{p.name}</h1>
          <p className="text-sm text-sukses font-medium">
            {totalStok > 0
              ? `Tersedia ${totalStok} bolu (${p.variants.map((v) => `${v.stock} ${v.label}`).join(", ")})`
              : "Habis — stok habis"}
          </p>
          <p className="whitespace-pre-line">{p.description}</p>

          <ProdukDetailClient
            variants={p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, stock: v.stock }))}
            err={err}
          />

          <dl className="text-sm space-y-2 border-t border-kakao/10 pt-4">
            <div>
              <dt className="font-medium">Komposisi</dt>
              <dd className="text-teks2">{p.composition}</dd>
            </div>
            {p.allergens && (
              <div>
                <dt className="font-medium">Alergen</dt>
                <dd className="text-teks2">{p.allergens}</dd>
              </div>
            )}
            {p.storageNote && (
              <div>
                <dt className="font-medium">Saran penyimpanan</dt>
                <dd className="text-teks2">{p.storageNote}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </article>
  );
}
