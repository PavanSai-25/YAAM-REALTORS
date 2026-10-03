-- =============================================================================
-- Yaam Realtors — initial schema
-- Postgres 15+ / Supabase. Every table has Row Level Security enabled.
--
-- Roles (public.profiles.role):
--   admin  – full access
--   staff  – manage properties + enquiries (cannot delete properties, manage users or settings)
--   seller – create/manage own submissions; submissions need admin approval
-- =============================================================================

create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- Enums (mirror src/config/property-options.ts)
-- ----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'staff', 'seller');
create type public.property_purpose as enum ('sale', 'rent');
create type public.property_category as enum ('residential', 'commercial', 'land');
create type public.property_type as enum (
  'apartment', 'villa', 'independent_house', 'office', 'shop', 'warehouse',
  'plot', 'agricultural_land', 'other'
);
create type public.furnishing as enum ('furnished', 'semi_furnished', 'unfurnished');
create type public.facing as enum (
  'north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west'
);
create type public.area_unit as enum ('sqft', 'sqyd', 'sqm', 'acre');
create type public.possession_status as enum ('ready_to_move', 'under_construction');
create type public.location_precision as enum ('exact', 'approximate');
create type public.property_status as enum (
  'draft', 'pending_review', 'changes_requested', 'rejected',
  'published', 'under_negotiation', 'sold', 'rented', 'archived'
);
create type public.enquiry_status as enum ('new', 'contacted', 'follow_up', 'closed', 'lost');
create type public.enquiry_source as enum (
  'whatsapp', 'callback_form', 'contact_form', 'list_property', 'phone_call'
);

-- ----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'seller',
  created_at timestamptz not null default now()
);

-- Role helpers. SECURITY DEFINER so policies on profiles don't recurse.
create function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

create function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role in ('admin', 'staff') from public.profiles where id = auth.uid()), false) $$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;

-- True for trusted database roles (postgres, service_role, SQL editor) — i.e.
-- anything that is not an API request from the anon/authenticated roles.
-- Only meaningful inside SECURITY INVOKER code.
create function public.is_privileged_role()
returns boolean
language sql stable
as $$ select current_user not in ('anon', 'authenticated') $$;

-- New auth users get a seller profile. Promote with:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change roles (including their own).
create function public.guard_profile_update()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not (public.is_privileged_role() or public.is_admin()) then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  new.id := old.id;
  new.email := old.email;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ----------------------------------------------------------------------------
-- Properties
-- ----------------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '' check (char_length(description) <= 8000),
  purpose public.property_purpose not null,
  category public.property_category not null,
  property_type public.property_type not null,

  price bigint not null default 0 check (price >= 0),
  price_label text check (char_length(price_label) <= 60),
  negotiable boolean not null default false,

  address text not null default '',
  locality text not null check (char_length(locality) between 2 and 80),
  city text not null,
  state text not null default 'Telangana',
  pincode text not null default '' check (pincode = '' or pincode ~ '^\d{6}$'),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location_precision public.location_precision not null default 'approximate',

  area numeric(14, 2) not null check (area > 0),
  area_unit public.area_unit not null default 'sqft',
  area_sqft numeric(16, 0) generated always as (
    round(area * case area_unit
      when 'sqft' then 1
      when 'sqyd' then 9
      when 'sqm' then 10.7639
      when 'acre' then 43560
    end)
  ) stored,
  bedrooms smallint check (bedrooms between 0 and 20),
  bathrooms smallint check (bathrooms between 0 and 20),
  parking integer check (parking between 0 and 500),
  furnishing public.furnishing,
  floor smallint check (floor between -5 and 200),
  total_floors smallint check (total_floors between 0 and 200),
  facing public.facing,
  construction_year smallint check (construction_year between 1900 and 2100),
  possession_status public.possession_status,

  amenities text[] not null default '{}',
  highlights text[] not null default '{}',
  nearby_landmarks jsonb not null default '[]' check (jsonb_typeof(nearby_landmarks) = 'array'),
  custom_fields jsonb not null default '{}' check (jsonb_typeof(custom_fields) = 'object'),

  cover_image_url text,
  video_url text check (video_url is null or video_url ~ '^https://'),
  virtual_tour_url text check (virtual_tour_url is null or virtual_tour_url ~ '^https://'),

  status public.property_status not null default 'draft',
  featured boolean not null default false,
  verified boolean not null default false,
  is_demo boolean not null default false,
  review_notes text,

  search_text text generated always as (
    lower(title || ' ' || locality || ' ' || city || ' ' || address || ' ' || pincode)
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null
);

create index properties_public_idx on public.properties (status, published_at desc);
create index properties_facets_idx on public.properties (purpose, category, property_type);
create index properties_price_idx on public.properties (price);
create index properties_area_idx on public.properties (area_sqft);
create index properties_featured_idx on public.properties (featured) where featured;
create index properties_created_by_idx on public.properties (created_by);
create index properties_search_trgm_idx on public.properties using gin (search_text gin_trgm_ops);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null,
  storage_path text,
  alt text not null default '',
  width integer,
  height integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index property_images_property_idx on public.property_images (property_id, position);

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Publishing bookkeeping + column protection for non-staff writers.
create function public.guard_property_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  public_statuses public.property_status[] := array['published', 'under_negotiation', 'sold', 'rented'];
begin
  if not (public.is_privileged_role() or public.is_staff()) then
    if tg_op = 'INSERT' then
      new.created_by := auth.uid();
      new.review_notes := null;
      new.is_demo := false;
    else
      new.created_by := old.created_by;
      new.review_notes := old.review_notes;
      new.is_demo := old.is_demo;
    end if;
    new.featured := false;
    new.verified := false;
    if new.status not in ('draft', 'pending_review') then
      raise exception 'Sellers can only save drafts or submit for review' using errcode = '42501';
    end if;
  end if;

  if new.status = any (public_statuses) then
    if tg_op = 'INSERT' or not (old.status = any (public_statuses)) then
      new.published_at := now();
    end if;
  else
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger properties_guard_write
  before insert or update on public.properties
  for each row execute function public.guard_property_write();

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- Atomic create/update of a property and its ordered images.
-- SECURITY INVOKER: every statement runs under the caller's RLS policies.
create function public.save_property(p_id uuid, p_data jsonb, p_images jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_cover text;
begin
  select img ->> 'url' into v_cover
  from jsonb_array_elements(coalesce(p_images, '[]')) with ordinality as t(img, ord)
  order by ord limit 1;

  if v_id is null then
    insert into public.properties (
      slug, title, description, purpose, category, property_type, price, price_label, negotiable,
      address, locality, city, state, pincode, latitude, longitude, location_precision,
      area, area_unit, bedrooms, bathrooms, parking, furnishing, floor, total_floors, facing,
      construction_year, possession_status, amenities, highlights, nearby_landmarks, custom_fields,
      cover_image_url, video_url, virtual_tour_url, status, featured, verified, review_notes, is_demo, created_by
    )
    select
      d.slug, d.title, d.description, d.purpose, d.category, d.property_type, d.price, d.price_label, d.negotiable,
      d.address, d.locality, d.city, d.state, d.pincode, d.latitude, d.longitude, d.location_precision,
      d.area, d.area_unit, d.bedrooms, d.bathrooms, d.parking, d.furnishing, d.floor, d.total_floors, d.facing,
      d.construction_year, d.possession_status,
      coalesce(d.amenities, '{}'), coalesce(d.highlights, '{}'),
      coalesce(d.nearby_landmarks, '[]'), coalesce(d.custom_fields, '{}'),
      v_cover, d.video_url, d.virtual_tour_url, d.status, d.featured, d.verified, d.review_notes,
      coalesce(d.is_demo, false), auth.uid()
    from jsonb_populate_record(null::public.properties, p_data) d
    returning id into v_id;
  else
    update public.properties t set
      slug = d.slug, title = d.title, description = d.description, purpose = d.purpose,
      category = d.category, property_type = d.property_type, price = d.price, price_label = d.price_label,
      negotiable = d.negotiable, address = d.address, locality = d.locality, city = d.city, state = d.state,
      pincode = d.pincode, latitude = d.latitude, longitude = d.longitude,
      location_precision = d.location_precision, area = d.area, area_unit = d.area_unit,
      bedrooms = d.bedrooms, bathrooms = d.bathrooms, parking = d.parking, furnishing = d.furnishing,
      floor = d.floor, total_floors = d.total_floors, facing = d.facing,
      construction_year = d.construction_year, possession_status = d.possession_status,
      amenities = coalesce(d.amenities, '{}'), highlights = coalesce(d.highlights, '{}'),
      nearby_landmarks = coalesce(d.nearby_landmarks, '[]'), custom_fields = coalesce(d.custom_fields, '{}'),
      cover_image_url = v_cover, video_url = d.video_url, virtual_tour_url = d.virtual_tour_url,
      status = d.status, featured = d.featured, verified = d.verified,
      review_notes = case when p_data ? 'review_notes' then d.review_notes else t.review_notes end
    from jsonb_populate_record(null::public.properties, p_data) d
    where t.id = v_id;
    if not found then
      raise exception 'Property not found or not editable' using errcode = '42501';
    end if;
    delete from public.property_images where property_id = v_id;
  end if;

  insert into public.property_images (property_id, url, storage_path, alt, width, height, position)
  select v_id, img ->> 'url', img ->> 'storage_path', coalesce(img ->> 'alt', ''),
         (img ->> 'width')::integer, (img ->> 'height')::integer, (ord - 1)::integer
  from jsonb_array_elements(coalesce(p_images, '[]')) with ordinality as t(img, ord);

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Enquiries (CRM)
-- ----------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^YR-[A-Z0-9]{6}$'),
  property_id uuid references public.properties (id) on delete set null,
  property_title text,
  property_slug text,
  name text check (char_length(name) <= 80),
  phone text check (char_length(phone) <= 20),
  email text check (char_length(email) <= 120),
  message text check (char_length(message) <= 1500),
  source public.enquiry_source not null,
  status public.enquiry_status not null default 'new',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_created_idx on public.enquiries (created_at desc);
create index enquiries_status_idx on public.enquiries (status);
create index enquiries_property_idx on public.enquiries (property_id);
create index enquiries_assigned_idx on public.enquiries (assigned_to);

-- Snapshot the property title/slug and lock CRM fields on public inserts.
-- SECURITY INVOKER: the title lookup runs under the caller's RLS, so anonymous
-- visitors can only link enquiries to publicly visible properties.
create function public.prepare_enquiry()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if new.property_id is not null then
    select p.title, p.slug into new.property_title, new.property_slug
    from public.properties p
    where p.id = new.property_id
      and p.status in ('published', 'under_negotiation', 'sold', 'rented');
    if new.property_title is null then
      new.property_id := null;
    end if;
  end if;
  if not (public.is_privileged_role() or public.is_staff()) then
    new.status := 'new';
    new.assigned_to := null;
  end if;
  return new;
end;
$$;

create trigger enquiries_prepare
  before insert on public.enquiries
  for each row execute function public.prepare_enquiry();

create trigger enquiries_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default '',
  created_at timestamptz not null default now()
);
create index enquiry_notes_enquiry_idx on public.enquiry_notes (enquiry_id, created_at);

-- ----------------------------------------------------------------------------
-- Site settings (single row, admin-editable CMS fields)
-- ----------------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
insert into public.site_settings (id) values (1);

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.site_settings enable row level security;

-- profiles
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "profiles: update own name" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- properties
create policy "properties: public read" on public.properties
  for select to anon, authenticated
  using (status in ('published', 'under_negotiation', 'sold', 'rented'));
create policy "properties: staff read all" on public.properties
  for select to authenticated using (public.is_staff());
create policy "properties: owner read" on public.properties
  for select to authenticated using (created_by = auth.uid());

create policy "properties: staff insert" on public.properties
  for insert to authenticated with check (public.is_staff());
create policy "properties: seller insert" on public.properties
  for insert to authenticated
  with check (
    public.current_app_role() = 'seller'
    and status in ('draft', 'pending_review')
  );

create policy "properties: staff update" on public.properties
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "properties: seller update own" on public.properties
  for update to authenticated
  using (
    public.current_app_role() = 'seller'
    and created_by = auth.uid()
    and status in ('draft', 'pending_review', 'changes_requested')
  )
  with check (created_by = auth.uid() and status in ('draft', 'pending_review'));

create policy "properties: admin delete" on public.properties
  for delete to authenticated using (public.is_admin());
create policy "properties: seller delete own draft" on public.properties
  for delete to authenticated
  using (
    public.current_app_role() = 'seller'
    and created_by = auth.uid()
    and status in ('draft', 'changes_requested', 'rejected')
  );

-- property_images follow their parent property
create policy "images: read with property" on public.property_images
  for select to anon, authenticated
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "images: write with property" on public.property_images
  for all to authenticated
  using (
    public.is_staff() or exists (
      select 1 from public.properties p
      where p.id = property_id and p.created_by = auth.uid()
        and p.status in ('draft', 'pending_review', 'changes_requested')
    )
  )
  with check (
    public.is_staff() or exists (
      select 1 from public.properties p
      where p.id = property_id and p.created_by = auth.uid()
        and p.status in ('draft', 'pending_review', 'changes_requested')
    )
  );

-- enquiries: anyone may create; only staff may read or change.
create policy "enquiries: public insert" on public.enquiries
  for insert to anon, authenticated
  with check (status = 'new' and assigned_to is null);
create policy "enquiries: staff read" on public.enquiries
  for select to authenticated using (public.is_staff());
create policy "enquiries: staff update" on public.enquiries
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "enquiries: admin delete" on public.enquiries
  for delete to authenticated using (public.is_admin());

-- enquiry_notes: internal only. No anon access at all.
create policy "notes: staff read" on public.enquiry_notes
  for select to authenticated using (public.is_staff());
create policy "notes: staff insert" on public.enquiry_notes
  for insert to authenticated with check (public.is_staff() and author_id = auth.uid());
create policy "notes: admin delete" on public.enquiry_notes
  for delete to authenticated using (public.is_admin());

-- site_settings: public read, admin write
create policy "settings: public read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "settings: admin update" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Table privileges (RLS still applies on top of these).
revoke all on public.enquiry_notes from anon;
revoke update, delete on public.enquiries from anon;
grant execute on function public.save_property(uuid, jsonb, jsonb) to authenticated;
revoke execute on function public.save_property(uuid, jsonb, jsonb) from anon;

-- ----------------------------------------------------------------------------
-- Storage: public-read bucket for listing photos
-- Staff upload under properties/…, sellers under sellers/<uid>/…
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "property-images: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-images');

create policy "property-images: staff write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-images' and public.is_staff());

create policy "property-images: seller write own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = 'sellers'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "property-images: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-images' and public.is_staff());

create policy "property-images: seller delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = 'sellers'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
