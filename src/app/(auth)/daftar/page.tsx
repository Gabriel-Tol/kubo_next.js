import { FormDaftar } from "@/components/shop/FormDaftar";

export default async function HalamanDaftar({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <FormDaftar next={next} />;
}
