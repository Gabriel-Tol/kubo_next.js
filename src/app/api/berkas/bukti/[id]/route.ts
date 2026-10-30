import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Bukti disimpan privat sebagai blob di DB; hanya pemilik pesanan atau admin
// yang boleh membaca (PRD 4.9).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorized", { status: 401 });

  const proof = await db.paymentProof.findUnique({ where: { id }, include: { order: true } });
  if (!proof) return new NextResponse("Not found", { status: 404 });
  if (s.role !== "ADMIN" && proof.order.userId !== s.userId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(new Uint8Array(proof.data), {
    headers: {
      "Content-Type": proof.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
