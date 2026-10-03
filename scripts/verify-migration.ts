/**
 * Applies supabase/migrations/*.sql to an in-process Postgres (PGlite) with
 * minimal stand-ins for Supabase's auth + storage schemas, then exercises the
 * Row Level Security policies as anon, seller, staff and admin.
 *
 *   npm run db:verify
 *
 * This proves the SQL is valid and the permission model behaves as designed
 * without needing Docker or a Supabase project.
 */
import { PGlite } from "@electric-sql/pglite"
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

const SUPABASE_STUBS = `
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema public, auth, storage to anon, authenticated;
`

const GRANTS = `
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema storage to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
revoke all on public.enquiry_notes from anon;
revoke execute on function public.save_property(uuid, jsonb, jsonb) from anon;
`

const ids = {
  admin: "00000000-0000-0000-0000-00000000000a",
  staff: "00000000-0000-0000-0000-00000000000b",
  seller: "00000000-0000-0000-0000-00000000000c",
  seller2: "00000000-0000-0000-0000-00000000000d",
}

let failures = 0
function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "✓" : "✗"} ${label}${!ok && detail ? ` — ${String(detail)}` : ""}`)
  if (!ok) failures++
}

async function main() {
  const db = new PGlite({ extensions: { pg_trgm } })
  await db.exec(SUPABASE_STUBS)

  const dir = path.join(process.cwd(), "supabase/migrations")
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"))
    console.log(`applied ${file}`)
  }
  await db.exec(GRANTS)

  // Users → profiles via trigger, then promote roles as superuser.
  for (const [name, id] of Object.entries(ids)) {
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
      id,
      `${name}@test.local`,
      JSON.stringify({ full_name: name }),
    ])
  }
  await db.exec(`update public.profiles set role = 'admin' where email = 'admin@test.local';
                 update public.profiles set role = 'staff' where email = 'staff@test.local';`)
  const roles = await db.query<{ role: string }>(`select role from public.profiles order by email`)
  check("profiles created by auth trigger with roles", roles.rows.map((r) => r.role).join() === "admin,seller,seller,staff")

  async function as<T>(who: keyof typeof ids | "anon", fn: () => Promise<T>): Promise<T> {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
    if (who === "anon") {
      await db.exec(`set role anon`)
    } else {
      await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [ids[who]])
      await db.exec(`set role authenticated`)
    }
    try {
      return await fn()
    } finally {
      await db.exec(`reset role`)
    }
  }

  const base = {
    title: "Test 3 BHK Villa",
    description: "A test property description that is long enough.",
    purpose: "sale",
    category: "residential",
    property_type: "villa",
    price: 15000000,
    negotiable: false,
    address: "Plot 12, Street 4",
    locality: "Sainikpuri",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500094",
    location_precision: "approximate",
    area: 300,
    area_unit: "sqyd",
    amenities: ["lift", "gym"],
    highlights: ["Corner plot"],
    nearby_landmarks: [{ name: "Metro", distance: "1 km" }],
    custom_fields: { Khata: "Yes" },
    featured: true,
    verified: true,
  }
  const images = [
    { url: "https://x.supabase.co/a.webp", storage_path: "properties/a.webp", alt: "Front", width: 1600, height: 1067 },
    { url: "https://x.supabase.co/b.webp", storage_path: "properties/b.webp", alt: "Hall", width: 1600, height: 1067 },
  ]

  // Staff creates a published property.
  const published = await as("staff", () =>
    db.query<{ id: string }>(`select public.save_property(null, $1, $2) as id`, [
      JSON.stringify({ ...base, slug: "3-bhk-villa-for-sale-sainikpuri", status: "published" }),
      JSON.stringify(images),
    ]),
  )
  const pubId = published.rows[0].id
  const row = await db.query<{ area_sqft: string; cover_image_url: string; published_at: string | null; created_by: string; amenities: string[] }>(
    `select area_sqft, cover_image_url, published_at, created_by, amenities from public.properties where id = $1`,
    [pubId],
  )
  check("save_property inserts + computes area_sqft (300 sq.yd → 2700)", Number(row.rows[0].area_sqft) === 2700)
  check("cover_image_url = first image", row.rows[0].cover_image_url === images[0].url)
  check("published_at set on publish", row.rows[0].published_at !== null)
  check("created_by = staff", row.rows[0].created_by === ids.staff)
  check("jsonb arrays populate text[]", row.rows[0].amenities.join() === "lift,gym")

  // Staff draft.
  const draft = await as("staff", () =>
    db.query<{ id: string }>(`select public.save_property(null, $1, '[]') as id`, [
      JSON.stringify({ ...base, slug: "draft-villa", status: "draft" }),
    ]),
  )
  const draftId = draft.rows[0].id

  // Anon visibility.
  const anonProps = await as("anon", () => db.query<{ slug: string }>(`select slug from public.properties`))
  check("anon sees published only", anonProps.rows.length === 1 && anonProps.rows[0].slug === "3-bhk-villa-for-sale-sainikpuri")
  const anonImgs = await as("anon", () => db.query(`select id from public.property_images`))
  check("anon sees images of published property only", anonImgs.rows.length === 2)

  const anonWrite = await as("anon", () =>
    db.query(`update public.properties set price = 1 where id = $1`, [pubId]).then(
      (r) => r.affectedRows ?? 0,
      () => -1,
    ),
  )
  check("anon cannot update properties", anonWrite <= 0)

  const anonRpc = await as("anon", () =>
    db.query(`select public.save_property(null, '{}', '[]')`).then(
      () => true,
      () => false,
    ),
  )
  check("anon cannot call save_property", anonRpc === false)

  // Enquiries.
  await as("anon", () =>
    db.query(
      `insert into public.enquiries (reference, property_id, name, phone, source, status) values ('YR-ABC123', $1, 'Ravi', '9876543210', 'callback_form', 'closed')`,
      [pubId],
    ),
  )
  const enq = await db.query<{ status: string; property_title: string }>(`select status, property_title from public.enquiries`)
  check("anon can create enquiry; status forced to new", enq.rows[0]?.status === "new")
  check("enquiry snapshots property title", enq.rows[0]?.property_title === base.title)

  await as("anon", () =>
    db.query(
      `insert into public.enquiries (reference, property_id, source) values ('YR-DRAFT1', $1, 'whatsapp')`,
      [draftId],
    ),
  )
  const draftEnq = await db.query<{ property_id: string | null }>(`select property_id from public.enquiries where reference = 'YR-DRAFT1'`)
  check("enquiry cannot be linked to a non-public property", draftEnq.rows[0]?.property_id === null)

  const anonReadEnq = await as("anon", () => db.query(`select * from public.enquiries`))
  check("anon cannot read enquiries", anonReadEnq.rows.length === 0)
  const sellerReadEnq = await as("seller", () => db.query(`select * from public.enquiries`))
  check("seller cannot read enquiries", sellerReadEnq.rows.length === 0)
  const staffReadEnq = await as("staff", () => db.query(`select * from public.enquiries`))
  check("staff can read enquiries", staffReadEnq.rows.length === 2)

  const enqId = (await db.query<{ id: string }>(`select id from public.enquiries limit 1`)).rows[0].id
  await as("staff", () =>
    db.query(`insert into public.enquiry_notes (enquiry_id, body, author_id, author_name) values ($1, 'Called, interested', $2, 'staff')`, [
      enqId,
      ids.staff,
    ]),
  )
  const anonNotes = await as("anon", () =>
    db.query(`select * from public.enquiry_notes`).then(
      (r) => r.rows.length,
      () => -1,
    ),
  )
  check("anon cannot read internal notes", anonNotes <= 0)
  const sellerNotes = await as("seller", () => db.query(`select * from public.enquiry_notes`))
  check("seller cannot read internal notes", sellerNotes.rows.length === 0)

  // Seller flow.
  const sellerSave = await as("seller", () =>
    db.query<{ id: string }>(`select public.save_property(null, $1, '[]') as id`, [
      JSON.stringify({ ...base, slug: "seller-villa", status: "pending_review" }),
    ]),
  )
  const sellerId = sellerSave.rows[0].id
  const sellerRow = await db.query<{ featured: boolean; verified: boolean; created_by: string; published_at: string | null }>(
    `select featured, verified, created_by, published_at from public.properties where id = $1`,
    [sellerId],
  )
  check("seller submission: featured/verified stripped", !sellerRow.rows[0].featured && !sellerRow.rows[0].verified)
  check("seller submission: owner recorded", sellerRow.rows[0].created_by === ids.seller)

  const sellerPublish = await as("seller", () =>
    db.query(`select public.save_property(null, $1, '[]')`, [JSON.stringify({ ...base, slug: "seller-pub", status: "published" })]).then(
      () => true,
      () => false,
    ),
  )
  check("seller cannot self-publish", sellerPublish === false)

  const sellerSees = await as("seller", () => db.query<{ slug: string }>(`select slug from public.properties order by slug`))
  check(
    "seller sees public listings + own submissions only",
    sellerSees.rows.map((r) => r.slug).join() === "3-bhk-villa-for-sale-sainikpuri,seller-villa",
  )
  const otherSeller = await as("seller2", () =>
    db.query(`update public.properties set title = 'Hijacked title' where id = $1`, [sellerId]).then((r) => r.affectedRows ?? 0),
  )
  check("seller cannot edit another seller's submission", otherSeller === 0)

  const editPublished = await as("seller", () =>
    db.query(`update public.properties set title = 'Hijacked title' where id = $1`, [pubId]).then((r) => r.affectedRows ?? 0),
  )
  check("seller cannot edit staff listings", editPublished === 0)

  // Staff approves → published.
  await as("staff", () => db.query(`update public.properties set status = 'published', review_notes = 'Looks good' where id = $1`, [sellerId]))
  const approved = await as("anon", () => db.query(`select 1 from public.properties where id = $1`, [sellerId]))
  check("approved seller listing becomes public", approved.rows.length === 1)

  const sellerEditApproved = await as("seller", () =>
    db.query(`update public.properties set price = 1 where id = $1`, [sellerId]).then((r) => r.affectedRows ?? 0),
  )
  check("seller cannot edit after approval", sellerEditApproved === 0)

  // Deletes.
  const staffDelete = await as("staff", () => db.query(`delete from public.properties where id = $1`, [draftId]).then((r) => r.affectedRows ?? 0))
  check("staff cannot delete properties (admin only)", staffDelete === 0)
  const adminDelete = await as("admin", () => db.query(`delete from public.properties where id = $1`, [draftId]).then((r) => r.affectedRows ?? 0))
  check("admin can delete properties", adminDelete === 1)

  // Roles.
  const selfPromote = await as("seller", () =>
    db.query(`update public.profiles set role = 'admin' where id = $1`, [ids.seller]).then(
      () => true,
      () => false,
    ),
  )
  const sellerRole = await db.query<{ role: string }>(`select role from public.profiles where id = $1`, [ids.seller])
  check("seller cannot promote themselves", !selfPromote || sellerRole.rows[0].role === "seller")
  const staffPromote = await as("staff", () =>
    db.query(`update public.profiles set role = 'admin' where id = $1`, [ids.staff]).then(
      () => true,
      () => false,
    ),
  )
  check("staff cannot promote themselves", staffPromote === false)
  await as("admin", () => db.query(`update public.profiles set role = 'staff' where id = $1`, [ids.seller2]))
  const promoted = await db.query<{ role: string }>(`select role from public.profiles where id = $1`, [ids.seller2])
  check("admin can change roles", promoted.rows[0].role === "staff")

  // Settings.
  const staffSettings = await as("staff", () =>
    db.query(`update public.site_settings set data = '{"x":1}' where id = 1`).then((r) => r.affectedRows ?? 0),
  )
  check("staff cannot edit site settings", staffSettings === 0)
  const anonSettings = await as("anon", () => db.query(`select data from public.site_settings`))
  check("anon can read site settings", anonSettings.rows.length === 1)

  // Storage.
  const sellerUploadOwn = await as("seller", () =>
    db.query(`insert into storage.objects (bucket_id, name) values ('property-images', $1)`, [`sellers/${ids.seller}/x.webp`]).then(
      () => true,
      () => false,
    ),
  )
  check("seller can upload into own folder", sellerUploadOwn)
  const sellerUploadOther = await as("seller", () =>
    db.query(`insert into storage.objects (bucket_id, name) values ('property-images', 'properties/x.webp')`).then(
      () => true,
      () => false,
    ),
  )
  check("seller cannot upload outside own folder", sellerUploadOther === false)
  const anonUpload = await as("anon", () =>
    db.query(`insert into storage.objects (bucket_id, name) values ('property-images', 'properties/y.webp')`).then(
      () => true,
      () => false,
    ),
  )
  check("anon cannot upload", anonUpload === false)

  // Trigram search index is usable.
  const search = await as("anon", () =>
    db.query(`select slug from public.properties where search_text ilike '%sainik%'`),
  )
  check("search_text ilike works", search.rows.length >= 1)

  // Demo seed applies cleanly on top (run as the SQL editor would: privileged role).
  const seedFile = path.join(process.cwd(), "supabase/seed.sql")
  try {
    await db.exec(readFileSync(seedFile, "utf8"))
    const seeded = await db.query<{ n: number; imgs: number }>(
      `select count(*)::int as n, (select count(*)::int from public.property_images i join public.properties p on p.id = i.property_id where p.is_demo) as imgs from public.properties where is_demo`,
    )
    check(`seed.sql applies (${seeded.rows[0].n} demo properties, ${seeded.rows[0].imgs} images)`, seeded.rows[0].n >= 10 && seeded.rows[0].imgs > 0)
    const demoDraft = await as("anon", () => db.query(`select 1 from public.properties where is_demo and status = 'draft'`))
    check("demo draft hidden from anon", demoDraft.rows.length === 0)
  } catch (err) {
    check("seed.sql applies", false, err instanceof Error ? err.message : err)
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
