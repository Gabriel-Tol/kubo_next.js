import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cekKedaluwarsa } from "@/lib/services/order";
import { rupiah } from "@/lib/format";
import { FormBukti } from "@/components/shop/FormBukti";
import { HitungMundur } from "@/components/shop/HitungMundur";

export const dynamic = "force-dynamic";

export default async function Bayar({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect(`/masuk?next=/pesanan/${orderNo}/bayar`);

  await cekKedaluwarsa();
  const order = await db.order.findUnique({
    where: { orderNo },
    include: { items: true, proofs: { orderBy: { uploadedAt: "desc" } } },
  });
  if (!order || order.userId !== s.userId) notFound();

  if (order.status !== "Menunggu Pembayaran") {
    redirect(`/pesanan/${orderNo}`);
  }
  const kedaluwarsa = order.paymentDueAt < new Date();

  const setting = await db.setting.findMany();
  const kontak = setting.find((x) => x.key === "kontak_toko")?.value ?? "-";
  const ditolak = order.proofs.find((p) => p.status === "REJECTED");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bayar pesanan {order.orderNo}</h1>
        <p className="text-teks2 mt-1">
          Total pembayaran: <span className="font-bold text-aksen">{rupiah(order.total)}</span>
        </p>
      </div>

      {kedaluwarsa ? (
        <div className="bg-permukaan border border-error/40 rounded-xl p-6 space-y-3">
          <p className="font-medium text-error">Batas pembayaran berakhir. Pesanan dibatalkan otomatis.</p>
          <Link href="/katalog" className="inline-flex min-h-11 items-center rounded-lg bg-aksen text-atas font-medium px-5 py-2">
            Buat pesanan baru
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-3">
            <HitungMundur dueIso={order.paymentDueAt.toISOString()} />
            <div className="flex flex-col items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/qris-qr.webp"
                alt={`QRIS KUBO untuk pembayaran ${order.orderNo}`}
                className="w-60 h-60 border border-kakao/10 rounded-lg"
              />
              <p className="text-sm text-teks2 text-center">
                Scan kode QRIS di atas memakai aplikasi bank atau e-wallet berlogo QRIS.
              </p>
            </div>
            <p className="text-xs text-error text-center">
              Konfirmasi ke admin via WA {kontak} setelah membayar.
            </p>
            <ol className="text-sm text-teks2 list-decimal pl-5 pt-2 space-y-1">
              <li>Buka aplikasi bank/e-wallet Anda, pilih Scan QRIS.</li>
              <li>Scan kode di atas, bayar tepat {rupiah(order.total)}.</li>
              <li>Simpan screenshot struk pembayaran, lalu unggah di bawah ini.</li>
            </ol>
          </div>

          {ditolak && (
            <div className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm space-y-1">
              <p className="font-medium">Bukti sebelumnya ditolak.</p>
              <p>Alasan: {ditolak.rejectReason}</p>
              <p>Silakan unggah ulang sebelum batas waktu habis.</p>
            </div>
          )}

          <FormBukti orderNo={order.orderNo} />
        </>
      )}
    </div>
  );
}
