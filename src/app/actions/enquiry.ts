"use server"

import { getPublicStore } from "@/lib/data"
import { rateLimit } from "@/lib/rate-limit"
import { enquiryFormSchema, type EnquiryFormInput } from "@/lib/validations/enquiry"
import { generateEnquiryReference } from "@/lib/whatsapp"

export type EnquiryResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof EnquiryFormInput, string>> }

/** Public lead form (callback / contact / list-your-property). */
export async function submitEnquiry(input: EnquiryFormInput): Promise<EnquiryResult> {
  if (!(await rateLimit("enquiry-form", 5, 10 * 60_000))) {
    return { ok: false, error: "Too many requests. Please try again in a few minutes, or reach us on WhatsApp." }
  }
  const parsed = enquiryFormSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "")
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    // Honeypot tripped: pretend success so bots learn nothing.
    if (fieldErrors.company) return { ok: true, reference: generateEnquiryReference() }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors }
  }

  const { name, phone, email, message, propertyId, source } = parsed.data
  const reference = generateEnquiryReference()
  try {
    await getPublicStore().createEnquiry({
      reference,
      propertyId: propertyId ?? null,
      name,
      phone,
      email: email || null,
      message: message || null,
      source,
    })
  } catch (err) {
    console.error("[enquiry]", err)
    return { ok: false, error: "We couldn't send your request. Please try again or contact us on WhatsApp." }
  }
  return { ok: true, reference }
}
