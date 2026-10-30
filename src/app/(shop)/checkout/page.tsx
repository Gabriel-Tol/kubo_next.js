import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getKeranjang } from "@/lib/services/cart";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { tanggalIsoHariIni } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Checkout() {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk?next=/checkout");

  const [cart, user, zones, slots, alamat] = await Promise.all([
    getKeranjang(),
    db.user.findUnique({ where: { id: s.userId } }),
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.timeSlot.findMany({ where: { isActive: true }, orderBy: { startTime: "asc" } }),
    db.address.findMany({ where: { userId: s.userId }, orderBy: { isDefault: "desc" } }),
  ]);
  const items = cart?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="bg-permukaan border border-kakao/10 rounded-xl p-10 text-center space-y-3">
        <p className="font-judul text-2xl">Keranjang masih kosong.</p>
        <Link href="/katalog" className="inline-flex min-h-11 items-center rounded-lg bg-aksen text-atas font-medium px-5 py-2">
          Jelajahi katalog
        </Link>
      </div>
    );
  }
  const subtotal = items.reduce((n, i) => n + i.variant.price * i.qty, 0);
  const zonaAwal = alamat.find((a) => a.isDefault)?.zoneId ?? zones[0]?.id;

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
      <CheckoutForm
        zones={zones.map((z) => ({ id: z.id, nama: z.name, areaLabel: z.areaLabel, fee: z.fee }))}
        slots={slots.map((sl) => ({ id: sl.id, label: `${sl.label}${sl.isFull ? " — Penuh" : ""}` }))}
        items={items.map((i) => ({
          nama: i.variant.product.name,
          label: i.variant.label,
          qty: i.qty,
          harga: i.variant.price,
          note: i.note,
        }))}
        subtotal={subtotal}
        defaultName={user?.fullName ?? ""}
        defaultPhone={user?.phone ?? ""}
        defaultEmail={user?.email ?? ""}
        alamatAwal={alamat.find((a) => a.isDefault)?.street}
        zonaAwal={zonaAwal}
        tanggalMin={tanggalIsoHariIni()}
      />
      <aside className="bg-permukaan border border-kakao/10 rounded-xl p-5 text-sm text-teks2 space-y-2 md:sticky md:top-20">
        <h2 className="font-bold text-lg text-kakao">Perlu diketahui</h2>
        <p>
          Pembayaran lewat transfer bank manual. Setelah pesanan dibuat Anda punya <strong>60 menit</strong> untuk
          unggah bukti, lalu diverifikasi admin (bukti masuk ≠ pembayaran disetujui).
        </p>
        <p>Stok dipotong saat pesanan dikonfirmasi admin, bukan saat checkout.</p>
        <p>
          Alamat tersimpan:{" "}
          {alamat.length > 0
            ? alamat.map((a) => `${a.label} (${a.street})`).join(", ")
            : "belum ada — bisa diisi manual di /akun"}
          .
        </p>
      </aside>
    </div>
  );
}
