import { formatLocation, formatPrice } from "@/lib/format"
import type { PublicProperty } from "@/types/domain"

/**
 * WhatsApp is Yaam's primary conversion channel. Every link in the app is
 * produced here so the number and message format live in one place. The
 * number itself comes from site settings (env default, admin override).
 */

export function normalizeWhatsAppNumber(raw: string) {
  const d = raw.replace(/\D/g, "")
  // Bare 10-digit Indian mobile → prefix country code.
  return d.length === 10 ? `91${d}` : d
}

/** Universal link: opens the app on phones and the WhatsApp landing page on desktop. */
export function whatsappUrl(number: string, message: string) {
  return `https://wa.me/${normalizeWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`
}

/** Desktop browsers go straight to WhatsApp Web. */
export function whatsappWebUrl(number: string, message: string) {
  return `https://web.whatsapp.com/send?phone=${normalizeWhatsAppNumber(number)}&text=${encodeURIComponent(message)}`
}

export function telUrl(phone: string) {
  return `tel:+${normalizeWhatsAppNumber(phone)}`
}

export function generalEnquiryMessage(companyShortName = "Yaam Realtors") {
  return `Hi ${companyShortName}, I'm looking for a property and would like some help.`
}

export function propertyEnquiryMessage(
  property: Pick<PublicProperty, "title" | "locality" | "city" | "price" | "priceLabel" | "purpose">,
  opts: { url?: string; companyShortName?: string } = {},
) {
  const lines = [
    `Hi ${opts.companyShortName ?? "Yaam Realtors"},`,
    "",
    "I'm interested in:",
    "",
    `Property: ${property.title}`,
    `Location: ${formatLocation(property)}`,
    `Price: ${formatPrice(property)}`,
  ]
  if (opts.url) lines.push(`Link: ${opts.url}`)
  lines.push("", "Could you please share more details?")
  return lines.join("\n")
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Short human-readable code, e.g. "YR-7K3Q9P". Safe to generate client-side. */
export function generateEnquiryReference() {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return `YR-${Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("")}`
}
