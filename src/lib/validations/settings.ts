import { z } from "zod"
import { ROLES } from "@/config/property-options"

const optionalHttps = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Must start with https://")

export const siteSettingsSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  shortName: z.string().trim().min(2).max(60),
  establishedYear: z.number().int().min(1900).max(2100),
  contactPerson: z.string().trim().max(80),
  phone: z.string().trim().min(8, "Enter a phone number").max(30),
  whatsappNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 15, "Enter the number with country code, e.g. 917993983540"),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email"),
  addressLines: z.array(z.string().trim().min(1).max(160)).min(1).max(6),
  mapsUrl: optionalHttps,
  officeLatitude: z.number().min(-90).max(90).nullable(),
  officeLongitude: z.number().min(-180).max(180).nullable(),
  heroHeadline: z.string().trim().min(4).max(90),
  heroDescription: z.string().trim().min(10).max(300),
  aboutIntro: z.string().trim().min(10).max(1500),
  services: z
    .array(z.object({ title: z.string().trim().min(2).max(60), description: z.string().trim().max(300) }))
    .min(1)
    .max(12),
  serviceAreas: z.array(z.string().trim().min(2).max(60)).max(40),
  socials: z.object({
    instagram: optionalHttps,
    facebook: optionalHttps,
    youtube: optionalHttps,
    linkedin: optionalHttps,
  }),
  businessHours: z.string().trim().max(120),
})
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>

export const loginSchema = z.object({
  email: z.email("Enter a valid email").max(120),
  password: z.string().min(1, "Enter your password").max(200),
})

export const createUserSchema = z.object({
  email: z.email("Enter a valid email").max(120),
  fullName: z.string().trim().min(2).max(80),
  role: z.enum(ROLES),
  password: z.string().min(10, "Use at least 10 characters").max(200),
})

export const updateRoleSchema = z.object({
  userId: z.string().min(1).max(64),
  role: z.enum(ROLES),
})
