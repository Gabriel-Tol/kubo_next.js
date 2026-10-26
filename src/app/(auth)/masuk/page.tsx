import { FormMasuk } from "@/components/shop/FormMasuk";

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <FormMasuk next={next} />;
}
