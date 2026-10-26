import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function ProdukBaru() {
  const kategori = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Tambah produk</h1>
      <ProductForm kategori={kategori} />
    </div>
  );
}
