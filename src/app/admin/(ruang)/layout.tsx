import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { keluarAdmin } from "@/app/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MENU = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produk", label: "Produk" },
  { href: "/admin/pesanan", label: "Pesanan" },
];

// Otorisasi ADMIN dicek di layout ini; cek yang sama juga dilakukan di setiap
// server action admin (wajibAdmin) — bukan hanya di middleware.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/admin/masuk");
  if (s.role !== "ADMIN") redirect("/"); // akun pelanggan ditolak

  const [user, perluVerifikasi] = await Promise.all([
    db.user.findUnique({ where: { id: s.userId } }),
    db.paymentProof.count({
      where: {
        status: "SUBMITTED",
        order: { status: "Menunggu Pembayaran" },
      },
    }),
  ]);

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start -mx-5 lg:-mx-10 px-5 lg:px-10">
      <aside className="bg-permukaan border border-kakao/10 rounded-xl p-3 md:sticky md:top-20">
        <p className="text-xs uppercase tracking-wide text-teks2 px-2">Ruang admin</p>
        <p className="font-medium px-2 py-1">{user?.fullName}</p>
        <nav className="flex md:flex-col gap-1 mt-2 flex-wrap">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="px-3 py-2 min-h-11 flex items-center rounded-lg hover:bg-kanvas text-sm"
            >
              {m.label}
              {m.href === "/admin/pesanan" && perluVerifikasi > 0 && (
                <span className="ml-2 rounded-full bg-error/10 text-error border border-error/40 px-2 py-0.5 text-xs font-medium">
                  {perluVerifikasi}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-kakao/10 mt-3 pt-3 flex flex-col gap-1">
          <Link href="/" className="px-3 py-2 min-h-11 flex items-center rounded-lg hover:bg-kanvas text-sm">
            Lihat toko
          </Link>
          <form action={keluarAdmin}>
            <button className="w-full text-left px-3 py-2 min-h-11 rounded-lg hover:bg-kanvas text-sm text-error">
              Keluar dari admin
            </button>
          </form>
        </div>
      </aside>
      <div className="pb-8">{children}</div>
    </div>
  );
}
