import Link from "next/link";
import { rupiah } from "@/lib/format";

type Props = {
  slug: string;
  nama: string;
  kategori: string;
  hargaMin: number;
  stok: number;
  imageUrl?: string | null;
};

export function ProductCard({ slug, nama, kategori, hargaMin, stok, imageUrl }: Props) {
  const habis = stok <= 0;
  return (
    <Link
      href={`/produk/${slug}`}
      className="group bg-permukaan border border-kakao/10 rounded-xl overflow-hidden hover:border-aksen/50 transition-colors flex flex-col"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={nama} className="aspect-square w-full object-cover" />
      ) : (
        <div
          className="aspect-square w-full flex items-center justify-center text-5xl font-judul text-kanvas bg-kakao"
          aria-hidden="true"
        >
          {nama.replace(/^Bolu\s+/i, "").charAt(0)}
        </div>
      )}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className="text-xs text-teks2">{kategori}</span>
        <span className="font-medium">{nama}</span>
        <span className="text-sm mt-auto">
          mulai <span className="font-semibold text-aksen">{rupiah(hargaMin)}</span>
        </span>
        {habis && (
          <span className="inline-flex w-fit rounded-full bg-error/10 text-error border border-error/40 px-2.5 py-0.5 text-xs font-medium">
            Habis
          </span>
        )}
      </div>
    </Link>
  );
}
