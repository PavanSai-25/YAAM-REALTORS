import type { Category, EnquirySource, EnquiryStatus, PropertyStatus, Role } from "@/config/property-options"
import type { AdminPropertyFilter, PropertySearch } from "@/lib/validations/filters"
import type { EnquiryFilter } from "@/lib/validations/enquiry"
import type { PropertyInput } from "@/lib/validations/property"
import type {
  DashboardStats,
  Enquiry,
  EnquiryNote,
  Paginated,
  Property,
  PublicProperty,
  SiteSettings,
  UserProfile,
} from "@/types/domain"

/** Everything the app writes for a property; ids/timestamps are owned by the store. */
export type PropertyWrite = PropertyInput & {
  slug: string
  reviewNotes?: string | null
  isDemo?: boolean
}

export interface CategoryCounts {
  residential: number
  commercial: number
  land: number
  rent: number
}

/** Read-only queries that public, cacheable pages use. Never sees drafts. */
export interface PublicPropertyStore {
  search(search: PropertySearch): Promise<Paginated<PublicProperty>>
  getBySlug(slug: string): Promise<PublicProperty | null>
  listFeatured(limit: number): Promise<PublicProperty[]>
  listSimilar(property: PublicProperty, limit: number): Promise<PublicProperty[]>
  listSitemapEntries(): Promise<{ slug: string; updatedAt: string }[]>
  listLocalities(): Promise<string[]>
  categoryCounts(): Promise<CategoryCounts>
}

export interface AdminPropertyStore {
  list(filter: AdminPropertyFilter, scope?: { ownerId?: string; statuses?: PropertyStatus[] }): Promise<Paginated<Property>>
  getById(id: string): Promise<Property | null>
  isSlugTaken(slug: string, exceptId?: string): Promise<boolean>
  create(data: PropertyWrite, createdBy: string): Promise<Property>
  update(id: string, data: PropertyWrite): Promise<Property>
  bulkUpdate(ids: string[], patch: { status?: PropertyStatus; featured?: boolean }): Promise<number>
  setReview(id: string, status: PropertyStatus, notes: string | null): Promise<void>
  /** Returns storage paths of the deleted images so the caller can clean storage. */
  delete(ids: string[]): Promise<string[]>
  recent(limit: number, scope?: { ownerId?: string }): Promise<Property[]>
}

export interface PublicEnquiryInput {
  reference: string
  propertyId: string | null
  name: string | null
  phone: string | null
  email: string | null
  message: string | null
  source: EnquirySource
}

export interface EnquiryStore {
  list(filter: EnquiryFilter): Promise<Paginated<Enquiry>>
  get(id: string): Promise<Enquiry | null>
  recent(limit: number): Promise<Enquiry[]>
  update(id: string, patch: { status?: EnquiryStatus; assignedTo?: string | null }): Promise<void>
  listNotes(enquiryId: string): Promise<EnquiryNote[]>
  addNote(note: { enquiryId: string; body: string; authorId: string; authorName: string }): Promise<EnquiryNote>
}

export interface UserStore {
  list(): Promise<UserProfile[]>
  updateRole(userId: string, role: Role): Promise<void>
  /** Not every backend can create users without extra credentials. */
  canCreateUsers(): boolean
  create(input: { email: string; fullName: string; role: Role; password: string }): Promise<UserProfile>
}

/** Public store: anonymous, cache-friendly. */
export interface PublicDataStore {
  properties: PublicPropertyStore
  /** Insert-only — the public can never read enquiries back. */
  createEnquiry(input: PublicEnquiryInput): Promise<void>
  getSettings(): Promise<Partial<SiteSettings> | null>
}

/** Authenticated store: every call runs with the signed-in user's permissions. */
export interface AdminDataStore {
  properties: AdminPropertyStore
  enquiries: EnquiryStore
  users: UserStore
  saveSettings(settings: SiteSettings): Promise<void>
  stats(scope?: { ownerId?: string }): Promise<DashboardStats>
}

export interface UploadTarget {
  /** Where the browser sends the file. */
  uploadUrl: string
  method: "PUT" | "POST"
  headers: Record<string, string>
  /** URL the stored image will be served from. */
  publicUrl: string
  storagePath: string
}

export interface MediaStorage {
  createUploadTarget(input: { storagePath: string; contentType: string }): Promise<UploadTarget>
  remove(paths: string[]): Promise<void>
}

export type { Category }
