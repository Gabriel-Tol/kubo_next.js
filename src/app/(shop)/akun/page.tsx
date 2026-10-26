import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { simpanProfil, tambahAlamat, keluar } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Akun({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const { err, ok } = await searchParams;
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") redirect("/masuk?next=/akun");

  const [user, alamat, zones] = await Promise.all([
    db.user.findUnique({ where: { id: s.userId } }),
    db.address.findMany({ where: { userId: s.userId }, include: { zone: true } }),
    db.deliveryZone.findMany({ where: { isActive: true } }),
  ]);
  if (!user) redirect("/masuk");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Akun saya</h1>
      {ok && (
        <p className="rounded-lg border border-sukses/40 bg-sukses/10 text-sukses px-4 py-3 text-sm">{ok}</p>
      )}
      {err && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {err}
        </p>
      )}

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-3">Profil</h2>
        <form action={simpanProfil} className="space-y-3">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">
              Nama lengkap
            </label>
            <input id="fullName" name="fullName" defaultValue={user.fullName} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Nomor HP (10–15 digit)
            </label>
            <input id="phone" name="phone" inputMode="numeric" defaultValue={user.phone} required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <p className="text-sm text-teks2">Email: {user.email} (tidak bisa diubah di versi ini)</p>
          <button className="min-h-11 rounded-lg bg-kakao text-kanvas font-medium px-5 py-2">Simpan profil</button>
        </form>
      </section>

      <section className="bg-permukaan border border-kakao/10 rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Alamat tersimpan</h2>
        {alamat.length === 0 && <p className="text-sm text-teks2">Belum ada alamat.</p>}
        <ul className="space-y-2 text-sm">
          {alamat.map((a) => (
            <li key={a.id} className="rounded-lg border border-kakao/15 p-3">
              <p className="font-medium">
                {a.label} {a.isDefault && <span className="text-xs text-aksen">· utama</span>}
              </p>
              <p>{a.recipientName} · {a.phone}</p>
              <p className="text-teks2">{a.street}</p>
              <p className="text-teks2">
                {a.zone.name} — {a.zone.areaLabel}
                {a.landmark ? ` · Patokan: ${a.landmark}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <form action={tambahAlamat} className="grid md:grid-cols-2 gap-3 border-t border-kakao/10 pt-4">
          <h3 className="font-medium md:col-span-2">Tambah alamat</h3>
          <div>
            <label htmlFor="label" className="block text-sm mb-1">Label (mis. Rumah)</label>
            <input id="label" name="label" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="recipientName" className="block text-sm mb-1">Nama penerima</label>
            <input id="recipientName" name="recipientName" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="a-phone" className="block text-sm mb-1">HP penerima (10–15 digit)</label>
            <input id="a-phone" name="phone" inputMode="numeric" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="zoneId" className="block text-sm mb-1">Area layanan</label>
            <select id="zoneId" name="zoneId" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2 bg-permukaan">
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.areaLabel}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="street" className="block text-sm mb-1">Alamat lengkap</label>
            <input id="street" name="street" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="landmark" className="block text-sm mb-1">Patokan (opsional)</label>
            <input id="landmark" name="landmark" className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
          </div>
          <button className="md:col-span-2 min-h-11 rounded-lg bg-kakao text-kanvas font-medium px-5 py-2">
            Tambah alamat
          </button>
        </form>
      </section>

      <form action={keluar}>
        <button className="min-h-11 rounded-lg border border-error/40 text-error font-medium px-5 py-2">
          Keluar dari akun
        </button>
      </form>
      <p className="text-sm text-teks2">
        <Link href="/pesanan" className="underline">Lihat riwayat pesanan</Link>
      </p>
    </div>
  );
}
