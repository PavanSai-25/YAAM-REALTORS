import { z } from "zod"
import {
  AREA_UNITS,
  CATEGORIES,
  FACING,
  FURNISHING,
  LOCATION_PRECISION,
  POSSESSION,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PURPOSES,
  TYPES_BY_CATEGORY,
} from "@/config/property-options"

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Must be an https:// link")
  .transform((v) => (v === "" ? null : v))
  .nullable()

const optionalInt = (max: number) => z.number().int().min(0).max(max).nullable()

export const propertyImageSchema = z.object({
  id: z.string().min(1).max(64),
  url: z
    .string()
    .max(1000)
    .refine((v) => v.startsWith("/") || v.startsWith("https://"), "Invalid image URL"),
  storagePath: z.string().max(500).nullable(),
  alt: z.string().trim().max(200),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  position: z.number().int().min(0),
})

export const landmarkSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  distance: z.string().trim().max(40),
})

export const propertyInputSchema = z
  .object({
    title: z.string().trim().min(8, "Use at least 8 characters").max(140),
    description: z.string().trim().min(30, "Describe the property in at least 30 characters").max(8000),
    purpose: z.enum(PURPOSES),
    category: z.enum(CATEGORIES),
    propertyType: z.enum(PROPERTY_TYPES),

    price: z.number({ error: "Enter a price" }).int().min(0).max(1_000_00_00_000),
    priceLabel: z.string().trim().max(60).nullable(),
    negotiable: z.boolean(),

    address: z.string().trim().max(300),
    locality: z.string().trim().min(2, "Locality is required").max(80),
    city: z.string().trim().min(2, "City is required").max(80),
    state: z.string().trim().min(2).max(80),
    pincode: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{6}$/.test(v), "Pincode must be 6 digits"),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    locationPrecision: z.enum(LOCATION_PRECISION),

    area: z.number({ error: "Enter the area" }).positive("Area must be greater than 0").max(10_000_000),
    areaUnit: z.enum(AREA_UNITS),
    bedrooms: optionalInt(20),
    bathrooms: optionalInt(20),
    parking: optionalInt(500),
    furnishing: z.enum(FURNISHING).nullable(),
    floor: z.number().int().min(-5).max(200).nullable(),
    totalFloors: optionalInt(200),
    facing: z.enum(FACING).nullable(),
    constructionYear: z.number().int().min(1900).max(2100).nullable(),
    possessionStatus: z.enum(POSSESSION).nullable(),

    amenities: z.array(z.string().max(60)).max(60),
    highlights: z.array(z.string().trim().min(1).max(160)).max(20),
    nearbyLandmarks: z.array(landmarkSchema).max(20),
    customFields: z.record(z.string().max(60), z.string().max(300)),

    images: z.array(propertyImageSchema).max(40),
    videoUrl: optionalUrl,
    virtualTourUrl: optionalUrl,

    status: z.enum(PROPERTY_STATUSES),
    featured: z.boolean(),
    verified: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!TYPES_BY_CATEGORY[v.category].includes(v.propertyType)) {
      ctx.addIssue({
        code: "custom",
        path: ["propertyType"],
        message: "This type doesn't belong to the selected category",
      })
    }
    if ((v.latitude === null) !== (v.longitude === null)) {
      ctx.addIssue({
        code: "custom",
        path: ["longitude"],
        message: "Enter both latitude and longitude, or neither",
      })
    }
    if (v.floor !== null && v.totalFloors !== null && v.floor > v.totalFloors) {
      ctx.addIssue({ code: "custom", path: ["floor"], message: "Floor can't exceed total floors" })
    }
    if (!v.priceLabel && v.price <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Enter a price, or a price label such as “Price on request”",
      })
    }
  })

export type PropertyInput = z.infer<typeof propertyInputSchema>

export const EMPTY_PROPERTY_INPUT: PropertyInput = {
  title: "",
  description: "",
  purpose: "sale",
  category: "residential",
  propertyType: "apartment",
  price: 0,
  priceLabel: null,
  negotiable: false,
  address: "",
  locality: "",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "",
  latitude: null,
  longitude: null,
  locationPrecision: "approximate",
  area: 0,
  areaUnit: "sqft",
  bedrooms: null,
  bathrooms: null,
  parking: null,
  furnishing: null,
  floor: null,
  totalFloors: null,
  facing: null,
  constructionYear: null,
  possessionStatus: "ready_to_move",
  amenities: [],
  highlights: [],
  nearbyLandmarks: [],
  customFields: {},
  images: [],
  videoUrl: null,
  virtualTourUrl: null,
  status: "draft",
  featured: false,
  verified: false,
}

export const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(200),
  action: z.enum(["publish", "unpublish", "archive", "delete", "feature", "unfeature"]),
})

export const reviewDecisionSchema = z.object({
  id: z.string().min(1).max(64),
  decision: z.enum(["approve", "reject", "request_changes"]),
  notes: z.string().trim().max(2000),
})
