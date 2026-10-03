import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Reveal } from "@/components/motion/reveal"
import { PageHero } from "@/components/shared/page-hero"
import { serviceIcon } from "@/components/shared/service-icon"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { getSiteSettings } from "@/lib/settings"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Services — Buying, Selling, Rentals, Construction, Loans & Property Care",
  description:
    "Property buying, selling, rentals, construction & developments, housing loans and property care taking in Hyderabad and Secunderabad from Yaam Realtors & Consultants.",
  alternates: { canonical: "/services" },
}

const LINKS: Record<string, string> = {
  buy: "/properties?purpose=sale",
  sell: "/list-property",
  rent: "/properties?purpose=rent",
}

export default async function ServicesPage() {
  const settings = await getSiteSettings()
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Everything around your property, under one roof."
        description={`From finding a home to building one — ${settings.companyName} has supported property owners and buyers since ${settings.establishedYear}.`}
        image="/demo/services-construction.jpg"
      />

      <section className="section-y">
        <div className="container-page">
          <ol className="divide-y divide-line border-y border-line">
            {settings.services.map((s, i) => {
              const Icon = serviceIcon(s.title)
              const key = Object.keys(LINKS).find((k) => s.title.toLowerCase().includes(k))
              return (
                <li key={s.title}>
                  <Reveal className="grid gap-6 py-10 md:grid-cols-[5rem_1fr_auto] md:items-center md:gap-10 lg:py-12">
                    <span className="inline-flex size-14 items-center justify-center rounded-xl bg-brand-light text-brand">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <div className="max-w-2xl">
                      <p className="text-xs font-semibold text-ink-muted tabular">{String(i + 1).padStart(2, "0")}</p>
                      <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{s.title}</h2>
                      <p className="mt-3 text-lg leading-relaxed text-ink-muted">{s.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      {key && (
                        <Link href={LINKS[key]} className="group inline-flex h-11 items-center gap-1.5 rounded-lg border border-line px-4 text-sm font-semibold text-navy-900 hover:border-brand hover:text-brand">
                          {key === "sell" ? "List your property" : "Browse listings"}
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      )}
                      <WhatsAppButton
                        number={settings.whatsappNumber}
                        message={`Hi ${settings.shortName}, I'd like to know more about your ${s.title.toLowerCase()} service.`}
                        label="Ask on WhatsApp"
                        variant="outline"
                      />
                    </div>
                  </Reveal>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="pb-20 lg:pb-28">
        <div className="container-page grid items-center gap-10 overflow-hidden rounded-2xl bg-canvas lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <h2 className="section-title">Not sure where to start?</h2>
            <p className="mt-4 text-lg text-ink-muted">Tell us what you&apos;re planning — buying, selling, renting or building — and we&apos;ll take it from there.</p>
            <WhatsAppButton number={settings.whatsappNumber} message={`Hi ${settings.shortName}, I need help with a property.`} label="Chat with Yaam on WhatsApp" size="lg" className="mt-8" />
          </div>
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-80">
            <Image src="/demo/services-planning.jpg" alt="Reviewing building plans" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>
    </>
  )
}
