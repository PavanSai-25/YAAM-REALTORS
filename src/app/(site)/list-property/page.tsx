import { Camera, ClipboardCheck, Megaphone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { EnquiryForm } from "@/components/shared/enquiry-form"
import { PageHero } from "@/components/shared/page-hero"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { getSiteSettings } from "@/lib/settings"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "List Your Property — Sell or Rent with Yaam",
  description: "Want to sell or rent out your home, plot or commercial space in Hyderabad or Secunderabad? List it with Yaam Realtors & Consultants.",
  alternates: { canonical: "/list-property" },
}

const STEPS = [
  { icon: ClipboardCheck, title: "Share the basics", body: "Location, type, size and your expected price or rent." },
  { icon: Camera, title: "Photos & details", body: "Send photos on WhatsApp, or we'll arrange to see the property." },
  { icon: Megaphone, title: "Go live", body: "Once reviewed, your listing is published on the Yaam website." },
]

export default async function ListPropertyPage() {
  const s = await getSiteSettings()
  const message = `Hi ${s.shortName}, I'd like to list my property.\n\nType:\nLocation:\nSize:\nExpected price / rent:\n\nI can share photos here.`
  return (
    <>
      <PageHero eyebrow="For owners" title="Sell or rent out your property with Yaam." description="Homes, plots, land and commercial spaces across Hyderabad and Secunderabad." image="/demo/villa-sainikpuri-1.jpg" />
      <section className="section-y">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_28rem] lg:gap-16">
          <div>
            <h2 className="section-title">How listing works</h2>
            <ol className="mt-10 space-y-8">
              {STEPS.map((st, i) => (
                <li key={st.title} className="flex gap-5">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <st.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink-muted tabular">Step {i + 1}</p>
                    <h3 className="mt-0.5 text-lg font-semibold">{st.title}</h3>
                    <p className="mt-1 text-ink-muted">{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-12 rounded-xl border border-line bg-canvas p-6">
              <h3 className="font-semibold">Quickest: send details on WhatsApp</h3>
              <p className="mt-1 text-sm text-ink-muted">We&apos;ll open a message with a short template for you to fill in.</p>
              <WhatsAppButton number={s.whatsappNumber} message={message} label="List via WhatsApp" className="mt-4" />
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              Have a seller account?{" "}
              <Link href="/admin/login" className="font-semibold text-brand hover:underline">
                Sign in to submit your listing
              </Link>
            </p>
          </div>
          <aside aria-labelledby="owner-form" className="self-start rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8 lg:sticky lg:top-24">
            <h2 id="owner-form" className="text-xl font-semibold">
              Or leave your details
            </h2>
            <p className="mt-1 text-sm text-ink-muted">We&apos;ll call you to discuss your property.</p>
            <EnquiryForm
              className="mt-6"
              source="list_property"
              whatsappNumber={s.whatsappNumber}
              whatsappMessage={message}
              submitLabel="Request a call"
              messagePlaceholder="e.g. 3 BHK independent house in Neredmet, want to sell"
            />
          </aside>
        </div>
      </section>
    </>
  )
}
