import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

async function main() {
  const zoneA = await db.deliveryZone.upsert({
    where: { id: "zone-a" },
    update: {},
    create: { id: "zone-a", name: "Zona A", areaLabel: "Pontianak Kota", fee: 10000 },
  });
  const zoneB = await db.deliveryZone.upsert({
    where: { id: "zone-b" },
    update: {},
    create: { id: "zone-b", name: "Zona B", areaLabel: "Pontianak Utara", fee: 20000 },
  });
  void zoneA;
  void zoneB;

  const kategori = [
    { name: "Bolu klasik", slug: "bolu-klasik", sortOrder: 1 },
  ];
  const kat: Record<string, string> = {};
  for (const k of kategori) {
    const c = await db.category.upsert({ where: { slug: k.slug }, update: k, create: k });
    kat[k.name] = c.id;
  }

  const produk = [
    {
      name: "Bolu Marmer",
      slug: "bolu-marmer",
      categoryId: kat["Bolu klasik"],
      description: "Bolu marmer lembut dengan aroma butter, motif marmer klasik.",
      composition: "Tepung terigu, telur, gula, butter, cokelat, susu",
      allergens: "Gluten, telur, susu",
      imageUrl: "/images/bolu-marmer-cokelat.webp",
      variants: [
        { label: "20 cm", price: 20000, stock: 8 },
        { label: "24 cm", price: 20000, stock: 4 },
      ],
    },
    {
      name: "Bolu Pandan",
      slug: "bolu-pandan",
      categoryId: kat["Bolu klasik"],
      description: "Bolu pandan wangi dengan krim kelapa muda.",
      composition: "Tepung terigu, telur, gula, santan, pasta pandan",
      allergens: "Gluten, telur",
      imageUrl: "/images/bolu-marmer-pandan.webp",
      variants: [{ label: "20 cm", price: 20000, stock: 12 }],
    },
    {
      name: "Bolu Cokelat",
      slug: "bolu-cokelat",
      categoryId: kat["Bolu klasik"],
      description: "Bolu cokelat fudgy dengan lelehan cokelat gelap.",
      composition: "Tepung terigu, telur, gula, cokelat, butter, susu",
      allergens: "Gluten, telur, susu",
      imageUrl: "/images/bolu-panggang-meses-cokelat.webp",
      variants: [{ label: "20 cm", price: 20000, stock: 6 }],
    },
    {
      name: "Bolu Meses Warna-warni",
      slug: "bolu-meses-warna-warni",
      categoryId: kat["Bolu klasik"],
      description: "Bolu tabur meses warna-warni, ceria dan cocok untuk hadiah.",
      composition: "Tepung terigu, telur, gula, butter, meses, sukade",
      allergens: "Gluten, telur, susu",
      imageUrl: "/images/bolu-meses-warna-warni.webp",
      variants: [{ label: "20 cm", price: 25000, stock: 7 }],
    },
    {
      name: "Bolu Pisang",
      slug: "bolu-pisang",
      categoryId: kat["Bolu klasik"],
      description: "Bolu pisang ambon matang, manis alami tanpa pemanis buatan.",
      composition: "Tepung terigu, telur, pisang ambon, gula, butter",
      allergens: "Gluten, telur, susu",
      imageUrl: "/images/bolu-pisang.webp",
      variants: [{ label: "20 cm", price: 25000, stock: 0 }],
    },
  ];

  for (const p of produk) {
    const { variants, ...data } = p;
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: { imageUrl: data.imageUrl ?? null },
      create: {
        ...data,
        variants: { create: variants },
      },
    });
    void product;
  }

  const slotData = [
    { label: "08.00–10.00", startTime: "08:00", endTime: "10:00" },
    { label: "10.00–12.00", startTime: "10:00", endTime: "12:00" },
    { label: "13.00–15.00", startTime: "13:00", endTime: "15:00" },
    { label: "15.00–17.00", startTime: "15:00", endTime: "17:00" },
  ];
  for (const s of slotData) {
    await db.timeSlot.upsert({ where: { id: `slot-${s.startTime.replace(":", "")}` }, update: {}, create: { id: `slot-${s.startTime.replace(":", "")}`, ...s } });
  }

  const settings: Record<string, string> = {
    nama_toko: "Bolu Hangat",
    logo: "KUBO",
    alamat_toko: "Jl. Melati No. 12, Pontianak Kota, Pontianak 78111",
    jam_buka: "08.00–18.00",
    kontak_toko: "0812-0000-0000",
    rekening_demo: "1234567890 a.n. Bolu Hangat (DEMO — jangan transfer)",
    batas_bayar_menit: "60",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  await db.user.upsert({
    where: { email: "admin@kubo.id" },
    update: {},
    create: {
      email: "admin@kubo.id",
      passwordHash: hashPassword("admin12345"),
      fullName: "Ayu (Admin)",
      phone: "081100000001",
      role: "ADMIN",
    },
  });
  await db.user.upsert({
    where: { email: "nabila@contoh.id" },
    update: {},
    create: {
      email: "nabila@contoh.id",
      passwordHash: hashPassword("cobain123"),
      fullName: "Nabila Putri",
      phone: "081200000002",
      role: "CUSTOMER",
    },
  });

  console.log("Seed selesai: 5 produk, 2 zona, 4 slot, admin & pelanggan demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
