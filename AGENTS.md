# AGENTS.md

KUBO — Indonesian cake-shop MVP (Next.js App Router, TypeScript, Tailwind v4, Prisma + SQLite). Single app, no monorepo. `README.md` (Indonesian) is authoritative for setup, demo accounts, and deliberate PRD deviations — read it before changing behavior.

## Language

Everything user-visible is Indonesian: route paths (`/katalog`, `/admin/masuk`), UI copy, error messages, and service/function names (`buatPesanan`, `LayananError`). Order statuses are Indonesian **string literals** (`"Menunggu Pembayaran"`), defined once in `src/lib/services/order-status.ts` — never rename or localize them ad hoc. New pages, actions, and messages follow suit.

## Commands

```bash
npm install
npm run dev                          # http://localhost:3000
npx prisma migrate dev --name <x>    # after any schema.prisma change
npm run db:seed                      # demo data (required once on fresh clone)
npm run db:reset                     # DESTRUCTIVE: wipes dev.db and reseeds
npm run test                         # vitest run → tests/**/*.test.ts only
npx tsc --noEmit                     # typecheck (no lint/format tooling exists — don't invent commands)
npx tsx scripts/flow-check.mts       # integration self-check, see below
```

- Order: `npm run test` → `npx tsc --noEmit` → `npm run build`. `next build` also typechecks.
- `prisma/dev.db` and `.env` are gitignored; a fresh clone needs `migrate dev` + `db:seed` + a `.env` copied from `.env.example` (`DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`).
- `scripts/flow-check.mts` is the real end-to-end check (checkout → payment verify → status transitions → cancel → expiry). Not run by vitest. Requires seeded DB, **deletes all orders/carts of demo user `nabila@contoh.id`**.

## Architecture

- `src/app/(shop)` customer side, `src/app/admin` admin side (separate login at `/admin/masuk`), `src/app/api` route handlers.
- Business logic lives in `src/lib/services/` (order, cart, pricing, order-status), called from Server Actions — not inside components.
- `order-status.ts` is a pure, DB-free state machine. Transitions go through `isValidTransition(from, to, fulfillment)`: `DELIVERY` orders never reach `"Siap Diambil"`; jumping steps must throw `LayananError`.
- Auth is a custom HMAC cookie session in `src/lib/auth.ts` (no NextAuth). Role check lives in the admin layout **and** every Server Action/DAL call — keep both; layout-only guarding is a security hole.
- Path alias: `@/*` → `./src/*`.

## Gotchas

- Stock is cut at payment **confirmation** (atomic conditional update), not at checkout; cancel-after-confirmation returns it; expiry before confirmation never touched it. Preserve those invariants when touching `services/order.ts`.
- Payment proofs are written to `./storage/bukti` (gitignored, local disk — object storage required for serverless deploy) and served only through the authorized `/api/berkas/bukti/[id]` route, never `public/`. Uploads check magic bytes and cap at 2 MB.
- Order expiry: cron `POST /api/cron/expire-orders` with header `x-cron-secret: $CRON_SECRET`, plus lazy checks in pages. Both paths must keep working.
- Tests cover only the pure status/total engines; DB-dependent flows are verified manually via `scripts/flow-check.mts`.
- `.opencode/skills/ui-ux-pro-max` is installed for UI/design work — use it for page and component design tasks.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
