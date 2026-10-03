import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { AVAILABLE_STATUSES, PUBLIC_STATUSES } from "@/config/property-options"
import { statusesForAvailability, toPublicProperty } from "@/lib/data/query"
import type { AdminDataStore, PublicDataStore } from "@/lib/data/types"
import { istDateKey, lastIstDays } from "@/lib/format"
import { PAGE_SIZE } from "@/lib/validations/filters"
import { publicClient, serviceClient, sessionClient } from "@/lib/supabase/clients"
import type { DashboardStats, Paginated } from "@/types/domain"
import { PROPERTY_SELECT, propertyToPayload, rowToEnquiry, rowToNote, rowToProfile, rowToProperty } from "./mappers"

function fail(error: { message: string } | null, context: string): asserts error is null {
  if (error) throw new Error(`${context}: ${error.message}`)
}

/** Escape LIKE wildcards in user input. */
function likePattern(value: string) {
  return `%${value.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

function pageMeta<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}

function range(page: number, pageSize: number): [number, number] {
  return [(page - 1) * pageSize, page * pageSize - 1]
}

export const supabasePublicStore: PublicDataStore = {
  properties: {
    async search(s) {
      const sb = publicClient()
      const build = () => {
        let q = sb
          .from("properties")
          .select(PROPERTY_SELECT, { count: "exact" })
          .in("status", [...statusesForAvailability(s.availability)])
        if (s.purpose) q = q.eq("purpose", s.purpose)
        if (s.category) q = q.eq("category", s.category)
        if (s.propertyType) q = q.eq("property_type", s.propertyType)
        if (s.location) q = q.ilike("search_text", likePattern(s.location))
        if (s.q) q = q.ilike("search_text", likePattern(s.q))
        if (s.minPrice !== undefined) q = q.gte("price", s.minPrice)
        if (s.maxPrice !== undefined) q = q.lte("price", s.maxPrice)
        if (s.minArea !== undefined) q = q.gte("area_sqft", s.minArea)
        if (s.maxArea !== undefined) q = q.lte("area_sqft", s.maxArea)
        if (s.bedrooms !== undefined) q = q.gte("bedrooms", s.bedrooms)
        if (s.bathrooms !== undefined) q = q.gte("bathrooms", s.bathrooms)
        if (s.furnishing) q = q.eq("furnishing", s.furnishing)
        if (s.possession) q = q.eq("possession_status", s.possession)
        switch (s.sort) {
          case "price_asc":
            q = q.order("price", { ascending: true })
            break
          case "price_desc":
            q = q.order("price", { ascending: false })
            break
          case "area_desc":
            q = q.order("area_sqft", { ascending: false })
            break
          case "featured":
            q = q.order("featured", { ascending: false })
            break
        }
        return q.order("published_at", { ascending: false, nullsFirst: false })
      }
      let page = s.page
      const first = await build().range(...range(page, PAGE_SIZE))
      let { data, error } = first
      const { count } = first
      fail(error, "search properties")
      const total = count ?? 0
      const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
      if (page > lastPage) {
        page = lastPage
        ;({ data, error } = await build().range(...range(page, PAGE_SIZE)))
        fail(error, "search properties")
      }
      return pageMeta((data ?? []).map((r) => toPublicProperty(rowToProperty(r))), total, page, PAGE_SIZE)
    },
    async getBySlug(slug) {
      const { data, error } = await publicClient()
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("slug", slug)
        .in("status", [...PUBLIC_STATUSES])
        .maybeSingle()
      fail(error, "get property")
      return data ? toPublicProperty(rowToProperty(data)) : null
    },
    async listFeatured(limit) {
      const { data, error } = await publicClient()
        .from("properties")
        .select(PROPERTY_SELECT)
        .in("status", [...AVAILABLE_STATUSES])
        .order("featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(limit)
      fail(error, "featured properties")
      return (data ?? []).map((r) => toPublicProperty(rowToProperty(r)))
    },
    async listSimilar(property, limit) {
      const { data, error } = await publicClient()
        .from("properties")
        .select(PROPERTY_SELECT)
        .in("status", [...AVAILABLE_STATUSES])
        .eq("category", property.category)
        .neq("id", property.id)
        .order("published_at", { ascending: false })
        .limit(24)
      fail(error, "similar properties")
      const score = (r: { purpose: string; locality: string; property_type: string }) =>
        Number(r.purpose === property.purpose) * 2 +
        Number(r.locality === property.locality) * 2 +
        Number(r.property_type === property.propertyType)
      return (data ?? [])
        .sort((a, b) => score(b) - score(a))
        .slice(0, limit)
        .map((r) => toPublicProperty(rowToProperty(r)))
    },
    async listSitemapEntries() {
      const { data, error } = await publicClient()
        .from("properties")
        .select("slug, updated_at")
        .in("status", [...PUBLIC_STATUSES])
        .limit(50_000)
      fail(error, "sitemap")
      return (data ?? []).map((r) => ({ slug: r.slug as string, updatedAt: r.updated_at as string }))
    },
    async listLocalities() {
      const { data, error } = await publicClient()
        .from("properties")
        .select("locality")
        .in("status", [...AVAILABLE_STATUSES])
        .limit(5000)
      fail(error, "localities")
      return [...new Set((data ?? []).map((r) => r.locality as string))].sort()
    },
    async categoryCounts() {
      const sb = publicClient()
      const count = async (column: string, value: string) => {
        const { count, error } = await sb
          .from("properties")
          .select("id", { count: "exact", head: true })
          .in("status", [...AVAILABLE_STATUSES])
          .eq(column, value)
        fail(error, "category counts")
        return count ?? 0
      }
      const [residential, commercial, land, rent] = await Promise.all([
        count("category", "residential"),
        count("category", "commercial"),
        count("category", "land"),
        count("purpose", "rent"),
      ])
      return { residential, commercial, land, rent }
    },
  },
  async createEnquiry(input) {
    const { error } = await publicClient().from("enquiries").insert({
      reference: input.reference,
      property_id: input.propertyId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: input.message,
      source: input.source,
    })
    // Duplicate reference = the same WhatsApp tap reported twice; ignore.
    if (error && error.code !== "23505") fail(error, "create enquiry")
  },
  async getSettings() {
    const { data, error } = await publicClient().from("site_settings").select("data").eq("id", 1).maybeSingle()
    fail(error, "settings")
    return (data?.data as Record<string, unknown>) ?? null
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST builder generics are untyped without generated DB types
async function adminCount(sb: SupabaseClient, table: string, apply: (q: any) => any) {
  const { count, error } = await apply(sb.from(table).select("id", { count: "exact", head: true }))
  fail(error, `count ${table}`)
  return (count as number) ?? 0
}

export async function createSupabaseAdminStore(): Promise<AdminDataStore> {
  const sb = await sessionClient()

  return {
    properties: {
      async list(filter, scope) {
        let q = sb.from("properties").select(PROPERTY_SELECT, { count: "exact" })
        if (filter.status) q = q.eq("status", filter.status)
        if (filter.category) q = q.eq("category", filter.category)
        if (filter.purpose) q = q.eq("purpose", filter.purpose)
        if (filter.location) q = q.ilike("search_text", likePattern(filter.location))
        if (filter.q) q = q.or(`title.ilike.${likePattern(filter.q).replace(/[(),]/g, "")},slug.ilike.${likePattern(filter.q).replace(/[(),]/g, "")}`)
        if (scope?.ownerId) q = q.eq("created_by", scope.ownerId)
        if (scope?.statuses) q = q.in("status", scope.statuses)
        const { data, count, error } = await q.order("updated_at", { ascending: false }).range(...range(filter.page, 20))
        fail(error, "list properties")
        return pageMeta((data ?? []).map(rowToProperty), count ?? 0, filter.page, 20)
      },
      async getById(id) {
        const { data, error } = await sb.from("properties").select(PROPERTY_SELECT).eq("id", id).maybeSingle()
        if (error?.code === "22P02") return null // not a uuid
        fail(error, "get property")
        return data ? rowToProperty(data) : null
      },
      async isSlugTaken(slug, exceptId) {
        // Runs under RLS: staff see every row; for sellers a hidden collision is
        // still caught by the unique index and retried by the caller.
        let q = sb.from("properties").select("id", { count: "exact", head: true }).eq("slug", slug)
        if (exceptId) q = q.neq("id", exceptId)
        const { count, error } = await q
        fail(error, "slug check")
        return (count ?? 0) > 0
      },
      async create(data) {
        const { payload, images } = propertyToPayload(data)
        const { data: id, error } = await sb.rpc("save_property", { p_id: null, p_data: payload, p_images: images })
        fail(error, "create property")
        const created = await this.getById(id as string)
        if (!created) throw new Error("Property saved but could not be read back")
        return created
      },
      async update(id, data) {
        const { payload, images } = propertyToPayload(data)
        const { error } = await sb.rpc("save_property", { p_id: id, p_data: payload, p_images: images })
        fail(error, "update property")
        const updated = await this.getById(id)
        if (!updated) throw new Error("Property saved but could not be read back")
        return updated
      },
      async bulkUpdate(ids, patch) {
        const { data, error } = await sb.from("properties").update(patch).in("id", ids).select("id")
        fail(error, "bulk update")
        return data?.length ?? 0
      },
      async setReview(id, status, notes) {
        const { error } = await sb.from("properties").update({ status, review_notes: notes }).eq("id", id)
        fail(error, "review property")
      },
      async delete(ids) {
        const { data: imgs } = await sb.from("property_images").select("storage_path").in("property_id", ids)
        const { error } = await sb.from("properties").delete().in("id", ids)
        fail(error, "delete properties")
        return (imgs ?? []).map((i) => i.storage_path as string | null).filter((p): p is string => !!p)
      },
      async recent(limit, scope) {
        let q = sb.from("properties").select(PROPERTY_SELECT)
        if (scope?.ownerId) q = q.eq("created_by", scope.ownerId)
        const { data, error } = await q.order("updated_at", { ascending: false }).limit(limit)
        fail(error, "recent properties")
        return (data ?? []).map(rowToProperty)
      },
    },
    enquiries: {
      async list(filter) {
        let q = sb.from("enquiries").select("*, assignee:profiles!enquiries_assigned_to_fkey(full_name)", { count: "exact" })
        if (filter.status) q = q.eq("status", filter.status)
        if (filter.source) q = q.eq("source", filter.source)
        if (filter.q) {
          const p = likePattern(filter.q).replace(/[(),]/g, "")
          q = q.or(`name.ilike.${p},phone.ilike.${p},email.ilike.${p},reference.ilike.${p},property_title.ilike.${p}`)
        }
        const { data, count, error } = await q.order("created_at", { ascending: false }).range(...range(filter.page, 20))
        fail(error, "list enquiries")
        return pageMeta((data ?? []).map(rowToEnquiry), count ?? 0, filter.page, 20)
      },
      async get(id) {
        const { data, error } = await sb
          .from("enquiries")
          .select("*, assignee:profiles!enquiries_assigned_to_fkey(full_name)")
          .eq("id", id)
          .maybeSingle()
        if (error?.code === "22P02") return null
        fail(error, "get enquiry")
        return data ? rowToEnquiry(data) : null
      },
      async recent(limit) {
        const { data, error } = await sb
          .from("enquiries")
          .select("*, assignee:profiles!enquiries_assigned_to_fkey(full_name)")
          .order("created_at", { ascending: false })
          .limit(limit)
        fail(error, "recent enquiries")
        return (data ?? []).map(rowToEnquiry)
      },
      async update(id, patch) {
        const row: Record<string, unknown> = {}
        if (patch.status) row.status = patch.status
        if (patch.assignedTo !== undefined) row.assigned_to = patch.assignedTo
        const { error } = await sb.from("enquiries").update(row).eq("id", id)
        fail(error, "update enquiry")
      },
      async listNotes(enquiryId) {
        const { data, error } = await sb
          .from("enquiry_notes")
          .select("*")
          .eq("enquiry_id", enquiryId)
          .order("created_at", { ascending: true })
        fail(error, "list notes")
        return (data ?? []).map(rowToNote)
      },
      async addNote(note) {
        const { data, error } = await sb
          .from("enquiry_notes")
          .insert({ enquiry_id: note.enquiryId, body: note.body, author_id: note.authorId, author_name: note.authorName })
          .select("*")
          .single()
        fail(error, "add note")
        return rowToNote(data)
      },
    },
    users: {
      async list() {
        const { data, error } = await sb.from("profiles").select("*").order("created_at", { ascending: true })
        fail(error, "list users")
        return (data ?? []).map(rowToProfile)
      },
      async updateRole(userId, role) {
        const { error } = await sb.from("profiles").update({ role }).eq("id", userId)
        fail(error, "update role")
      },
      canCreateUsers: () => !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      async create(input) {
        const admin = serviceClient()
        if (!admin) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY to create users from the dashboard")
        const { data, error } = await admin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { full_name: input.fullName },
        })
        fail(error, "create user")
        const id = data.user!.id
        const { data: profile, error: roleError } = await admin
          .from("profiles")
          .update({ role: input.role, full_name: input.fullName })
          .eq("id", id)
          .select("*")
          .single()
        fail(roleError, "set role")
        return rowToProfile(profile)
      },
    },
    async saveSettings(settings) {
      const { error } = await sb.from("site_settings").update({ data: settings }).eq("id", 1)
      fail(error, "save settings")
    },
    async stats(scope): Promise<DashboardStats> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see adminCount
      const own = (q: any) => (scope?.ownerId ? q.eq("created_by", scope.ownerId) : q)
      const since = new Date(Date.now() - 15 * 86_400_000)
      const [totalProperties, activeListings, sold, rented, drafts, pendingReview, enquiries, newEnquiries, recentRes] =
        await Promise.all([
          adminCount(sb, "properties", (q) => own(q)),
          adminCount(sb, "properties", (q) => own(q).in("status", [...AVAILABLE_STATUSES])),
          adminCount(sb, "properties", (q) => own(q).eq("status", "sold")),
          adminCount(sb, "properties", (q) => own(q).eq("status", "rented")),
          adminCount(sb, "properties", (q) => own(q).eq("status", "draft")),
          adminCount(sb, "properties", (q) => own(q).eq("status", "pending_review")),
          scope?.ownerId ? 0 : adminCount(sb, "enquiries", (q) => q),
          scope?.ownerId ? 0 : adminCount(sb, "enquiries", (q) => q.eq("status", "new")),
          scope?.ownerId
            ? Promise.resolve({ data: [] as { created_at: string }[] })
            : sb.from("enquiries").select("created_at").gte("created_at", since.toISOString()).limit(10_000),
        ])
      const rows = (recentRes.data ?? []) as { created_at: string }[]
      const enquiriesByDay = lastIstDays(14).map((date) => ({
        date,
        count: rows.filter((r) => istDateKey(r.created_at) === date).length,
      }))
      return { totalProperties, activeListings, sold, rented, drafts, pendingReview, enquiries, newEnquiries, enquiriesByDay }
    },
  }
}
