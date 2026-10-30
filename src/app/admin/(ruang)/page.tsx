import Link from "next/link";
import { db } from "@/lib/db";
import { cekKedaluwarsa } from "@/lib/services/order";
import { STATUS, STATUS_AKTIF } from "@/lib/services/order-status";
import { penjualanProduk } from "@/lib/services/pricing";
import { rupiah, tanggalPanjang } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

function mulaiHariIni(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardAdmin() {
  await cekKedaluwarsa();
  const hariIni = mulaiHariIni();

  const [pesananHariIni, semua, perluVerifikasi, proses, terbaru] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: hariIni } } }),
    db.order.findMany({
      include: { items: true, proofs: { where: { status: "SUBMITTED" } }, user: true },
      orderBy: { createdAt: "desc" },
    }),
    db.paymentProof.count({ where: { status: "SUBMITTED", order: { status: STATUS.MENUNGGU } } }),
    db.order.count({ where: { status: { in: [STATUS.DIPROSES, STATUS.SIAP, STATUS.DIANTAR] } } }),
    db.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  // Penjualan produk = pesanan terkonfirmasi (bukan batal), tanpa ongkir (BR-03)
  const terkonfirmasi = semua.filter(
    (o) => o.createdAt >= hariIni && o.status !== STATUS.BATAL && o.status !== STATUS.MENUNGGU
  );
  const penjualan = terkonfirmasi.reduce((n, o) => n + penjualanProduk(o.total, o.deliveryFee), 0);
  const antrian = STATUS_AKTIF.filter((s) => s !== STATUS.MENUNGGU).map((s) => ({
    status: s,
    jml: semua.filter((o) => o.status === s).length,
  }));
  const butuhPerhatian = semua.filter((o) => o.proofs.length > 0 && o.status === STATUS.MENUNGGU);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard operasional</h1>
        <p className="text-teks2 text-sm">{tanggalPanjang(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kartu label="Pesanan hari ini" nilai={String(pesananHariIni)} />
        <Kartu label="Penjualan terkonfirmasi (tanpa ongkir)" nilai={rupiah(penjualan)} />
        <Kartu label="Perlu verifikasi" nilai={String(perluVerifikasi)} sorot={perluVerifikasi > 0} />
      </div>

      <section>
        <h2 className="font-bold text-lg mb-2">Antrian produksi</h2>
        <div className="grid grid-cols-3 gap-3">
          {antrian.map((a) => (
            <Kartu key={a.status} label={a.status} nilai={String(a.jml)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-2">Butuh perhatian</h2>
        {butuhPerhatian.length === 0 ? (
          <p className="text-sm text-teks2 bg-permukaan border border-kakao/10 rounded-xl p-4">
            Tidak ada bukti menunggu verifikasi. Semua beres.
          </p>
        ) : (
          <ul className="space-y-2">
            {butuhPerhatian.map((o) => (
              <li key={o.id} className="bg-permukaan border border-error/40 rounded-xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{o.orderNo} · {o.user.fullName}</p>
                  <p className="text-sm text-teks2">
                    Bukti masuk, belum diverifikasi · batas {o.paymentDueAt.toLocaleTimeString("id-ID")}
                  </p>
                </div>
                <Link
                  href={`/admin/pesanan/${o.id}`}
                  className="min-h-11 inline-flex items-center rounded-lg bg-aksen text-atas font-medium px-4 py-2 text-sm"
                >
                  Verifikasi pembayaran
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-bold text-lg mb-2">Pesanan terbaru</h2>
        <div className="bg-permukaan border border-kakao/10 rounded-xl divide-y divide-kakao/10">
          {terbaru.map((o) => (
            <Link key={o.id} href={`/admin/pesanan/${o.id}`} className="flex flex-wrap gap-3 items-center p-4 hover:bg-kanvas">
              <span className="font-mono text-sm">{o.orderNo}</span>
              <span className="text-sm flex-1">{o.items.map((i) => `${i.qty}× ${i.productName}`).join(", ")}</span>
              <StatusBadge status={o.status} />
              <span className="font-medium text-sm">{rupiah(o.total)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kartu({ label, nilai, sorot }: { label: string; nilai: string; sorot?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${sorot ? "border-error/40 bg-error/5" : "border-kakao/10 bg-permukaan"}`}>
      <p className="text-sm text-teks2">{label}</p>
      <p className="text-2xl font-bold">{nilai}</p>
    </div>
  );
}
