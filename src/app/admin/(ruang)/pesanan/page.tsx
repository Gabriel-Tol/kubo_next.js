import Link from "next/link";
import { db } from "@/lib/db";
import { cekKedaluwarsa } from "@/lib/services/order";
import { STATUS } from "@/lib/services/order-status";
import { rupiah, tanggalPanjang } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

const SEMUA_STATUS = [
  STATUS.MENUNGGU,
  STATUS.DIKONFIRMASI,
  STATUS.DIPROSES,
  STATUS.SIAP,
  STATUS.DIANTAR,
  STATUS.SELESAI,
  STATUS.BATAL,
];

export default async function AdminPesanan({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; perlu?: string; hal?: string }>;
}) {
  await cekKedaluwarsa();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? (sp.perlu === "1" ? STATUS.MENUNGGU : "");
  const hal = Math.max(1, Number(sp.hal) || 1);
  const perHal = 15;

  const orders = await db.order.findMany({
    include: {
      items: true,
      user: true,
      zone: true,
      proofs: { where: { status: "SUBMITTED" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const terfilter = orders.filter(
    (o) =>
      (!status || o.status === status) &&
      (!q ||
        o.orderNo.toLowerCase().includes(q.toLowerCase()) ||
        o.customerName.toLowerCase().includes(q.toLowerCase()))
  );
  const totalHal = Math.max(1, Math.ceil(terfilter.length / perHal));
  const daftar = terfilter.slice((hal - 1) * perHal, hal * perHal);
  const perluVerifikasi = orders.filter((o) => o.proofs.length > 0 && o.status === STATUS.MENUNGGU).length;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Pesanan</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <form method="get" className="flex gap-2 flex-wrap items-center">
          <input name="q" defaultValue={q} placeholder="Cari nomor / nama pelanggan" className="min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan" />
          <select name="status" defaultValue={status} className="min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan">
            <option value="">Semua status</option>
            {SEMUA_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="min-h-11 rounded-lg border border-kakao/25 px-4">Terapkan</button>
        </form>
        <Link
          href={sp.perlu === "1" ? "/admin/pesanan" : "/admin/pesanan?perlu=1"}
          className={`min-h-11 inline-flex items-center rounded-lg px-4 py-2 border text-sm ${
            sp.perlu === "1" ? "bg-error text-white border-error" : "bg-permukaan border-kakao/25"
          }`}
        >
          Perlu verifikasi ({perluVerifikasi})
        </Link>
      </div>

      <div className="bg-permukaan border border-kakao/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-kakao/10 text-left text-teks2">
              <th className="p-3">Nomor</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Pelanggan</th>
              <th className="p-3">Item</th>
              <th className="p-3">Terima</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((o) => (
              <tr key={o.id} className="border-b border-kakao/5 hover:bg-kanvas">
                <td className="p-3">
                  <Link href={`/admin/pesanan/${o.id}`} className="font-mono underline text-aksen">
                    {o.orderNo}
                  </Link>
                </td>
                <td className="p-3">{tanggalPanjang(o.createdAt)}</td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3">{o.items.map((i) => `${i.qty}× ${i.productName}`).join(", ")}</td>
                <td className="p-3">{o.fulfillment === "PICKUP" ? "Ambil" : `Antar${o.zone ? ` ${o.zone.name}` : ""}`}</td>
                <td className="p-3 font-medium">{rupiah(o.total)}</td>
                <td className="p-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-teks2">Tidak ada pesanan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalHal > 1 && (
        <nav className="flex gap-2" aria-label="Paginasi">
          {Array.from({ length: totalHal }).map((_, i) => {
            const href = `/admin/pesanan?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(status ? { status } : {}),
              hal: String(i + 1),
            })}`;
            return (
              <Link
                key={i}
                href={href}
                aria-current={hal === i + 1 ? "page" : undefined}
                className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border ${
                  hal === i + 1 ? "bg-kakao text-kanvas border-kakao" : "bg-permukaan border-kakao/25"
                }`}
              >
                {i + 1}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
