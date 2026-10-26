"use client";

import { useEffect, useState } from "react";

export function HitungMundur({ dueIso }: { dueIso: string }) {
  const [sisa, setSisa] = useState(() => Math.max(0, new Date(dueIso).getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setSisa(Math.max(0, new Date(dueIso).getTime() - Date.now())), 1000);
    return () => clearInterval(t);
  }, [dueIso]);

  if (sisa <= 0) {
    return <p className="font-medium text-error">Batas pembayaran berakhir — muat ulang halaman ini.</p>;
  }
  const m = Math.floor(sisa / 60000);
  const d = Math.floor((sisa % 60000) / 1000);
  return (
    <p className="font-medium">
      Bayar dalam <span className="tabular-nums text-aksen">{m} menit {String(d).padStart(2, "0")} detik</span> atau
      pesanan otomatis dibatalkan.
    </p>
  );
}
