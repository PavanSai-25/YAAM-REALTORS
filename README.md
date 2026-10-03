# Yaam Realtors & Consultants — Property Platform

A property marketplace and lead-management platform for **Yaam Realtors & Consultants** (Est. 2006, Defence Colony, Sainikpuri, Secunderabad).

- **Public site**: search and browse residential, commercial and land listings, view detailed property pages, and enquire in one tap on WhatsApp.
- **Admin dashboard**: add and publish properties with photos, manage leads (enquiry CRM), review seller submissions, manage staff, and edit website content.
- **WhatsApp** is how visitors become leads. Every tap is recorded in the CRM with a reference code that also appears in the WhatsApp message, so staff can match a chat to its lead.

> **Demo data.** The seeded listings are sample data with Unsplash photos, marked `isDemo` and shown with a visible **Demo** badge. They are not real Yaam listings. Remove them before launch (see [Going-live checklist](#going-live-checklist)).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React 19, Server Components + Server Actions) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4, shadcn/ui (Radix primitives), Lucide icons |
| Motion | Motion (`motion/react`) with `LazyMotion`, CSS reveal animations, `prefers-reduced-motion` respected |
| Forms & validation | React Hook Form + Zod (the same schemas validate on the server) |
| Database | PostgreSQL via **Supabase**, with Row Level Security on every table |
| Auth | Supabase Auth (email + password) with roles `admin`, `staff`, `seller` |
| Storage | Supabase Storage (public-read `property-images` bucket, write policies per role) |
| Charts | Recharts (admin dashboard only, loaded lazily) |
| Maps | OpenStreetMap embed by default; Google Maps Embed API if a key is set |
| Hosting | Vercel |

---

## Quick start (local demo, no accounts needed)

```bash
npm install
cp .env.example .env.local     # optional: the defaults work
npm run dev                    # http://localhost:3000
```

With no Supabase credentials the app runs on the **local backend**: data lives in `.data/db.json` (seeded with demo listings on first request), uploads go to `.data/uploads/`, and admin sessions use signed httpOnly cookies.

- Admin: <http://localhost:3000/admin>
- Default login: `admin@yaam.local` / the `LOCAL_ADMIN_PASSWORD` value (`yaam-demo-admin` if unset). This hint is only shown on the login page in local development.
- Reset the demo data at any time: `npm run db:reset-local`

The local backend is for development and demos only. It **refuses to run on Vercel**, because serverless filesystems don't persist.

### Demo walkthrough for the client

1. Sign in at `/admin`, then **Add Property**: fill in the form, drag in photos, and set the status to **Published**.
2. Open the website: the property appears under Featured and in `/properties`.
3. Search for it by locality or filters (filters are in the URL, so a search can be shared as a link).
4. Open the property, tap **Chat on WhatsApp**: WhatsApp opens with the property details and a reference such as `YR-7K3Q9P`.
5. Back in `/admin/enquiries`, the lead is there with the same reference. Change its status, assign it, and add internal notes.

---

## Environment variables

See [`.env.example`](.env.example) for the full list with comments.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | production | Canonical URLs, sitemap, Open Graph, links inside WhatsApp messages |
| `YAAM_WHATSAPP_NUMBER` | yes | WhatsApp number with country code (digits only). Admins can override it in Settings |
| `YAAM_PHONE`, `YAAM_EMAIL` | – | Contact defaults; also editable in Settings |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production | Switches the app to the Supabase backend |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Server-only. Used **only** to create user accounts from `/admin/staff` |
| `SUPABASE_STORAGE_BUCKET` | – | Defaults to `property-images` |
| `DATA_BACKEND` | – | Force `local` or `supabase` |
| `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, `AUTH_SECRET` | local only | Seeded admin and cookie-signing secret for the local backend |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | optional | Use Google Maps instead of OpenStreetMap |

No secret is ever exposed to the browser. Only `NEXT_PUBLIC_*` values reach the client, and the anon key is safe to expose because RLS enforces access.

---

## Supabase setup (production)

1. **Create a project** at <https://supabase.com>. A region close to India (e.g. Mumbai) keeps latency low.
2. **Run the schema.** Open *SQL Editor*, paste the contents of [`supabase/migrations/20261003000000_init.sql`](supabase/migrations/20261003000000_init.sql), and run it. It creates:
   - enums, `profiles`, `properties`, `property_images`, `enquiries`, `enquiry_notes`, `site_settings`
   - indexes (including a trigram index for location/text search) and a generated `area_sqft` column for area filters
   - triggers that keep sellers from setting `featured`/`verified`/review notes, stamp `published_at`, and snapshot property titles onto enquiries
   - `save_property()`, which saves a property and its ordered photos in one transaction under the caller's RLS
   - RLS policies for every table, plus the `property-images` storage bucket and its policies

   With the Supabase CLI you can run `supabase db push` instead.
3. **(Optional) Load demo data**: run [`supabase/seed.sql`](supabase/seed.sql) in the SQL editor. It's regenerated from the same seed file with `npm run db:seed-sql`. Demo photos are served from `/demo/*` in this repo.
4. **Auth settings** (*Authentication → Providers → Email*): keep email/password enabled and **turn off "Allow new users to sign up"**. Accounts are created by an admin.
5. **Create the first admin.**
   - *Authentication → Users → Add user*: enter the email and password, and tick *Auto confirm*.
   - In the SQL editor:
     ```sql
     update public.profiles set role = 'admin', full_name = 'Ankesh' where email = 'you@example.com';
     ```
   - After this, admins can add staff and sellers from `/admin/staff` (requires `SUPABASE_SERVICE_ROLE_KEY`), or repeat the step above.
6. **Copy keys** from *Project Settings → API* into your environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY`.
7. Next.js image optimisation automatically allows images from your Supabase project host (see `next.config.ts`).

### Verifying the database without a Supabase project

```bash
npm run db:verify
```

This applies the migration and seed to an in-process Postgres (PGlite) with stand-ins for Supabase's `auth`/`storage` schemas, then runs 39 permission checks as anon, seller, staff and admin. Among them:

- anonymous visitors can't read enquiries, notes or drafts, and can't write anything except new enquiries
- sellers can't self-publish, see or edit others' submissions, or edit after approval
- staff can't delete properties, change roles or edit settings
- nobody can promote themselves
- storage uploads are confined to the correct folders

---

## Roles and permissions

| | Admin | Staff | Seller |
| --- | :-: | :-: | :-: |
| Add / edit / publish any property | ✓ | ✓ | – |
| Delete properties | ✓ | – | own drafts only |
| Submit own property (goes to *Pending review*) | ✓ | ✓ | ✓ |
| Review seller submissions (approve / reject / request changes) | ✓ | ✓ | – |
| Enquiries CRM (status, assignment, internal notes) | ✓ | ✓ | – |
| Staff & users, website settings | ✓ | – | – |

Access is enforced in three layers, and none of them relies on hiding UI:

1. `src/proxy.ts`: an early redirect for signed-out visitors (optimistic check only).
2. `src/lib/auth/session.ts`: `requirePageUser` / `requireUser` in **every** admin page, layout, server action and route handler.
3. PostgreSQL RLS: with Supabase, admin queries run *as the signed-in user*, so the database rejects anything the role doesn't allow, even if an app check were missed.

---

## How WhatsApp integration works

- The number comes from site settings (env default → admin override). All links are built in [`src/lib/whatsapp.ts`](src/lib/whatsapp.ts); no component hard-codes it.
- On a property page the message contains the title, location, price and link:
  ```
  Hi Yaam Realtors,

  I'm interested in:

  Property: Contemporary 4 BHK Villa with Private Pool
  Location: Sainikpuri, Hyderabad
  Price: ₹3.85 Cr
  Link: https://…/properties/4-bhk-villa-for-sale-sainikpuri

  Could you please share more details?

  (Ref: YR-7K3Q9P)
  ```
- **Phones** open the WhatsApp app (`wa.me`). **Desktops** open WhatsApp Web.
- Each tap sends a beacon to `/api/enquiries/whatsapp`, creating a *New* enquiry with the reference. Staff find the chat by that code and add the customer's number as a note.
- Visitors can instead leave name and phone in the **Request a callback** form; that lead can then continue on WhatsApp with the same reference.

---

## Adding properties (for Yaam staff)

1. `/admin` → **Add Property**.
2. Fill in the basics, price (or a label like "Price on request"), location and details. Set **Map precision** to *Approximate* to keep the exact address and pin private. The public page then shows only a ~1 km area.
3. Drag in photos. They're resized to 2400px WebP in the browser (which also strips phone GPS metadata), uploaded with progress, and can be reordered. The first photo is the cover.
4. Set the status:
   - **Published** and **Under Negotiation** listings appear in search.
   - **Sold** and **Rented** listings drop out of normal search but keep their page with a status badge.
   - **Draft** and **Archived** listings are hidden.
5. Toggle **Featured** to show the listing on the homepage, and **Verified** once Yaam has checked it.

Property URLs are generated from the details (`/properties/3-bhk-villa-for-sale-sainikpuri`) and never change after creation.

---

## Project structure

```
src/
  app/
    (site)/            public pages: home, properties, [slug], services, about, contact, list-property
    admin/login        sign-in
    admin/(dashboard)  dashboard, properties, enquiries, sellers, staff, settings
    actions/           server actions (all authorize + validate server-side)
    api/               WhatsApp tracking beacon, local upload endpoint
    media/             serves local uploads (local backend only)
    sitemap.ts, robots.ts, opengraph-image.tsx, icon.svg
  components/          layout, property, search, admin, shared, motion, ui (shadcn), seo
  config/              property-options.ts (every enum + label), site.ts (business defaults)
  lib/
    data/              repository interface + local and supabase drivers + demo seed
    auth/              session + role checks, local signed cookies
    storage/           signed upload targets, path validation
    validations/       Zod schemas shared by client and server
    seo/               schema.org builders (RealEstateAgent, RealEstateListing + Offer, BreadcrumbList)
    whatsapp.ts, format.ts, slug.ts, settings.ts, image-processing.ts
  proxy.ts             optimistic /admin guard + Supabase session refresh
supabase/
  migrations/          schema, RLS, storage policies
  seed.sql             generated demo data
scripts/               verify-migration.ts, generate-seed-sql.ts
public/demo/           demo photography (Unsplash)
```

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:verify` | Apply migration + seed to embedded Postgres and run the RLS checks |
| `npm run db:seed-sql` | Regenerate `supabase/seed.sql` from `src/lib/data/seed.ts` |
| `npm run db:reset-local` | Wipe the local demo backend (re-seeds on next request) |

---

## Deployment (Vercel)

1. Push the repository to GitHub and import it in Vercel.
2. Set the environment variables: `NEXT_PUBLIC_SITE_URL` (your domain), `YAAM_WHATSAPP_NUMBER`, `YAAM_PHONE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy. Public pages are statically generated and revalidated: the homepage every 5 minutes, listing pages on first view and whenever an admin saves.
4. Add the domain, then submit `https://your-domain/sitemap.xml` in Google Search Console.

### Going-live checklist

- [ ] Confirm the WhatsApp number. The default is the phone number on the visiting card.
- [ ] Remove demo listings: `delete from public.properties where is_demo;`, then replace `/demo` photos used on the homepage hero and category tiles with Yaam's own photography (`src/app/(site)/page.tsx`).
- [ ] Add an email address, business hours and social links in **Settings** (they're hidden while empty).
- [ ] Turn off public sign-ups in Supabase Auth.
- [ ] Optionally add the office's map coordinates and a Google Maps Embed key.

---

## Notes and known limitations

- **Rate limiting** on public endpoints (enquiries, login, WhatsApp beacon) is in-memory, so it's per-instance on serverless. Swap in a shared store such as Upstash Redis if traffic grows.
- **Orphaned uploads**: a photo uploaded to a form that is never saved stays in storage. A periodic cleanup of objects not referenced by `property_images` can be added later.
- **Not built yet, but the schema allows for it**: saved properties, user accounts, property alerts, email notifications, WhatsApp Business API automation, analytics, mortgage leads and project listings. Roles, `custom_fields`, and the enquiry `source`/`status` enums are where these extend.
- The Supabase driver has been verified at the SQL/RLS level with PGlite and by type-checking. End-to-end browser testing was done on the local backend. Run the walkthrough above once against a real Supabase project before launch.
