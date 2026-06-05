---
name: Location Auto Maroc
description: Key conventions, gotchas, and architecture decisions for the Location Auto Maroc car rental app.
---

## Auth pattern
JWT stored in localStorage (web) or expo-secure-store (mobile). `setAuthTokenGetter(() => token)` must be called once in `AuthProvider` (not per-request). The `useGetMe` hook is enabled with `enabled: !!token`.

**Why:** `setAuthTokenGetter` configures the Orval custom-fetch interceptor globally; forgetting it means all authenticated API calls fail silently.

## Customer dashboard endpoint
Customer dashboard MUST use `useListRentalRequests` (backend auto-filters by JWT customer). Never use `useGetRecentRequests` for customers — it requires SUPER_ADMIN or AGENT role and returns 403.

**Why:** `/api/dashboard/recent-requests` has `requireRole("SUPER_ADMIN", "AGENT")` guard.

## Utility exports
`formatPrice`, `formatDateTime`, `formatDate`, `STATUS_TRANSLATIONS`, `CAR_STATUS_TRANSLATIONS`, `STATUS_COLORS`, `CATEGORY_TRANSLATIONS`, `FUEL_TRANSLATIONS`, `EXPENSE_CATEGORY_TRANSLATIONS` are all exported from `artifacts/car-rental/src/lib/utils.ts`. Any new component using these must import from there.

**Why:** Design subagent creates components expecting these exports; the file starts with only `cn`. Always add them before running frontend.

## Blog routes
Blog PATCH/DELETE use `/api/blog/:id/edit` suffix, not `/api/blog/:id`. GET by slug uses `/api/blog/:slug`.

**Why:** Express route ordering — `/api/blog/:id` conflicts with `/api/blog/:slug` so `/edit` suffix disambiguates admin mutations.

## 12h payment deadline
`confirmCall` endpoint sets `paymentDeadline = now + settings.paymentDeadlineHours * 3600s`. A `check-expired` endpoint abandons overdue `WAITING_AGENCY_PAYMENT` requests. The frontend `CountdownTimer` component polls every second and calls `onExpire` when deadline passes.

## Role routing
- SUPER_ADMIN → `/admin/*`
- AGENT → `/agent/*` (reuses admin components, different base path)
- CUSTOMER → `/dashboard/*`

**How to apply:** ProtectedRoute checks `user.role` against `allowedRoles[]`. Login redirect is role-based.

## Mobile app (Expo) — RentalRequest field names
The `RentalRequest` schema uses `returnDate` (not `endDate`), `pickupLocation` (not `pickupCity`), and `car.brand`/`car.model` (not top-level `carBrand`/`carModel`). `RentalRequestInput` requires `fullName`, `phone`, `email`, and `estimatedTotalPrice` as non-optional fields — auto-populate from `useGetMe` in the booking form.

**Why:** Schema was generated from OpenAPI spec; the field names differ from what the web UI uses internally.

## Mobile app — expo-secure-store version
Pin to `~15.0.8` (Expo SDK 54 compatible). The latest v56.x causes an SDK mismatch warning and may break on device.

## Mobile app — setBaseUrl
In `_layout.tsx`: `if (process.env["EXPO_PUBLIC_DOMAIN"]) { setBaseUrl(\`https://\${process.env["EXPO_PUBLIC_DOMAIN"]}\`); }`. The workflow script already passes `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN`.
