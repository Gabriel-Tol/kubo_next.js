import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { allowedNext } from "@/lib/services/order-status";
import { cekKedaluwarsa } from "@/lib/services/order";
import { jamWib, rupiah, tanggalPanjang } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { verifikasiBayar, tolakBuktiAksi, ubahStatusAksi, batalAksi } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function DetailPesananAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { err, ok } = await searchParams;
  await cekKedaluwarsa();

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      slot: true,
      zone: true,
      user: true,
      proofs: { orderBy: { uploadedAt: "desc" } },
      logs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const setting = await db.setting.findMany();
  const rekening = setting.find((x) => x.key === "rekening_demo")?.value ?? "Belum diatur";
  const bukti = order.proofs.find((p) => p.status === "SUBMITTED");
  const ditolak = order.proofs.filter((p) => p.status === "REJECTED");
  const lanjut = allowedNext(order.status, order.fulfillment as "PICKUP" | "DELIVERY");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{order.orderNo}</h1>
          <p className="text-teks2 text-sm">
            {tanggalPanjang(order.createdAt)} {jamWib(order.createdAt)} ·{" "}
            {order.fulfillment === "PICKUP" ? "Ambil di toko" : "Antar lokal"} · jadwal {order.scheduledDate} (
            {order.slot.label})
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {ok && (
        <p className="rounded-lg border border-sukses/40 bg-sukses/10 text-sukses px-4 py-3 text-sm">{ok}</p>
      )}
      {err && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {err}
        </p>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-permukaan border border-kakao/10 rounded-xl p-4 text-sm space-y-1">
          <h2 className="font-bold text-base">Pelanggan</h2>
          <p>{order.customerName}</p>
          <p>{order.customerPhone} · {order.customerEmail}</p>
          <p className="text-teks2">Akun: {order.user.email}</p>
          {order.fulfillment === "DELIVERY" && (
            <p className="pt-2">
              <span className="font-medium">Alamat antar:</span> {order.addressSnapshot}
              {order.zone ? ` · ${order.zone.name} — ${order.zone.areaLabel}` : ""}
            </p>
          )}
        </div>
        <div className="bg-permukaan border border-kakao/10 rounded-xl p-4 text-sm space-y-1">
          <h2 className="font-bold text-base">Pembayaran</h2>
          <p>
            Yang harus diterima: <span className="font-bold text-aksen">{rupiah(order.total)}</span> (subtotal{" "}
            {rupiah(order.subtotal)} + ongkir {rupiah(order.deliveryFee)})
          </p>
          <p className="font-mono text-xs break-all">Rekening tujuan: {rekening}</p>
          <p className="text-error text-xs">
            Peringatan: teks di gambar bukti tidak dianggap verifikasi. Cocokkan dengan mutasi rekening bank sungguhan.
          </p>
          <p className="text-teks2 text-xs">Batas bayar: {tanggalPanjang(order.paymentDueAt)} {jamWib(order.paymentDueAt)}</p>
        </div>
      </section>

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-4 space-y-3">
        <h2 className="font-bold text-base">Bukti transfer</h2>
        {!bukti ? (
          <p className="text-sm text-teks2">Belum ada bukti diunggah.</p>
        ) : (
          <div className="space-y-2">
            <a href={`/api/berkas/bukti/${bukti.id}`} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/berkas/bukti/${bukti.id}`}
                alt={`Bukti transfer ${order.orderNo}`}
                className="max-h-80 rounded-lg border border-kakao/15 object-contain bg-kanvas"
              />
            </a>
            <p className="text-xs text-teks2">
              {bukti.originalName} · {(bukti.sizeBytes / 1024).toFixed(0)} KB · unggah {jamWib(bukti.uploadedAt)} ·{" "}
              <a href={`/api/berkas/bukti/${bukti.id}`} target="_blank" rel="noreferrer" className="underline">
                Perbesar bukti
              </a>
            </p>
            <div className="flex flex-wrap gap-2">
              <form action={verifikasiBayar}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="min-h-11 rounded-lg bg-sukses text-white font-medium px-5 py-2">
                  Terima pembayaran
                </button>
              </form>
              <form action={tolakBuktiAksi} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="proofId" value={bukti.id} />
                <input type="hidden" name="orderId" value={order.id} />
                <div>
                  <label htmlFor="alasan-tolak" className="block text-xs text-teks2">
                    Alasan penolakan (wajib)
                  </label>
                  <input id="alasan-tolak" name="alasan" required className="min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
                </div>
                <button className="min-h-11 rounded-lg border border-error/40 text-error font-medium px-4 py-2">
                  Tolak bukti
                </button>
              </form>
            </div>
          </div>
        )}
        {ditolak.map((p) => (
          <p key={p.id} className="text-xs text-error">
            Ditolak {jamWib(p.reviewedAt ?? p.uploadedAt)} oleh {p.reviewedBy}: {p.rejectReason}
          </p>
        ))}
      </section>

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-base">Item (snapshot saat pesanan dibuat)</h2>
        <ul className="text-sm space-y-1">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span>
                {i.qty}× {i.productName} ({i.variantLabel}) @ {rupiah(i.unitPrice)}
                {i.note ? <em className="block text-teks2">ucapan: {i.note}</em> : null}
              </span>
              <span>{rupiah(i.lineTotal)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-kakao/10 pt-1 font-medium">
            <span>Total</span>
            <span>{rupiah(order.total)}</span>
          </li>
        </ul>
      </section>

      {lanjut.length > 0 && (
        <section className="bg-permukaan border border-kakao/10 rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-base">Ubah status</h2>
          <form action={ubahStatusAksi} className="flex flex-wrap gap-2 items-end">
            <input type="hidden" name="orderId" value={order.id} />
            <div>
              <label htmlFor="toStatus" className="block text-xs text-teks2">
                Status berikutnya (urutan valid saja)
              </label>
              <select id="toStatus" name="toStatus" className="min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan">
                {lanjut.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button className="min-h-11 rounded-lg bg-kakao text-kanvas font-medium px-5 py-2">Ubah status</button>
          </form>
          <form action={batalAksi} className="flex flex-wrap gap-2 items-end border-t border-kakao/10 pt-3">
            <input type="hidden" name="orderId" value={order.id} />
            <div>
              <label htmlFor="alasan-batal" className="block text-xs text-teks2">
                Alasan pembatalan (wajib; stok dikembalikan bila sudah terpotong)
              </label>
              <input id="alasan-batal" name="alasan" required className="min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
            </div>
            <button className="min-h-11 rounded-lg border border-error/40 text-error font-medium px-4 py-2">
              Batalkan pesanan
            </button>
          </form>
        </section>
      )}

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-4">
        <h2 className="font-bold text-base mb-2">Riwayat perubahan</h2>
        <ol className="text-sm space-y-2">
          {order.logs.map((l) => (
            <li key={l.id} className="border-l-2 border-kakao/15 pl-3">
              <p>
                {l.fromStatus ? `${l.fromStatus} → ` : ""}
                <strong>{l.toStatus}</strong>
              </p>
              <p className="text-xs text-teks2">
                {tanggalPanjang(l.createdAt)} {jamWib(l.createdAt)} · pelaku: {l.actorName}
                {l.note ? ` · ${l.note}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-sm">
        <Link href="/admin/pesanan" className="underline text-aksen">
          ← Kembali ke daftar pesanan
        </Link>
      </p>
    </div>
  );
}
