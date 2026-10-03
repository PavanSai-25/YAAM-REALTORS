import { z } from "zod"
import { ENQUIRY_SOURCES, ENQUIRY_STATUSES } from "@/config/property-options"

const indianPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number")

/** Lead form (callback / contact / list-property). Name + phone required. */
export const enquiryFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: indianPhone,
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email")
    .optional(),
  message: z.string().trim().max(1500).optional(),
  propertyId: z.string().max(64).nullable().optional(),
  source: z.enum(["callback_form", "contact_form", "list_property"]),
  /** Honeypot — real users never fill this. */
  company: z.string().max(0).optional(),
})
export type EnquiryFormInput = z.input<typeof enquiryFormSchema>

/** Fire-and-forget record created when someone taps "Chat on WhatsApp". */
export const whatsappClickSchema = z.object({
  reference: z.string().regex(/^YR-[A-Z0-9]{6}$/),
  propertyId: z.string().max(64).nullable(),
})

export const enquiryUpdateSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  assignedTo: z.string().max(64).nullable().optional(),
})

export const enquiryNoteSchema = z.object({
  enquiryId: z.string().min(1).max(64),
  body: z.string().trim().min(1, "Note can't be empty").max(4000),
})

export const enquiryFilterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(ENQUIRY_STATUSES).optional().catch(undefined),
  source: z.enum(ENQUIRY_SOURCES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
})
export type EnquiryFilter = z.infer<typeof enquiryFilterSchema>
