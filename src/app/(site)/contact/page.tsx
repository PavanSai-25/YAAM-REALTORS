import { Clock, Mail, MapPin, Phone } from "lucide-react"
import type { Metadata } from "next"
import { EnquiryForm } from "@/components/shared/enquiry-form"
import { WhatsAppIcon } from "@/components/shared/icons"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { getSiteSettings } from "@/lib/settings"
import { generalEnquiryMessage, telUrl } from "@/lib/whatsapp"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Contact Yaam Realtors — WhatsApp, Call or Visit in Sainikpuri",
  description: "Contact Yaam Realtors & Consultants on WhatsApp or phone, or visit our office at G.K. Enclave, Defence Colony, Sainikpuri, Secunderabad.",
  alternates: { canonical: "/contact" },
}

export default async function ContactPage() {
  const s = await getSiteSettings()
  const message = generalEnquiryMessage(s.shortName)
  return (
    <div className="bg-canvas pt-[4.25rem]">
      <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_28rem] lg:gap-16">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="display mt-4 max-w-xl">Let&apos;s talk property.</h1>
          <p className="mt-5 max-w-lg text-lg text-ink-muted">WhatsApp is the fastest way to reach us. You can also call, visit the office, or leave your number and we&apos;ll call you back.</p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            <li className="rounded-xl border border-line bg-white p-6">
              <WhatsAppIcon className="size-6 text-whatsapp" />
              <h2 className="mt-4 font-semibold">WhatsApp</h2>
              <p className="mt-1 text-sm text-ink-muted">Send us a message any time.</p>
              <WhatsAppButton number={s.whatsappNumber} message={message} label="Start a chat" size="sm" className="mt-4" />
            </li>
            <li className="rounded-xl border border-line bg-white p-6">
              <Phone className="size-6 text-brand" aria-hidden />
              <h2 className="mt-4 font-semibold">Phone{s.contactPerson && ` · ${s.contactPerson}`}</h2>
              <a href={telUrl(s.phone)} className="mt-1 block text-lg font-semibold text-navy-900 tabular hover:text-brand">
                {s.phone}
              </a>
              {s.businessHours && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-muted">
                  <Clock className="size-3.5" aria-hidden /> {s.businessHours}
                </p>
              )}
            </li>
            <li className="rounded-xl border border-line bg-white p-6 sm:col-span-2">
              <MapPin className="size-6 text-brand" aria-hidden />
              <h2 className="mt-4 font-semibold">Office</h2>
              <address className="mt-1 text-ink-soft not-italic">
                {s.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </address>
              <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                Open in Google Maps →
              </a>
            </li>
            {s.email && (
              <li className="rounded-xl border border-line bg-white p-6 sm:col-span-2">
                <Mail className="size-6 text-brand" aria-hidden />
                <h2 className="mt-4 font-semibold">Email</h2>
                <a href={`mailto:${s.email}`} className="mt-1 block text-brand hover:underline">
                  {s.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <aside className="self-start rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8 lg:sticky lg:top-24" aria-labelledby="callback-title">
          <h2 id="callback-title" className="text-xl font-semibold">
            Request a callback
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Tell us what you&apos;re looking for.</p>
          <EnquiryForm
            className="mt-6"
            source="contact_form"
            showEmail
            whatsappNumber={s.whatsappNumber}
            whatsappMessage={message}
            submitLabel="Send"
            messagePlaceholder="e.g. Looking for a 3 BHK to rent near Sainikpuri, budget ₹30,000"
          />
        </aside>
      </div>
    </div>
  )
}
