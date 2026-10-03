import { CATEGORY_LABELS, PURPOSE_LABELS } from "@/config/property-options"
import { absoluteUrl } from "@/config/site"
import { formatLocation, propertyHeadline } from "@/lib/format"
import { normalizeWhatsAppNumber } from "@/lib/whatsapp"
import type { PublicProperty, SiteSettings } from "@/types/domain"

export function realEstateAgentJsonLd(s: SiteSettings) {
  const sameAs = Object.values(s.socials).filter(Boolean)
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": absoluteUrl("/#organization"),
    name: s.companyName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl("/opengraph-image"),
    telephone: `+${normalizeWhatsAppNumber(s.phone)}`,
    ...(s.email ? { email: s.email } : {}),
    foundingDate: String(s.establishedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: s.addressLines.slice(0, 2).join(", "),
      addressLocality: "Secunderabad",
      addressRegion: "Telangana",
      postalCode: "500094",
      addressCountry: "IN",
    },
    areaServed: s.serviceAreas.map((name) => ({ "@type": "Place", name })),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

const RESIDENCE_TYPES: Partial<Record<PublicProperty["propertyType"], string>> = {
  apartment: "Apartment",
  villa: "SingleFamilyResidence",
  independent_house: "SingleFamilyResidence",
}

export function propertyJsonLd(p: PublicProperty, settings: SiteSettings) {
  const url = absoluteUrl(`/properties/${p.slug}`)
  const itemType = RESIDENCE_TYPES[p.propertyType] ?? (p.category === "residential" ? "Residence" : "Place")
  const availability =
    p.status === "sold" || p.status === "rented" ? "https://schema.org/SoldOut" : "https://schema.org/InStock"

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    url,
    name: p.title,
    description: p.description.slice(0, 500),
    datePosted: p.publishedAt ?? p.createdAt,
    image: p.images.slice(0, 6).map((i) => absoluteUrl(i.url)),
    about: {
      "@type": itemType,
      name: `${propertyHeadline(p)} in ${p.locality}`,
      ...(p.bedrooms ? { numberOfRooms: p.bedrooms, numberOfBedrooms: p.bedrooms } : {}),
      ...(p.bathrooms ? { numberOfBathroomsTotal: p.bathrooms } : {}),
      floorSize: {
        "@type": "QuantitativeValue",
        value: p.area,
        unitText: p.areaUnit,
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: p.locality,
        addressRegion: p.state,
        ...(p.pincode ? { postalCode: p.pincode } : {}),
        addressCountry: "IN",
      },
      ...(p.latitude !== null && p.longitude !== null
        ? { geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } }
        : {}),
    },
    offers: {
      "@type": "Offer",
      ...(p.price ? { price: p.price, priceCurrency: "INR" } : {}),
      businessFunction:
        p.purpose === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
      availability,
      seller: { "@id": absoluteUrl("/#organization"), name: settings.companyName },
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/** "3 BHK Villa for Sale in Sainikpuri" */
export function propertySeoTitle(p: PublicProperty) {
  return `${propertyHeadline(p)} ${PURPOSE_LABELS[p.purpose].replace("For", "for")} in ${p.locality}`
}

export function propertySeoDescription(p: PublicProperty, companyName: string) {
  const lead = `Explore this ${propertyHeadline(p).toLowerCase()} ${p.purpose === "rent" ? "for rent" : "for sale"} in ${formatLocation(p)} with ${companyName}.`
  const extra = p.description.replace(/\s+/g, " ").slice(0, 150 - Math.min(lead.length, 140))
  return `${lead} ${extra}`.trim().slice(0, 160)
}

export function listingsSeoTitle(opts: { purpose?: string; category?: string; location?: string }) {
  const what = opts.category ? `${CATEGORY_LABELS[opts.category as keyof typeof CATEGORY_LABELS]} Properties` : "Properties"
  const why = opts.purpose === "rent" ? "for Rent" : opts.purpose === "sale" ? "for Sale" : ""
  const where = opts.location ? `in ${opts.location.replace(/\b\w/g, (c) => c.toUpperCase())}` : "in Hyderabad & Secunderabad"
  return [what, why, where].filter(Boolean).join(" ")
}
