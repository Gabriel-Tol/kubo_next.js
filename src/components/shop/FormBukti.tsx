"use client";

import { useActionState, useRef, useState } from "react";
import { unggahBukti } from "@/app/actions";

const MAX = 2 * 1024 * 1024;

export function FormBukti({ orderNo }: { orderNo: string }) {
  const [state, formAction, pending] = useActionState(unggahBukti, undefined);
  const [nama, setNama] = useState("");
  const [pesanKlien, setPesanKlien] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  function onChange() {
    const f = ref.current?.files?.[0];
    setPesanKlien("");
    if (!f) {
      setNama("");
      return;
    }
    setNama(f.name);
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setPesanKlien("Format berkas salah. Hanya JPG atau PNG yang diterima.");
    } else if (f.size > MAX) {
      setPesanKlien("Ukuran berkas terlalu besar. Maksimal 2 MB.");
    }
  }

  return (
    <form action={formAction} className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-3">
      <input type="hidden" name="orderNo" value={orderNo} />
      <h2 className="font-bold text-lg">Unggah bukti transfer</h2>
      <p className="text-sm text-teks2">
        Foto struk atau screenshot mutasi rekening. Hanya <strong>JPG/PNG, maksimal 2 MB</strong>.
      </p>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
      {pesanKlien && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {pesanKlien}
        </p>
      )}
      <input
        ref={ref}
        type="file"
        name="bukti"
        accept="image/jpeg,image/png"
        required
        onChange={onChange}
        className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-kakao file:px-4 file:text-kanvas"
      />
      {nama && <p className="text-sm text-teks2">Berkas terpilih: {nama}</p>}
      <button
        disabled={pending || !!pesanKlien}
        className="min-h-11 rounded-lg bg-aksen text-white font-medium px-6 py-3 disabled:opacity-50"
      >
        {pending ? "Mengunggah…" : "Kirim bukti"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (ref.current) ref.current.value = "";
          setNama("");
          setPesanKlien("");
        }}
        className="min-h-11 rounded-lg border border-kakao/25 px-4 py-2 text-sm"
      >
        Ganti berkas
      </button>
    </form>
  );
}
