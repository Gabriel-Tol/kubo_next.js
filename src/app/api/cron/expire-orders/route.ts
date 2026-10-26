import { NextResponse } from "next/server";
import { cekKedaluwarsa } from "@/lib/services/order";

// Dipanggil cron tiap 1–5 menit: POST /api/cron/expire-orders dengan header
// x-cron-secret: $CRON_SECRET (PRD 4.7). Pemeriksaan lazy juga berjalan di halaman terkait.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const jml = await cekKedaluwarsa();
  return NextResponse.json({ ok: true, dibatalkan: jml });
}
