import type {
  AreaUnit,
  Category,
  EnquirySource,
  EnquiryStatus,
  Facing,
  Furnishing,
  LocationPrecision,
  PossessionStatus,
  PropertyStatus,
  PropertyType,
  Purpose,
  Role,
} from "@/config/property-options"

export interface PropertyImage {
  id: string
  /** Public URL (Supabase public object URL, local /media URL, or /demo asset). */
  url: string
  /** Storage object path, null for bundled demo assets. */
  storagePath: string | null
  alt: string
  width: number | null
  height: number | null
  position: number
}

export interface NearbyLandmark {
  name: string
  distance: string
}

export interface Property {
  id: string
  slug: string
  title: string
  description: string
  purpose: Purpose
  category: Category
  propertyType: PropertyType

  price: number
  /** Optional display override, e.g. "Price on request". */
  priceLabel: string | null
  negotiable: boolean

  address: string
  locality: string
  city: string
  state: string
  pincode: string
  latitude: number | null
  longitude: number | null
  locationPrecision: LocationPrecision

  area: number
  areaUnit: AreaUnit
  /** Derived: area normalised to sq.ft. for filtering + sorting. */
  areaSqft: number
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  furnishing: Furnishing | null
  floor: number | null
  totalFloors: number | null
  facing: Facing | null
  constructionYear: number | null
  possessionStatus: PossessionStatus | null

  amenities: string[]
  highlights: string[]
  nearbyLandmarks: NearbyLandmark[]
  /** Free-form key/value specs that don't belong in the core schema. */
  customFields: Record<string, string>

  images: PropertyImage[]
  coverImageUrl: string | null
  videoUrl: string | null
  virtualTourUrl: string | null

  status: PropertyStatus
  featured: boolean
  verified: boolean
  /** Demo seed listings — always badged in the UI, never real Yaam inventory. */
  isDemo: boolean
  /** Reviewer feedback for seller submissions (admin/staff/owner only). */
  reviewNotes: string | null

  createdAt: string
  updatedAt: string
  publishedAt: string | null
  createdBy: string | null
}

/** Shape safe to send to public pages — no internal review notes / owner id. */
export type PublicProperty = Omit<Property, "reviewNotes" | "createdBy">

export interface EnquiryNote {
  id: string
  enquiryId: string
  body: string
  authorId: string | null
  authorName: string
  createdAt: string
}

export interface Enquiry {
  id: string
  /** Short code included in WhatsApp messages so chats can be matched to leads. */
  reference: string
  propertyId: string | null
  propertyTitle: string | null
  propertySlug: string | null
  name: string | null
  phone: string | null
  email: string | null
  message: string | null
  source: EnquirySource
  status: EnquiryStatus
  assignedTo: string | null
  assignedToName: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: Role
  createdAt: string
}

export interface SessionUser {
  id: string
  email: string
  fullName: string
  role: Role
}

export interface ServiceItem {
  title: string
  description: string
}

export interface SiteSettings {
  companyName: string
  shortName: string
  establishedYear: number
  contactPerson: string
  phone: string
  whatsappNumber: string
  email: string
  addressLines: string[]
  mapsUrl: string
  officeLatitude: number | null
  officeLongitude: number | null
  heroHeadline: string
  heroDescription: string
  aboutIntro: string
  services: ServiceItem[]
  serviceAreas: string[]
  socials: {
    instagram: string
    facebook: string
    youtube: string
    linkedin: string
  }
  businessHours: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DashboardStats {
  totalProperties: number
  activeListings: number
  sold: number
  rented: number
  drafts: number
  pendingReview: number
  enquiries: number
  newEnquiries: number
  enquiriesByDay: { date: string; count: number }[]
}
