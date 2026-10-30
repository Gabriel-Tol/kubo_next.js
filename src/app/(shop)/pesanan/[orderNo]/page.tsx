import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STATUS } from "@/lib/services/order-status";
import { cekKedaluwarsa } from "@/lib/services/order";
import { jamWib, rupiah, tanggalPanjang } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

const TAHAPAN: string[] = [
  STATUS.MENUNGGU,
  STATUS.DIKONFIRMASI,
  STATUS.DIPROSES,
  STATUS.SIAP, // untuk ambil; antar memakai STATUS.DIANTAR
  STATUS.SELESAI,
];

export default async function LacakPesanan({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect(`/masuk?next=/pesanan/${orderNo}`);
  await cekKedaluwarsa();

  const order = await db.order.findUnique({
    where: { orderNo },
    include: { items: true, logs: { orderBy: { createdAt: "asc" } }, slot: true, zone: true },
  });
  if (!order || order.userId !== s.userId) notFound();

  const setting = await db.setting.findMany();
  const kontak = setting.find((x) => x.key === "kontak_toko")?.value ?? "-";
  const waDigit = kontak.replace(/\D/g, "");
  const wa = waDigit.startsWith("62") ? waDigit : "62" + waDigit.replace(/^0/, "");
  const antar = order.fulfillment === "DELIVERY";
  const tahapan = TAHAPAN.map((t) => (t === STATUS.SIAP && antar ? STATUS.DIANTAR : t));
  const idx = tahapan.indexOf(order.status);
  const dibatalkan = order.status === STATUS.BATAL;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{order.orderNo}</h1>
          <p className="text-teks2 text-sm">
            {tanggalPanjang(order.createdAt)} · {order.items.length} item · {rupiah(order.total)} ·{" "}
            {antar ? "Antar lokal" : "Ambil di toko"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {dibatalkan ? (
        <div className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm space-y-1">
          <p className="font-medium">Pesanan dibatalkan.</p>
          <p>Alasan: {order.cancelReason}</p>
          <Link href="/katalog" className="underline font-medium">
            Buat pesanan baru
          </Link>
        </div>
      ) : (
        <ol className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-4">
          {tahapan.map((t, i) => {
            const log = order.logs.find((l) => l.toStatus === t);
            const selesai = idx > i || order.status === t;
            const kini = order.status === t;
            return (
              <li key={t} className="flex gap-3">
                <span
                  aria-hidden
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                    kini ? "bg-aksen ring-4 ring-aksen/20" : selesai ? "bg-sukses" : "bg-kakao/15"
                  }`}
                />
                <div>
                  <p className={`font-medium ${selesai ? "" : "text-teks2"}`}>{t}</p>
                  {log ? (
                    <p className="text-sm text-teks2">
                      {tanggalPanjang(log.createdAt)} {jamWib(log.createdAt)}
                      {log.note ? ` · ${log.note}` : ""}
                    </p>
                  ) : (
                    <p className="text-sm text-teks2">Menunggu tahap sebelumnya</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!dibatalkan && (
        <div className="bg-permukaan border border-kakao/10 rounded-xl p-5 text-sm space-y-2">
          <h2 className="font-bold text-base">Langkah berikutnya</h2>
          {antar ? (
            <>
              <p>
                Kami antar ke {order.addressSnapshot ?? "-"} pada {order.scheduledDate} ({order.slot.label}).
              </p>
              <p className="text-teks2">Tidak ada pelacakan GPS — pantau lewat status pesanan ini.</p>
            </>
          ) : (
            <p>
              Datang setelah status <strong>Siap Diambil</strong> ke Lingga, Kec. Sungai Ambawang, Kabupaten Kubu
              Raya. Tunjukkan
              nomor pesanan {order.orderNo}.
            </p>
          )}
          <p>
            Jadwal: {order.scheduledDate} ({order.slot.label})
            {order.zone ? ` · ${order.zone.name} ${order.zone.areaLabel} · ongkir ${rupiah(order.deliveryFee)}` : ""}
          </p>
          <a
            href={`https://wa.me/${wa}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-kakao/25 px-4 py-2"
          >
            Hubungi toko (WA {kontak})
          </a>
        </div>
      )}

      <ul className="bg-permukaan border border-kakao/10 rounded-xl p-5 text-sm space-y-1">
        <h2 className="font-bold text-base">Item</h2>
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4">
            <span>
              {i.qty}× {i.productName} ({i.variantLabel})
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
    </div>
  );
}
