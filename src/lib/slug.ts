import { PROPERTY_TYPE_LABELS, type PropertyType, type Purpose } from "@/config/property-options"

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/** "3-bhk-villa-for-sale-sainikpuri" — readable, SEO-friendly, stable. */
export function buildPropertySlug(input: {
  bedrooms?: number | null
  propertyType: PropertyType
  purpose: Purpose
  locality: string
}) {
  const parts = [
    input.bedrooms ? `${input.bedrooms} bhk` : "",
    PROPERTY_TYPE_LABELS[input.propertyType],
    input.purpose === "rent" ? "for rent" : "for sale",
    input.locality,
  ]
  return slugify(parts.filter(Boolean).join(" "))
}

/** Append -2, -3 … until `isTaken` returns false. */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>) {
  let candidate = base || "property"
  let n = 2
  while (await isTaken(candidate)) {
    candidate = `${base}-${n++}`
  }
  return candidate
}
