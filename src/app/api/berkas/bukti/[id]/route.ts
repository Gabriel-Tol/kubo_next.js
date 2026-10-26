import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Bukti disimpan privat; hanya pemilik pesanan atau admin yang boleh membaca (PRD 4.9).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorized", { status: 401 });

  const proof = await db.paymentProof.findUnique({ where: { id }, include: { order: true } });
  if (!proof) return new NextResponse("Not found", { status: 404 });
  if (s.role !== "ADMIN" && proof.order.userId !== s.userId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // filePath selalu "storage/bukti/<nama-acak>"; baca hanya dari subfolder itu.
  const buf = await readFile(path.join(process.cwd(), "storage", "bukti", path.basename(proof.filePath)));
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": proof.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
