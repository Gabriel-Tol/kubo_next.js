import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduk({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, kategori] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!p) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Edit {p.name}</h1>
      <ProductForm
        kategori={kategori}
        produk={{
          id: p.id,
          name: p.name,
          categoryId: p.categoryId,
          description: p.description,
          composition: p.composition,
          allergens: p.allergens,
          storageNote: p.storageNote,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
          variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, stock: v.stock })),
        }}
      />
    </div>
  );
}
