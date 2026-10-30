import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Produksi (Vercel/Turso): DATABASE_URL libsql://… + TURSO_AUTH_TOKEN.
// Lokal tanpa token: PrismaClient biasa ke SQLite file (prisma/dev.db).
function buatClient() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url?.startsWith("libsql://") && authToken) {
    return new PrismaClient({ adapter: new PrismaLibSql({ url, authToken }) });
  }
  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? buatClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
