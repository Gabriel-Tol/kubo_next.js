import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Konfirmasi({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk");
  const order = await db.order.findUnique({ where: { orderNo }, include: { items: true } });
  if (!order || order.userId !== s.userId) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      <div className="bg-permukaan border border-kakao/10 rounded-xl p-8 space-y-3">
        <p className="text-5xl" aria-hidden>
          ✓
        </p>
        <h1 className="text-3xl font-bold">Bukti terkirim</h1>
        <p className="font-medium">{order.orderNo}</p>
        <p className="text-teks2">
          Menunggu verifikasi manual oleh admin — bukti terkirim bukan berarti pembayaran disetujui.
        </p>
        <p className="text-sm text-teks2">
          Total {rupiah(order.total)} · {order.items.map((i) => `${i.qty}× ${i.productName}`).join(", ")}
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <Link
            href={`/pesanan/${order.orderNo}`}
            className="min-h-11 inline-flex items-center rounded-lg bg-aksen text-atas font-medium px-5 py-2"
          >
            Lacak status pesanan
          </Link>
          <Link href="/pesanan" className="min-h-11 inline-flex items-center rounded-lg border border-kakao/25 px-5 py-2">
            Riwayat pesanan
          </Link>
        </div>
      </div>
    </div>
  );
}
