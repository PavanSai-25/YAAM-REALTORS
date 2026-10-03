import { z } from "zod"
import {
  AVAILABILITY_FILTERS,
  CATEGORIES,
  FURNISHING,
  POSSESSION,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PURPOSES,
  SORT_OPTIONS,
} from "@/config/property-options"

/** Ignore invalid values instead of failing the page — URLs get hand-edited. */
const lenientEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (typeof v === "string" && (values as readonly string[]).includes(v) ? v : undefined), z.enum(values).optional())

const lenientInt = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
}, z.number().int().optional())

const lenientText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined),
  z.string().optional(),
)

export const PAGE_SIZE = 12

export const propertySearchSchema = z.object({
  purpose: z.preprocess((v) => (v === "buy" ? "sale" : v), lenientEnum(PURPOSES)),
  category: lenientEnum(CATEGORIES),
  propertyType: lenientEnum(PROPERTY_TYPES),
  location: lenientText,
  q: lenientText,
  minPrice: lenientInt,
  maxPrice: lenientInt,
  minArea: lenientInt,
  maxArea: lenientInt,
  bedrooms: lenientInt,
  bathrooms: lenientInt,
  furnishing: lenientEnum(FURNISHING),
  possession: lenientEnum(POSSESSION),
  availability: lenientEnum(AVAILABILITY_FILTERS),
  sort: lenientEnum(SORT_OPTIONS),
  page: z.preprocess((v) => {
    const n = Number(v)
    return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1
  }, z.number().int()),
})

export type PropertySearch = z.infer<typeof propertySearchSchema>

type RawParams = Record<string, string | string[] | undefined>

export function parsePropertySearch(raw: RawParams): PropertySearch {
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  )
  return propertySearchSchema.parse(flat)
}

/** Serialise back to a clean query string (defaults omitted). */
export function searchToQuery(search: Partial<PropertySearch>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === "") continue
    if (key === "page" && value === 1) continue
    if (key === "sort" && value === "newest") continue
    if (key === "availability" && value === "available") continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export const adminPropertyFilterSchema = z.object({
  q: lenientText,
  status: lenientEnum(PROPERTY_STATUSES),
  category: lenientEnum(CATEGORIES),
  purpose: lenientEnum(PURPOSES),
  location: lenientText,
  page: propertySearchSchema.shape.page,
})
export type AdminPropertyFilter = z.infer<typeof adminPropertyFilterSchema>

export function parseAdminPropertyFilter(raw: RawParams): AdminPropertyFilter {
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  )
  return adminPropertyFilterSchema.parse(flat)
}
