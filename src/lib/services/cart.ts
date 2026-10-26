import { db } from "@/lib/db";
import { getOrCreateGuestToken, getSession, peekGuestToken } from "@/lib/auth";

// Hanya membaca — aman dipanggil saat render RSC. Token tamu dibuat saat aksi pertama.
export async function getKeranjang() {
  const s = await getSession();
  if (s) {
    return db.cart.findUnique({
      where: { userId: s.userId },
      include: { items: { include: { variant: { include: { product: { include: { category: true } } } } }, orderBy: { id: "asc" } } },
    });
  }
  const token = await peekGuestToken();
  if (!token) return null;
  return db.cart.findUnique({
    where: { guestToken: token },
    include: { items: { include: { variant: { include: { product: { include: { category: true } } } } }, orderBy: { id: "asc" } } },
  });
}

export async function getOrCreateKeranjang() {
  const existing = await getKeranjang();
  if (existing) return existing;
  const s = await getSession();
  if (s) {
    return db.cart.create({
      data: { userId: s.userId },
      include: { items: { include: { variant: { include: { product: { include: { category: true } } } } } } },
    });
  }
  const token = (await getOrCreateGuestToken())!;
  return db.cart.create({
    data: { guestToken: token },
    include: { items: { include: { variant: { include: { product: { include: { category: true } } } } } } },
  });
}

// Keranjang tamu digabung ke akun saat masuk/daftar (PRD US-04).
export async function gabungKeranjangTamu(userId: string, guestToken: string | null) {
  if (!guestToken) return;
  const tamu = await db.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  if (!tamu || tamu.items.length === 0) return;
  const punyaUser = await db.cart.findUnique({
    where: { userId },
    include: { items: true },
  });
  if (!punyaUser) {
    await db.cart.update({ where: { id: tamu.id }, data: { guestToken: null, userId } });
    return;
  }
  for (const item of tamu.items) {
    const ada = punyaUser.items.find((i) => i.variantId === item.variantId);
    if (ada) {
      await db.cartItem.update({
        where: { id: ada.id },
        data: { qty: { increment: item.qty } },
      });
      await db.cartItem.delete({ where: { id: item.id } });
    } else {
      await db.cartItem.update({ where: { id: item.id }, data: { cartId: punyaUser.id } });
    }
  }
  await db.cart.delete({ where: { id: tamu.id } });
}
