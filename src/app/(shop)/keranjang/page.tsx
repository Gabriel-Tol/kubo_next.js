import Link from "next/link";
import { getKeranjang } from "@/lib/services/cart";
import { getSession } from "@/lib/auth";
import { rupiah } from "@/lib/format";
import { ubahKeranjang, hapusKeranjang } from "@/app/actions";

export const dynamic = "force-dynamic";

const LANGKAH = ["Keranjang", "Checkout", "Bayar", "Konfirmasi"];

export default async function Keranjang({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const [cart, s] = await Promise.all([getKeranjang(), getSession()]);
  const items = cart?.items ?? [];
  const subtotal = items.reduce((n, i) => n + i.variant.price * i.qty, 0);

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Langkah pemesanan">
        {LANGKAH.map((l, i) => (
          <li
            key={l}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
              i === 0 ? "bg-kakao text-kanvas font-medium" : "bg-permukaan border border-kakao/15 text-teks2"
            }`}
          >
            <span aria-hidden>{i + 1}.</span> {l}
          </li>
        ))}
      </ol>

      {err && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {err}
        </p>
      )}

      {items.length === 0 ? (
        <div className="bg-permukaan border border-kakao/10 rounded-xl p-10 text-center space-y-3">
          <p className="font-judul text-2xl">Keranjang masih kosong.</p>
          <Link
            href="/katalog"
            className="inline-flex min-h-11 items-center rounded-lg bg-aksen text-atas font-medium px-5 py-2"
          >
            Jelajahi katalog
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="bg-permukaan border border-kakao/10 rounded-xl p-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">
                    {i.variant.product.name} · {i.variant.label}
                  </p>
                  <p className="text-sm text-teks2">{rupiah(i.variant.price)} / bolu</p>
                  {i.note && <p className="text-sm mt-1 italic">&ldquo;{i.note}&rdquo;</p>}
                  <p className="text-sm mt-1 text-teks2">
                    Stok tersisa {i.variant.stock}
                    {i.qty >= i.variant.stock && " — jumlah maksimal tercapai"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <form action={ubahKeranjang} className="flex items-center gap-2">
                    <input type="hidden" name="itemId" value={i.id} />
                    <label className="sr-only" htmlFor={`qty-${i.id}`}>
                      Jumlah {i.variant.product.name}
                    </label>
                    <select
                      id={`qty-${i.id}`}
                      name="qty"
                      defaultValue={i.qty}
                      className="min-h-11 rounded-lg border border-kakao/25 px-2 bg-permukaan"
                    >
                      {Array.from({ length: Math.max(i.variant.stock, i.qty) }).map((_, n) => (
                        <option key={n + 1} value={n + 1}>
                          {n + 1}
                        </option>
                      ))}
                    </select>
                    <button className="min-h-11 rounded-lg border border-kakao/25 px-3">Ubah</button>
                  </form>
                  <form action={hapusKeranjang}>
                    <input type="hidden" name="itemId" value={i.id} />
                    <button className="min-h-11 text-error text-sm">Hapus</button>
                  </form>
                  <p className="font-semibold">{rupiah(i.variant.price * i.qty)}</p>
                </div>
              </li>
            ))}
          </ul>

          <aside className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-3 md:sticky md:top-20">
            <h2 className="font-bold text-lg">Ringkasan</h2>
            <p className="flex justify-between text-sm">
              <span className="text-teks2">Subtotal ({items.length} jenis)</span>
              <span className="font-medium">{rupiah(subtotal)}</span>
            </p>
            <p className="flex justify-between text-sm">
              <span className="text-teks2">Ongkir</span>
              <span className="text-teks2">Dihitung di checkout</span>
            </p>
            {s ? (
              <Link
                href="/checkout"
                className="block text-center min-h-11 rounded-lg bg-aksen text-atas font-medium px-5 py-3"
              >
                Lanjut ke checkout
              </Link>
            ) : (
              <Link
                href="/masuk?next=/checkout"
                className="block text-center min-h-11 rounded-lg bg-aksen text-atas font-medium px-5 py-3"
              >
                Masuk untuk checkout
              </Link>
            )}
            {!s && (
              <p className="text-xs text-teks2">
                Keranjang tetap tersimpan. Belum punya akun?{" "}
                <Link href="/daftar?next=/checkout" className="underline">
                  Daftar dulu
                </Link>
                .
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
