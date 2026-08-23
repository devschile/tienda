# AGENTS.md

Guidelines and conventions for working on the Tienda devsChile codebase. Read this before editing code so changes fit the existing architecture and don't reintroduce known bugs.

## Project overview

E-commerce storefront for the devsChile community. React 18 + TypeScript + Vite frontend, Netlify Functions (Node.js, CommonJS) as backend, NeonDB (Postgres serverless) as database, MercadoPago for payments, UploadThing for product images.

Key directories:

- `app/`, `components/`, `hooks/` — storefront UI and client state
- `admin/` — admin panel (`/admin`)
- `netlify/functions/` — backend functions (`admin-api.js` is the CRUD router)
- `migrations/` — sequential SQL migrations for NeonDB (apply in filename order)
- `types/` — shared types (`products.ts` has `ProductRecord`)
- `docs/` — human-facing team documentation (Spanish)

## Commands

```bash
npm run dev              # Vite dev server (:3000), mock data, no functions
npm run dev:functions    # Netlify Functions locally (:9999)
npm run type-check       # tsc --noEmit — MUST pass before committing
npm run lint             # eslint . — MUST pass before committing
npm run lint:fix         # auto-fix lint issues
npm run build            # vite build
```

Vite proxies `/admin-api/*` and `/.netlify/functions/*` to `:9999` in dev.

## Coding conventions

### Cart state (`hooks/useCart.ts`, `components/CartDrawer.tsx`)

- Every `CartItem` **must** carry a unique `lineId` (e.g. `crypto.randomUUID()`).
- `removeItem` / `updateQuantity` operate on `lineId`, and React keys in `CartDrawer` use `lineId`.
- **Never** remove/update cart lines by `product.id` alone: two sticker packs with different bundle selections are separate lines that legitimately share the same `product.id`. Filtering by `product.id` deletes/updates all of them.
- When adding to localStorage, migrate previously-stored items that lack `lineId`.

### Admin product writes (`admin/components/products/ProductEditPanel.tsx`)

- Product `PUT`/`POST` bodies must contain **only real database columns**.
- Strip computed/read-only fields before sending: `cover_url`, `image_count`, `created_time`, `id`.
- These fields are derived by the backend's GET queries (from `product_images`) and are ignored on write — but `image_count`/`cover_url`/`created_time` have caused 500s, so keep them out of the payload.

### Netlify Functions / SQL (`netlify/functions/admin-api.js`)

- Compute conditional booleans in JS **before** the query. Example: `on_sale` and `presale` are mutually exclusive (presale wins) — compute the final value in JS (as the `POST` handler does), then use plain `COALESCE(${value}, column)` in SQL.
- Do **not** build fragile constructs like `CASE WHEN ${x} IS NOT NULL THEN ...` — they have caused runtime 500s (type-inference and constraint interplay).
- Return `error.message` in 500 JSON responses so failures are diagnosable from the admin UI; also keep the `console.error("admin-api [METHOD resource/id]:", ...)` line — it is the primary signal in Netlify function logs.
- Reuse existing sanitizers (`sanitizeProductType`, `sanitizeSizes`, `sanitizeNullableInt`).
- Body fields not declared in the handler are silently ignored — don't rely on rejected fields to "fix" backend behavior.

### Neon `sql` tag

- The `sql` tagged template sends parameters as text with type OID 0; Postgres infers the type **from context**.
- Keep every parameter in a type-inferable position (e.g. `COALESCE(${x}, column)` or a direct column comparison). Avoid using a param only inside `IS NOT NULL` / `IS NULL`, where its type is left unresolved.

### Migrations (`migrations/`)

- Apply in filename order (01, 02, ..., 17) — e.g. via the Neon SQL editor.
- When adding/altering a column, update the README migration table and schema summary (`README.md` → "Base de datos").

## Definition of done

- `npm run type-check` passes.
- `npm run lint` passes (or `--fix` applied and errors resolved).
- Migration changes are documented in `README.md` and `docs/` are in sync.