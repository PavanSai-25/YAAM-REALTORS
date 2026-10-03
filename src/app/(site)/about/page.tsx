import { MapPin, Phone } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Reveal } from "@/components/motion/reveal"
import { PageHero } from "@/components/shared/page-hero"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { getSiteSettings } from "@/lib/settings"
import { generalEnquiryMessage, telUrl } from "@/lib/whatsapp"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "About Yaam Realtors & Consultants — Since 2006, Sainikpuri",
  description: "Yaam Realtors & Consultants has served property buyers, sellers, tenants and owners in Secunderabad since 2006, from its office in Defence Colony, Sainikpuri.",
  alternates: { canonical: "/about" },
}

export default async function AboutPage() {
  const s = await getSiteSettings()
  const years = new Date().getFullYear() - s.establishedYear
  return (
    <>
      <PageHero eyebrow="About Yaam" title={`A Secunderabad property firm, since ${s.establishedYear}.`} description={s.aboutIntro} image="/demo/house-defence-colony-1.jpg" />

      <section className="section-y">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">Who we are</p>
            <h2 className="section-title mt-3">One local team for buying, selling, renting and building.</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-muted">
              <p>
                {s.companyName} was established in {s.establishedYear}. For {years} years we have worked with people buying and selling homes, plots and
                commercial spaces, landlords and tenants looking for the right match, and owners who want their property looked after.
              </p>
              <p>
                Alongside brokerage, we take on construction and development work and help clients arrange housing loans — so a purchase, a build or a rental can
                be handled in one place.
              </p>
              {s.contactPerson && <p>You&apos;ll usually speak with {s.contactPerson} directly.</p>}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:aspect-auto">
            <Image src="/demo/villa-sainikpuri-2.jpg" alt="Bright, furnished living room" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>

      <section className="bg-canvas section-y">
        <div className="container-page">
          <h2 className="section-title">What we do</h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {s.services.map((svc) => (
              <li key={svc.title} className="bg-white p-6 sm:p-8">
                <h3 className="text-lg font-semibold">{svc.title}</h3>
                <p className="mt-2 text-ink-muted">{svc.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Visit us</p>
            <h2 className="section-title mt-3">Our office</h2>
            <address className="mt-6 flex gap-3 text-lg leading-relaxed text-ink-soft not-italic">
              <MapPin className="mt-1.5 size-5 shrink-0 text-brand-accent" aria-hidden />
              <span>
                {s.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </span>
            </address>
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppButton number={s.whatsappNumber} message={generalEnquiryMessage(s.shortName)} size="lg" />
              <a href={telUrl(s.phone)} className="inline-flex h-13 items-center gap-2 rounded-xl border border-line px-6 text-[0.95rem] font-semibold text-navy-900 hover:border-brand hover:text-brand">
                <Phone className="size-[1.1rem]" aria-hidden /> {s.phone}
              </a>
            </div>
            <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
              Get directions in Google Maps →
            </a>
          </div>
          <div className="rounded-2xl bg-navy-950 p-8 text-white sm:p-12">
            <p className="text-sm text-white/60">Established</p>
            <p className="mt-1 text-6xl font-semibold tracking-tight tabular">{s.establishedYear}</p>
            <p className="mt-8 text-sm text-white/60">Areas we work in</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {s.serviceAreas.map((a) => (
                <li key={a}>
                  <Link href={`/properties?location=${encodeURIComponent(a)}`} className="inline-flex rounded-full border border-white/15 px-3 py-1.5 text-sm hover:border-white/40">
                    {a}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
