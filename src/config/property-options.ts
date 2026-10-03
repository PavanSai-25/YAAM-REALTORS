/**
 * Single source of truth for every enumerated property / enquiry value.
 * Database enums (supabase/migrations) and Zod schemas are derived from these
 * lists — add a value here first, then mirror it in a migration.
 */

export const PURPOSES = ["sale", "rent"] as const
export type Purpose = (typeof PURPOSES)[number]

export const CATEGORIES = ["residential", "commercial", "land"] as const
export type Category = (typeof CATEGORIES)[number]

export const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "independent_house",
  "office",
  "shop",
  "warehouse",
  "plot",
  "agricultural_land",
  "other",
] as const
export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const FURNISHING = ["furnished", "semi_furnished", "unfurnished"] as const
export type Furnishing = (typeof FURNISHING)[number]

export const FACING = [
  "north",
  "south",
  "east",
  "west",
  "north_east",
  "north_west",
  "south_east",
  "south_west",
] as const
export type Facing = (typeof FACING)[number]

export const AREA_UNITS = ["sqft", "sqyd", "sqm", "acre"] as const
export type AreaUnit = (typeof AREA_UNITS)[number]

export const POSSESSION = ["ready_to_move", "under_construction"] as const
export type PossessionStatus = (typeof POSSESSION)[number]

export const LOCATION_PRECISION = ["exact", "approximate"] as const
export type LocationPrecision = (typeof LOCATION_PRECISION)[number]

export const PROPERTY_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "rejected",
  "published",
  "under_negotiation",
  "sold",
  "rented",
  "archived",
] as const
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number]

/** Statuses whose detail page is publicly reachable. */
export const PUBLIC_STATUSES: readonly PropertyStatus[] = [
  "published",
  "under_negotiation",
  "sold",
  "rented",
]
/** Statuses shown in normal "available" search results. */
export const AVAILABLE_STATUSES: readonly PropertyStatus[] = ["published", "under_negotiation"]

/** Public search filter for status (maps to one or more PropertyStatus). */
export const AVAILABILITY_FILTERS = ["available", "under_negotiation", "sold", "rented"] as const
export type AvailabilityFilter = (typeof AVAILABILITY_FILTERS)[number]

export const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "area_desc", "featured"] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

export const ROLES = ["admin", "staff", "seller"] as const
export type Role = (typeof ROLES)[number]

export const ENQUIRY_STATUSES = ["new", "contacted", "follow_up", "closed", "lost"] as const
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]

export const ENQUIRY_SOURCES = [
  "whatsapp",
  "callback_form",
  "contact_form",
  "list_property",
  "phone_call",
] as const
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number]

export const PURPOSE_LABELS: Record<Purpose, string> = { sale: "For Sale", rent: "For Rent" }

export const CATEGORY_LABELS: Record<Category, string> = {
  residential: "Residential",
  commercial: "Commercial",
  land: "Land / Plot",
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  villa: "Villa",
  independent_house: "Independent House",
  office: "Office",
  shop: "Shop",
  warehouse: "Warehouse",
  plot: "Plot",
  agricultural_land: "Agricultural Land",
  other: "Other",
}

/** Which property types make sense for each category (drives form + filters). */
export const TYPES_BY_CATEGORY: Record<Category, PropertyType[]> = {
  residential: ["apartment", "villa", "independent_house", "other"],
  commercial: ["office", "shop", "warehouse", "other"],
  land: ["plot", "agricultural_land", "other"],
}

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  furnished: "Furnished",
  semi_furnished: "Semi-Furnished",
  unfurnished: "Unfurnished",
}

export const FACING_LABELS: Record<Facing, string> = {
  north: "North",
  south: "South",
  east: "East",
  west: "West",
  north_east: "North-East",
  north_west: "North-West",
  south_east: "South-East",
  south_west: "South-West",
}

export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  sqft: "sq.ft.",
  sqyd: "sq.yd.",
  sqm: "sq.m.",
  acre: "acres",
}

/** Conversion factor to square feet, used for area filtering + sorting. */
export const AREA_UNIT_TO_SQFT: Record<AreaUnit, number> = {
  sqft: 1,
  sqyd: 9,
  sqm: 10.7639,
  acre: 43560,
}

export const POSSESSION_LABELS: Record<PossessionStatus, string> = {
  ready_to_move: "Ready to Move",
  under_construction: "Under Construction",
}

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  changes_requested: "Changes Requested",
  rejected: "Rejected",
  published: "Published",
  under_negotiation: "Under Negotiation",
  sold: "Sold",
  rented: "Rented",
  archived: "Archived",
}

export const AVAILABILITY_LABELS: Record<AvailabilityFilter, string> = {
  available: "Available",
  under_negotiation: "Under Negotiation",
  sold: "Sold",
  rented: "Rented",
}

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  area_desc: "Largest Area",
  featured: "Featured First",
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  staff: "Staff",
  seller: "Seller",
}

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow Up",
  closed: "Closed",
  lost: "Lost",
}

export const ENQUIRY_SOURCE_LABELS: Record<EnquirySource, string> = {
  whatsapp: "WhatsApp",
  callback_form: "Callback Form",
  contact_form: "Contact Form",
  list_property: "List Property",
  phone_call: "Phone Call",
}

export const AMENITIES = [
  { id: "lift", label: "Lift" },
  { id: "power_backup", label: "Power Backup" },
  { id: "security", label: "24×7 Security" },
  { id: "cctv", label: "CCTV" },
  { id: "gated_community", label: "Gated Community" },
  { id: "covered_parking", label: "Covered Parking" },
  { id: "visitor_parking", label: "Visitor Parking" },
  { id: "swimming_pool", label: "Swimming Pool" },
  { id: "gym", label: "Gymnasium" },
  { id: "clubhouse", label: "Clubhouse" },
  { id: "children_play_area", label: "Children's Play Area" },
  { id: "landscaped_garden", label: "Landscaped Garden" },
  { id: "jogging_track", label: "Jogging Track" },
  { id: "water_supply_24x7", label: "24×7 Water Supply" },
  { id: "borewell", label: "Borewell" },
  { id: "rainwater_harvesting", label: "Rainwater Harvesting" },
  { id: "gas_pipeline", label: "Piped Gas" },
  { id: "intercom", label: "Intercom" },
  { id: "modular_kitchen", label: "Modular Kitchen" },
  { id: "air_conditioning", label: "Air Conditioning" },
  { id: "servant_room", label: "Servant Room" },
  { id: "pet_friendly", label: "Pet Friendly" },
  { id: "fire_safety", label: "Fire Safety" },
  { id: "loading_dock", label: "Loading Dock" },
  { id: "road_frontage", label: "Main Road Frontage" },
  { id: "compound_wall", label: "Compound Wall" },
  { id: "clear_title", label: "Clear Title" },
] as const
export type AmenityId = (typeof AMENITIES)[number]["id"]

export const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITIES.map((a) => [a.id, a.label]),
)

/** Budget presets for the hero search, in rupees. */
export const BUDGET_PRESETS: Record<Purpose, { label: string; min?: number; max?: number }[]> = {
  sale: [
    { label: "Under ₹50 L", max: 50_00_000 },
    { label: "₹50 L – ₹1 Cr", min: 50_00_000, max: 1_00_00_000 },
    { label: "₹1 Cr – ₹2 Cr", min: 1_00_00_000, max: 2_00_00_000 },
    { label: "₹2 Cr – ₹5 Cr", min: 2_00_00_000, max: 5_00_00_000 },
    { label: "Above ₹5 Cr", min: 5_00_00_000 },
  ],
  rent: [
    { label: "Under ₹15,000", max: 15_000 },
    { label: "₹15,000 – ₹30,000", min: 15_000, max: 30_000 },
    { label: "₹30,000 – ₹60,000", min: 30_000, max: 60_000 },
    { label: "₹60,000 – ₹1.5 L", min: 60_000, max: 1_50_000 },
    { label: "Above ₹1.5 L", min: 1_50_000 },
  ],
}

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const
