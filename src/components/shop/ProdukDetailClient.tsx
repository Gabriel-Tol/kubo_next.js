"use client";

import { useMemo, useState } from "react";
import { rupiah } from "@/lib/format";
import { tambahKeranjang } from "@/app/actions";

type Varian = { id: string; label: string; price: number; stock: number };

export function ProdukDetailClient({
  variants,
  err,
}: {
  variants: Varian[];
  err?: string;
}) {
  const aktif = variants.filter((v) => v.stock > 0);
  const [varianId, setVarianId] = useState((aktif[0] ?? variants[0]).id);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const v = useMemo(() => variants.find((x) => x.id === varianId)!, [variants, varianId]);
  const maks = v.stock;
  const lewatBatas = note.length > 150;

  return (
    <div className="space-y-5">
      {err && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {err}
        </p>
      )}
      <form action={tambahKeranjang} className="space-y-5">
        <input type="hidden" name="variantId" value={varianId} />
        <fieldset>
          <legend className="font-medium mb-2">Ukuran</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <label
                key={x.id}
                className={`min-h-11 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm cursor-pointer ${
                  x.id === varianId ? "border-aksen bg-aksen/10" : "border-kakao/25 bg-permukaan"
                } ${x.stock <= 0 ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="varian"
                  value={x.id}
                  checked={x.id === varianId}
                  disabled={x.stock <= 0}
                  onChange={() => {
                    setVarianId(x.id);
                    setQty(1);
                  }}
                />
                {x.label} · {rupiah(x.price)}
                {x.stock <= 0 ? " · Habis" : ` · sisa ${x.stock}`}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="qty" className="font-medium block mb-2">
            Jumlah
          </label>
          <div className="inline-flex items-center rounded-lg border border-kakao/25 bg-permukaan">
            <button
              type="button"
              aria-label="Kurangi jumlah"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              disabled={qty <= 1}
              className="min-h-11 min-w-11 px-4 text-lg disabled:opacity-40"
            >
              −
            </button>
            <span id="qty" aria-live="polite" className="w-12 text-center font-medium tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Tambah jumlah"
              onClick={() => setQty((n) => Math.min(maks, n + 1))}
              disabled={qty >= maks}
              className="min-h-11 min-w-11 px-4 text-lg disabled:opacity-40"
            >
              +
            </button>
          </div>
          <input type="hidden" name="qty" value={qty} />
          {qty >= maks && maks > 0 && (
            <p className="text-sm text-teks2 mt-1">Jumlah maksimal tercapai (stok {maks}).</p>
          )}
        </div>

        <div>
          <label htmlFor="note" className="font-medium block mb-2">
            Ucapan / catatan (opsional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. Selamat ulang tahun Bu Ani, jangan terlalu manis"
            className="w-full rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan"
            aria-describedby="note-bantu"
          />
          <p id="note-bantu" className={`text-sm ${lewatBatas ? "text-error" : "text-teks2"}`}>
            {lewatBatas
              ? `Hapus setidaknya ${note.length - 150} karakter (maksimal 150).`
              : `${note.length}/150 karakter`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-kakao/10 pt-4">
          <p className="text-lg">
            Subtotal: <span className="font-bold text-aksen">{rupiah(v.price * qty)}</span>
          </p>
          <button
            type="submit"
            disabled={lewatBatas || v.stock <= 0}
            className="min-h-11 rounded-lg bg-aksen text-atas font-medium px-6 py-3 disabled:opacity-50"
          >
            {v.stock <= 0 ? "Stok habis" : "Tambah ke keranjang"}
          </button>
        </div>
      </form>
    </div>
  );
}
