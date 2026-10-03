import {
  AVAILABLE_STATUSES,
  PUBLIC_STATUSES,
  type AvailabilityFilter,
  type PropertyStatus,
} from "@/config/property-options"
import type { AdminPropertyFilter, PropertySearch } from "@/lib/validations/filters"
import { PAGE_SIZE } from "@/lib/validations/filters"
import type { Paginated, Property, PublicProperty } from "@/types/domain"

export function statusesForAvailability(a: AvailabilityFilter | undefined): readonly PropertyStatus[] {
  switch (a) {
    case "sold":
      return ["sold"]
    case "rented":
      return ["rented"]
    case "under_negotiation":
      return ["under_negotiation"]
    default:
      return AVAILABLE_STATUSES
  }
}

export function isPubliclyVisible(status: PropertyStatus) {
  return PUBLIC_STATUSES.includes(status)
}

/**
 * Strip owner/internal fields and blur approximate locations so exact
 * coordinates and street addresses never reach the browser.
 */
export function toPublicProperty(p: Property): PublicProperty {
  const { reviewNotes: _r, createdBy: _c, ...rest } = p
  void _r
  void _c
  if (p.locationPrecision === "approximate") {
    return {
      ...rest,
      address: "",
      latitude: p.latitude === null ? null : Math.round(p.latitude * 100) / 100,
      longitude: p.longitude === null ? null : Math.round(p.longitude * 100) / 100,
    }
  }
  return rest
}

function matchesText(p: Property, needle: string) {
  const n = needle.toLowerCase()
  return [p.locality, p.city, p.address, p.title, p.pincode].some((f) => f?.toLowerCase().includes(n))
}

export function matchesSearch(p: Property, s: PropertySearch) {
  if (!statusesForAvailability(s.availability).includes(p.status)) return false
  if (s.purpose && p.purpose !== s.purpose) return false
  if (s.category && p.category !== s.category) return false
  if (s.propertyType && p.propertyType !== s.propertyType) return false
  if (s.location && !matchesText(p, s.location)) return false
  if (s.q && !matchesText(p, s.q)) return false
  if (s.minPrice !== undefined && p.price < s.minPrice) return false
  if (s.maxPrice !== undefined && p.price > s.maxPrice) return false
  if (s.minArea !== undefined && p.areaSqft < s.minArea) return false
  if (s.maxArea !== undefined && p.areaSqft > s.maxArea) return false
  if (s.bedrooms !== undefined && (p.bedrooms ?? 0) < s.bedrooms) return false
  if (s.bathrooms !== undefined && (p.bathrooms ?? 0) < s.bathrooms) return false
  if (s.furnishing && p.furnishing !== s.furnishing) return false
  if (s.possession && p.possessionStatus !== s.possession) return false
  return true
}

export function sortProperties<T extends Property | PublicProperty>(items: T[], sort: PropertySearch["sort"]) {
  const byNewest = (a: T, b: T) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
  const sorted = [...items]
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price || byNewest(a, b))
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price || byNewest(a, b))
    case "area_desc":
      return sorted.sort((a, b) => b.areaSqft - a.areaSqft || byNewest(a, b))
    case "featured":
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || byNewest(a, b))
    default:
      return sorted.sort(byNewest)
  }
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    total,
    page: current,
    pageSize,
    totalPages,
  }
}

export function matchesAdminFilter(p: Property, f: AdminPropertyFilter) {
  if (f.status && p.status !== f.status) return false
  if (f.category && p.category !== f.category) return false
  if (f.purpose && p.purpose !== f.purpose) return false
  if (f.location && !matchesText(p, f.location)) return false
  if (f.q) {
    const n = f.q.toLowerCase()
    if (![p.title, p.slug, p.locality, p.city].some((v) => v.toLowerCase().includes(n))) return false
  }
  return true
}

/** Cover = lowest-position image. Admins "set cover" by moving an image to position 0. */
export function deriveCover(images: Property["images"]) {
  return [...images].sort((a, b) => a.position - b.position)[0]?.url ?? null
}
