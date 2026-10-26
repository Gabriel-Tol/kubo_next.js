import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export { hashPassword, verifyPassword } from "@/lib/password";

const SESI = "kubo_sesi";
const TAMU = "kubo_tamu";
const TAHUN = 60 * 60 * 24 * 30; // 30 hari

function secret(): string {
  return process.env.AUTH_SECRET || "dev-secret-jangan-produksi";
}

function tanda(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export type Sesi = { userId: string; role: "CUSTOMER" | "ADMIN" };

async function tulisCookie(nama: string, nilai: string, maxAge: number) {
  const c = await cookies();
  c.set(nama, nilai, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function buatSesi(userId: string, role: string) {
  const exp = Math.floor(Date.now() / 1000) + TAHUN;
  const payload = `${userId}.${role}.${exp}`;
  await tulisCookie(SESI, `${payload}.${tanda(payload)}`, TAHUN);
}

export async function hapusSesi() {
  const c = await cookies();
  c.delete(SESI);
}

export async function getSession(): Promise<Sesi | null> {
  const c = await cookies();
  const v = c.get(SESI)?.value;
  if (!v) return null;
  const parts = v.split(".");
  if (parts.length !== 4) return null;
  const [userId, role, exp, sig] = parts;
  const payload = `${userId}.${role}.${exp}`;
  const expect = tanda(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  if (role !== "CUSTOMER" && role !== "ADMIN") return null;
  return { userId, role };
}

export async function requireCustomer(): Promise<Sesi> {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") throw new Error("Belum masuk");
  return s;
}

export async function requireAdmin(): Promise<Sesi> {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") throw new Error("Bukan admin");
  return s;
}

export async function getOrCreateGuestToken(): Promise<string | null> {
  const c = await cookies();
  const s = await getSession();
  if (s) return null;
  const existing = c.get(TAMU)?.value;
  if (existing) return existing;
  const token = randomBytes(16).toString("hex");
  await tulisCookie(TAMU, token, TAHUN);
  return token;
}

export async function peekGuestToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(TAMU)?.value ?? null;
}
