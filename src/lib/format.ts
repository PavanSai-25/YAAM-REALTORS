import {
  AREA_UNIT_LABELS,
  AREA_UNIT_TO_SQFT,
  PROPERTY_TYPE_LABELS,
  type AreaUnit,
} from "@/config/property-options"
import type { Property, PublicProperty } from "@/types/domain"

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })

function trimDecimals(value: number, digits = 2) {
  return Number(value.toFixed(digits)).toString()
}

/** ₹1.25 Cr · ₹45 L · ₹22,000 — Indian numbering. */
export function formatINR(amount: number) {
  if (amount >= 1_00_00_000) return `₹${trimDecimals(amount / 1_00_00_000)} Cr`
  if (amount >= 1_00_000) return `₹${trimDecimals(amount / 1_00_000)} L`
  return `₹${inr.format(amount)}`
}

export function formatPrice(p: Pick<Property, "price" | "priceLabel" | "purpose">) {
  if (p.priceLabel?.trim()) return p.priceLabel.trim()
  if (!p.price) return "Price on request"
  return p.purpose === "rent" ? `${formatINR(p.price)}/month` : formatINR(p.price)
}

export function formatNumber(n: number) {
  return inr.format(n)
}

export function formatArea(area: number, unit: AreaUnit) {
  const value = Number.isInteger(area) ? inr.format(area) : trimDecimals(area)
  return `${value} ${AREA_UNIT_LABELS[unit]}`
}

export function toSqft(area: number, unit: AreaUnit) {
  return Math.round(area * AREA_UNIT_TO_SQFT[unit])
}

export function formatLocation(p: Pick<Property, "locality" | "city">) {
  return [p.locality, p.city].filter(Boolean).join(", ")
}

/** "3 BHK Villa" / "Office Space" / "Residential Plot" */
export function propertyHeadline(p: Pick<PublicProperty, "bedrooms" | "propertyType" | "category">) {
  const type = PROPERTY_TYPE_LABELS[p.propertyType]
  if (p.category === "residential" && p.bedrooms) return `${p.bedrooms} BHK ${type}`
  return type
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
    ...opts,
  }).format(new Date(iso))
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} d ago`
  return formatDate(iso)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

const istDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" })

/** YYYY-MM-DD in India time — used to bucket activity by business day. */
export function istDateKey(date: Date | string) {
  return istDay.format(typeof date === "string" ? new Date(date) : date)
}

/** The last `n` IST days, oldest first. */
export function lastIstDays(n: number) {
  return Array.from({ length: n }, (_, i) => istDateKey(new Date(Date.now() - (n - 1 - i) * 86_400_000)))
}
