import { NextResponse } from "next/server";
import { cekKedaluwarsa } from "@/lib/services/order";

// Dipanggil cron tiap 1–5 menit (lihat vercel.json). Vercel Cron memakai GET dan
// otomatis mengirim `Authorization: Bearer $CRON_SECRET`; curl manual tetap bisa
// POST dengan header `x-cron-secret` (PRD 4.7). Pemeriksaan lazy juga berjalan di halaman terkait.
async function jalankan(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const diberiSecret = secret && (req.headers.get("x-cron-secret") === secret || bearer === secret);
  if (!diberiSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const jml = await cekKedaluwarsa();
  return NextResponse.json({ ok: true, dibatalkan: jml });
}

export async function GET(req: Request) {
  return jalankan(req);
}

export async function POST(req: Request) {
  return jalankan(req);
}
