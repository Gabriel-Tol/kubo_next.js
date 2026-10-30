import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STATUS_AKTIF, statusAkhir } from "@/lib/services/order-status";
import { cekKedaluwarsa } from "@/lib/services/order";
import { rupiah, tanggalPanjang } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function Riwayat({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk?next=/pesanan");
  await cekKedaluwarsa();

  const orders = await db.order.findMany({
    where: { userId: s.userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const aktif = orders.filter((o) => !statusAkhir(o.status));
  const daftar = tab === "aktif" ? aktif : orders;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Riwayat pesanan</h1>
      <div className="flex gap-2" role="tablist" aria-label="Filter riwayat">
        <Link
          href="/pesanan"
          role="tab"
          aria-selected={!tab}
          className={`min-h-11 inline-flex items-center rounded-full px-4 py-2 text-sm border ${
            tab !== "aktif" ? "bg-kakao text-kanvas border-kakao" : "bg-permukaan border-kakao/20"
          }`}
        >
          Semua ({orders.length})
        </Link>
        <Link
          href="/pesanan?tab=aktif"
          role="tab"
          aria-selected={tab === "aktif"}
          className={`min-h-11 inline-flex items-center rounded-full px-4 py-2 text-sm border ${
            tab === "aktif" ? "bg-kakao text-kanvas border-kakao" : "bg-permukaan border-kakao/20"
          }`}
        >
          Aktif ({aktif.length})
        </Link>
      </div>

      {daftar.length === 0 ? (
        <div className="bg-permukaan border border-kakao/10 rounded-xl p-10 text-center space-y-3">
          <p className="font-judul text-2xl">Belum ada pesanan.</p>
          <Link href="/katalog" className="inline-flex min-h-11 items-center rounded-lg bg-aksen text-atas font-medium px-5 py-2">
            Belanja bolu
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {daftar.map((o) => (
            <li key={o.id} className="bg-permukaan border border-kakao/10 rounded-xl p-4 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[220px]">
                <p className="font-medium">{o.orderNo}</p>
                <p className="text-sm text-teks2">
                  {tanggalPanjang(o.createdAt)} · {o.fulfillment === "PICKUP" ? "Ambil di toko" : "Antar lokal"}
                </p>
                <p className="text-sm">
                  {o.items.map((i) => `${i.qty}× ${i.productName}`).join(", ")}
                </p>
              </div>
              <div className="text-right space-y-2">
                <StatusBadge status={o.status} />
                <p className="font-semibold">{rupiah(o.total)}</p>
                <Link href={`/pesanan/${o.orderNo}`} className="text-sm underline text-aksen block min-h-11 leading-11">
                  Lihat detail pesanan
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-teks2">
        Status aktif: {STATUS_AKTIF.join(" · ")}
      </p>
    </div>
  );
}
