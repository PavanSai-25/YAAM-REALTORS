import type { SiteSettings } from "@/types/domain"

/**
 * Default business configuration.
 *
 * Facts here come from Yaam's visiting card. Contact numbers come from env so
 * they can be changed per environment; admins can override everything at
 * runtime from /admin/settings (stored in the database).
 */

function digits(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "")
}

const phone = process.env.YAAM_PHONE ?? "+91 79939 83540"

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  companyName: "Yaam Realtors & Consultants",
  shortName: "Yaam Realtors",
  establishedYear: 2006,
  contactPerson: "Ankesh",
  phone,
  whatsappNumber: digits(process.env.YAAM_WHATSAPP_NUMBER) || digits(phone),
  email: process.env.YAAM_EMAIL ?? "",
  addressLines: [
    "# 24 & 25, G.K. Enclave, F-5, Defence Colony",
    "Near 5th Avenue Bakery, Main Road",
    "Sainikpuri, Neredmet",
    "Secunderabad, Telangana 500094",
  ],
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=G.K.+Enclave+Defence+Colony+Sainikpuri+Secunderabad+500094",
  // Left empty until the office pin is confirmed — the maps link uses the address.
  officeLatitude: null,
  officeLongitude: null,
  heroHeadline: "Find a Place That Feels Right.",
  heroDescription:
    "Explore residential, commercial and land properties across Hyderabad and Secunderabad with Yaam Realtors & Consultants.",
  aboutIntro:
    "Yaam Realtors & Consultants has helped families, investors and businesses buy, sell, rent and build property in Secunderabad since 2006. We work from our office in Defence Colony, Sainikpuri.",
  services: [
    {
      title: "Property Buying",
      description:
        "Homes, plots and commercial spaces matched to your budget and requirements.",
    },
    {
      title: "Property Selling",
      description:
        "Listing and marketing your property to reach serious buyers.",
    },
    {
      title: "Property Rentals",
      description:
        "Tenant and landlord assistance for apartments, independent houses, offices and retail spaces.",
    },
    {
      title: "Construction & Developments",
      description:
        "Construction and development of residential and commercial projects.",
    },
    {
      title: "Housing Loans",
      description:
        "Assistance with housing loans for your property purchase.",
    },
    {
      title: "Property Care Taking",
      description:
        "Looking after your property on your behalf when you can't be there.",
    },
  ],
  // Only areas named by Yaam. Admins can extend this list from /admin/settings.
  serviceAreas: ["Sainikpuri", "Defence Colony", "Neredmet", "Secunderabad", "Hyderabad"],
  socials: { instagram: "", facebook: "", youtube: "", linkedin: "" },
  businessHours: "",
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
)

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
