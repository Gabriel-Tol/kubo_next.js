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
  const rekening = setting.find((x) => x.key === "rekening_demo")?.value ?? "Belum diatur";
  const kontak = setting.find((x) => x.key === "kontak_toko")?.value ?? "-";
  const ditolak = order.proofs.find((p) => p.status === "REJECTED");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bayar pesanan {order.orderNo}</h1>
        <p className="text-teks2 mt-1">
          Total transfer: <span className="font-bold text-aksen">{rupiah(order.total)}</span>
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
          <div className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-2">
            <HitungMundur dueIso={order.paymentDueAt.toISOString()} />
            <p className="text-sm text-teks2">Rekening tujuan:</p>
            <p className="font-mono text-sm break-all">{rekening}</p>
            <p className="text-xs text-error">
              Rekening demo — jangan transfer sungguhan. Konfirmasi ke admin via WA {kontak}.
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(rekening)}
              className="min-h-11 rounded-lg border border-kakao/25 px-4 py-2 text-sm"
            >
              Salin rekening
            </button>
            <ol className="text-sm text-teks2 list-decimal pl-5 pt-2 space-y-1">
              <li>Buka aplikasi mBanking Anda, pilih Transfer.</li>
              <li>Masukkan rekening tujuan di atas, transfer tepat {rupiah(order.total)}.</li>
              <li>Simpan struk/screenshot, lalu unggah di bawah ini.</li>
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
