"use client";

import { useActionState, useState } from "react";
import { simpanProduk } from "@/app/admin/actions";

type Varian = { id?: string; label: string; price: number; stock: number };

export function ProductForm({
  kategori,
  produk,
}: {
  kategori: Array<{ id: string; name: string }>;
  produk?: {
    id: string;
    name: string;
    categoryId: string;
    description: string;
    composition: string;
    allergens?: string | null;
    storageNote?: string | null;
    imageUrl?: string | null;
    isActive: boolean;
    variants: Array<{ id: string; label: string; price: number; stock: number }>;
  };
}) {
  const [state, formAction, pending] = useActionState(simpanProduk, undefined);
  const [variants, setVariants] = useState<Varian[]>(
    produk?.variants.length ? produk.variants : [{ label: "", price: 0, stock: 0 }]
  );
  const [fokus, setFokus] = useState(false);

  function setVar(i: number, patch: Partial<Varian>) {
    setVariants((vs) => vs.map((v, n) => (n === i ? { ...v, ...patch } : v)));
  }

  return (
    <form action={formAction} className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-4 max-w-2xl">
      {produk && <input type="hidden" name="id" value={produk.id} />}
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      {state?.error && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Nama produk *</label>
        <input id="name" name="name" defaultValue={produk?.name} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium mb-1">Kategori *</label>
        <select id="categoryId" name="categoryId" defaultValue={produk?.categoryId ?? kategori[0]?.id} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan">
          {kategori.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Deskripsi *</label>
        <textarea id="description" name="description" rows={3} defaultValue={produk?.description} required className="w-full rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="composition" className="block text-sm font-medium mb-1">Komposisi (termasuk alergen) *</label>
        <textarea id="composition" name="composition" rows={2} defaultValue={produk?.composition} required className="w-full rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="allergens" className="block text-sm font-medium mb-1">Alergen (opsional)</label>
          <input id="allergens" name="allergens" defaultValue={produk?.allergens ?? ""} className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="storageNote" className="block text-sm font-medium mb-1">Saran simpan (opsional)</label>
          <input id="storageNote" name="storageNote" defaultValue={produk?.storageNote ?? ""} className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
        </div>
      </div>
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">URL foto (opsional, rasio 1:1)</label>
        <input id="imageUrl" name="imageUrl" defaultValue={produk?.imageUrl ?? ""} placeholder="https://…" className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
      </div>

      <fieldset onFocus={() => setFokus(true)}>
        <legend className="font-medium mb-2">Varian (ukuran, harga &gt; Rp0, stok ≥ 0) *</legend>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-teks2" htmlFor={`v-label-${i}`}>Ukuran</label>
                <input id={`v-label-${i}`} value={v.label} onChange={(e) => setVar(i, { label: e.target.value })} placeholder="20 cm" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-teks2" htmlFor={`v-price-${i}`}>Harga (Rp)</label>
                <input id={`v-price-${i}`} type="number" min={1} value={v.price || ""} onChange={(e) => setVar(i, { price: Number(e.target.value) })} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs text-teks2" htmlFor={`v-stock-${i}`}>Stok</label>
                <input id={`v-stock-${i}`} type="number" min={0} value={v.stock || ""} onChange={(e) => setVar(i, { stock: Number(e.target.value) })} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
              </div>
              {variants.length > 1 && (
                <button type="button" onClick={() => setVariants((vs) => vs.filter((_, n) => n !== i))} className="min-h-11 text-error text-sm">
                  Hapus
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setVariants((vs) => [...vs, { label: "", price: 0, stock: 0 }])} className="mt-2 min-h-11 rounded-lg border border-kakao/25 px-4 text-sm">
          Tambah varian
        </button>
        {fokus && variants.some((v) => !v.label || v.price <= 0) && (
          <p className="text-sm text-error mt-1">Setiap varian butuh ukuran dan harga lebih dari Rp0.</p>
        )}
      </fieldset>

      <label className="flex items-center gap-2 min-h-11">
        <input type="checkbox" name="isActive" defaultChecked={produk?.isActive ?? true} />
        Publikasikan (tampil di katalog)
      </label>

      <button disabled={pending} className="min-h-11 rounded-lg bg-aksen text-white font-medium px-6 py-3 disabled:opacity-50">
        {pending ? "Menyimpan…" : produk ? "Simpan perubahan" : "Tambah produk"}
      </button>
    </form>
  );
}
