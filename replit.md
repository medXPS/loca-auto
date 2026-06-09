# Location Auto Maroc

Application web complète de location de voitures au Maroc — site public, espace client, tableau de bord admin et tableau de bord agent. Entièrement en français.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/car-rental run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Recharts
- Routing: wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Auth: JWT (stored in localStorage), bcrypt
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — Generated Zod schemas
- `lib/db/src/schema/` — Drizzle ORM schema (13 files: users, customers, agents, cars, car-images, rental-requests, car-availability, expenses, blog, notifications, audit-logs, documents, settings)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/car-rental/src/` — React frontend
- `artifacts/car-rental/src/lib/utils.ts` — formatPrice, formatDateTime, STATUS_TRANSLATIONS, etc.

## Architecture decisions

- **COD-only payments**: No online payment. Admin confirms call → customer pays at agency within 12h deadline.
- **JWT auth**: Token stored in localStorage, `setAuthTokenGetter()` configured once in `AuthProvider`.
- **Role-based routing**: ADMIN (super admin) → `/admin/*`, AGENT → `/agent/*`, CUSTOMER → `/dashboard/*`.
- **Shared admin/agent UI**: Agents reuse the same admin pages, role restrictions enforced at backend.
- **Contract-first API**: OpenAPI spec → codegen → typed React Query hooks + Zod schemas. Never hand-write API calls.

## Product

- **Site public** : Accueil avec hero + recherche, catalogue de voitures avec filtres, fiche détaillée avec formulaire de réservation, blog, à propos, FAQ, contact (WhatsApp), mentions légales, confidentialité.
- **Espace client** : Tableau de bord, liste des demandes, détail demande avec countdown 12h, profil.
- **Admin BI dashboard** : KPIs (CA, charges, bénéfice), graphiques Recharts, gestion voitures, demandes, clients, agents, charges, blog, paramètres, audit logs.
- **Agent dashboard** : Sous-ensemble de l'admin (voitures, demandes, clients, charges).

## Seed credentials

- Super admin: `admin@demo.com` / `demo-admin@$` (MFA disabled)
- Agent: `khalid@locationauto.ma` / `agent123`
- Client: `mohammed@example.ma` / `client123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `pnpm --filter @workspace/api-spec run codegen` must be rerun after any OpenAPI spec changes.
- Blog PATCH/DELETE routes use `/api/blog/:id/edit` suffix (not the standard `/api/blog/:id`).
- Customer dashboard must use `useListRentalRequests` (not `useGetRecentRequests` which is admin-only).
- `formatPrice`, `formatDateTime`, `STATUS_TRANSLATIONS`, `CAR_STATUS_TRANSLATIONS` etc. are all exported from `@/lib/utils`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
