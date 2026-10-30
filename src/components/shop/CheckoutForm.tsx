"use client";

import { useActionState, useMemo, useState } from "react";
import { checkout } from "@/app/actions";
import { rupiah } from "@/lib/format";

type Zona = { id: string; nama: string; areaLabel: string; fee: number };
type Slot = { id: string; label: string };
type Item = { nama: string; label: string; qty: number; harga: number; note?: string | null };

export function CheckoutForm({
  zones,
  slots,
  items,
  subtotal,
  defaultName,
  defaultPhone,
  defaultEmail,
  alamatAwal,
  zonaAwal,
  tanggalMin,
}: {
  zones: Zona[];
  slots: Slot[];
  items: Item[];
  subtotal: number;
  defaultName: string;
  defaultPhone: string;
  defaultEmail: string;
  alamatAwal?: string;
  zonaAwal?: string;
  tanggalMin: string;
}) {
  const [state, formAction, pending] = useActionState(checkout, undefined);
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [zoneId, setZoneId] = useState(zonaAwal ?? zones[0]?.id ?? "");
  const ongkir = fulfillment === "DELIVERY" ? zones.find((z) => z.id === zoneId)?.fee ?? 0 : 0;
  const total = useMemo(() => subtotal + ongkir, [subtotal, ongkir]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {state.error}
        </p>
      )}

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Data pemesan</h2>
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium mb-1">
            Nama wajib diisi
          </label>
          <input id="customerName" name="customerName" defaultValue={defaultName} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium mb-1">
              Nomor HP (10–15 digit)
            </label>
            <input id="customerPhone" name="customerPhone" inputMode="numeric" defaultValue={defaultPhone} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input id="customerEmail" name="customerEmail" type="email" defaultValue={defaultEmail} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
        </div>
      </section>

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Cara menerima bolu</h2>
        <div className="flex gap-2" role="radiogroup" aria-label="Metode penerimaan">
          {(["PICKUP", "DELIVERY"] as const).map((m) => (
            <label
              key={m}
              className={`min-h-11 flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 cursor-pointer ${
                fulfillment === m ? "border-aksen bg-aksen/10 font-medium" : "border-kakao/25"
              }`}
            >
              <input
                type="radio"
                name="fulfillment"
                value={m}
                checked={fulfillment === m}
                onChange={() => setFulfillment(m)}
              />
              {m === "PICKUP" ? "Ambil di toko" : "Antar lokal"}
            </label>
          ))}
        </div>

        {fulfillment === "PICKUP" ? (
          <p className="text-sm text-teks2">
            Jl. Melati No. 12, Coblong, Bandung 40132 · Buka 08.00–18.00. Ongkir Rp0.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="zoneId" className="block text-sm font-medium mb-1">
                Zona pengantaran
              </label>
              <select
                id="zoneId"
                name="zoneId"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nama} — {z.areaLabel} ({rupiah(z.fee)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="addressSnapshot" className="block text-sm font-medium mb-1">
                Alamat lengkap (nama jalan, nomor, kelurahan)
              </label>
              <textarea
                id="addressSnapshot"
                name="addressSnapshot"
                rows={3}
                defaultValue={alamatAwal}
                required
                placeholder="mis. Jl. Cempaka No. 5, RT 03/RW 01, Coblong"
                className="w-full rounded-lg border border-kakao/25 px-3 py-2"
              />
              <p className="text-xs text-teks2 mt-1">
                Contoh di luar zona: Lembang → &ldquo;Area ini belum terlayani&rdquo;. Ganti ke ambil di toko.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Jadwal</h2>
        <div>
          <label htmlFor="scheduledDate" className="block text-sm font-medium mb-1">
            Tanggal (minimal hari ini)
          </label>
          <input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            min={tanggalMin}
            defaultValue={tanggalMin}
            required
            className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="slotId" className="block text-sm font-medium mb-1">
            Slot waktu
          </label>
          <select id="slotId" name="slotId" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan">
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-teks2 mt-1">Slot yang penuh atau sudah lewat tidak dapat dipilih.</p>
        </div>
      </section>

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-2">
        <h2 className="font-bold text-lg">Ringkasan pesanan</h2>
        <ul className="text-sm space-y-1">
          {items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4">
              <span>
                {i.qty}× {i.nama} ({i.label})
                {i.note ? <em className="block text-teks2">ucapan: {i.note}</em> : null}
              </span>
              <span>{rupiah(i.harga * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-kakao/10 pt-2 text-sm space-y-1">
          <p className="flex justify-between">
            <span className="text-teks2">Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-teks2">Ongkir {fulfillment === "PICKUP" ? "(ambil di toko)" : ""}</span>
            <span>{rupiah(ongkir)}</span>
          </p>
          <p className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-aksen">{rupiah(total)}</span>
          </p>
        </div>
        <button
          disabled={pending || slots.length === 0}
          className="w-full min-h-11 rounded-lg bg-aksen text-atas font-medium py-3 disabled:opacity-50"
        >
          {pending ? "Membuat pesanan…" : "Buat pesanan"}
        </button>
        {slots.length === 0 && <p className="text-sm text-error">Tidak ada jadwal tersedia hari ini.</p>}
      </section>
    </form>
  );
}
