import { ArrowRight, ArrowUpRight, CalendarCheck2, MapPinned } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { HeroParallax } from "@/components/home/hero-parallax"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { PropertyCard } from "@/components/property/property-card"
import { HeroSearch } from "@/components/search/hero-search"
import { EmptyState } from "@/components/shared/empty-state"
import { SectionHeading } from "@/components/shared/section-heading"
import { serviceIcon } from "@/components/shared/service-icon"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { getPublicStore } from "@/lib/data"
import { pluralize } from "@/lib/format"
import { getSiteSettings } from "@/lib/settings"
import { generalEnquiryMessage } from "@/lib/whatsapp"

export const revalidate = 300

export default async function HomePage() {
  const store = getPublicStore()
  const [settings, featured, counts, localities] = await Promise.all([
    getSiteSettings(),
    store.properties.listFeatured(6),
    store.properties.categoryCounts(),
    store.properties.listLocalities(),
  ])
  const suggestions = [...new Set([...localities, ...settings.serviceAreas])].sort()
  const years = new Date().getFullYear() - settings.establishedYear

  const categories = [
    { title: "Residential", blurb: "Apartments, villas & independent houses", href: "/properties?category=residential", image: "/demo/cat-residential.jpg", count: counts.residential },
    { title: "Commercial", blurb: "Offices, shops & warehouses", href: "/properties?category=commercial", image: "/demo/cat-commercial.jpg", count: counts.commercial },
    { title: "Plots & Land", blurb: "Open plots & agricultural land", href: "/properties?category=land", image: "/demo/cat-land.jpg", count: counts.land },
    { title: "Rental Properties", blurb: "Homes and spaces to lease", href: "/properties?purpose=rent", image: "/demo/cat-rental.jpg", count: counts.rent },
  ]

  const reasons = [
    { title: `Established ${settings.establishedYear}`, body: `${years}+ years of helping people buy, sell and rent property in Secunderabad.` },
    { title: "Local market knowledge", body: "Based in Defence Colony, Sainikpuri — close to the neighbourhoods we work in." },
    { title: "Buying & selling", body: "Support from the first shortlist to the final registration." },
    { title: "Rental assistance", body: "For tenants looking for a home and owners looking for tenants." },
    { title: "Construction & development", body: "Building on your land, or developing a project with you." },
    { title: "Property care", body: "Someone local to look after your property when you can't." },
  ]

  const steps = [
    { title: "Search", body: "Filter by location, budget and size." },
    { title: "Explore", body: "Photos, specs and location for every listing." },
    { title: "Enquire", body: "One tap sends the property details to us." },
    { title: "Connect on WhatsApp", body: "Talk directly with the Yaam team." },
    { title: "Close the deal", body: "Site visits, negotiation and paperwork, together." },
  ]

  return (
    <>
      {/* HERO */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-visible bg-navy-950">
        <HeroParallax src="/demo/hero-villa-dusk.jpg" videoSrc="/demo/hero-properties-flow.mp4" alt="" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(4_17_46/0.88)_0%,rgb(4_17_46/0.55)_45%,rgb(4_17_46/0.1)_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-950/80 to-transparent" />

        <div className="container-page relative flex flex-1 flex-col justify-end pt-32 pb-10 sm:pb-14 lg:pb-16">
          <div className="max-w-3xl">
            <p className="rise inline-flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.2em] text-brand-cyan uppercase">
              <span className="h-px w-8 bg-brand-cyan/70" aria-hidden />
              Since {settings.establishedYear} · Secunderabad
            </p>
            <h1 id="hero-title" className="display rise mt-5 text-white [animation-delay:80ms]">
              {settings.heroHeadline}
            </h1>
            <p className="rise mt-5 max-w-xl text-base leading-relaxed text-white/80 [animation-delay:160ms] sm:text-lg">
              {settings.heroDescription}
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
              <Link
                href="/properties"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-navy-900 transition-colors hover:bg-brand-light"
              >
                Explore Properties
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/list-property"
                className="inline-flex h-12 items-center rounded-lg border border-white/30 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                List a Property
              </Link>
            </div>
          </div>

          <div className="rise mt-12 max-w-5xl [animation-delay:340ms] lg:mt-16">
            <HeroSearch localities={suggestions} />
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section aria-labelledby="featured-title" className="section-y">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              id="featured-title"
              eyebrow="Featured properties"
              title="Hand-picked homes and spaces"
              description="A selection of listings currently available through Yaam."
              action={
                <Link href="/properties" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  View all properties
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              }
            />
          </Reveal>
          {featured.length ? (
            <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {featured.map((p) => (
                <StaggerItem key={p.id}>
                  <PropertyCard property={p} whatsappNumber={settings.whatsappNumber} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <EmptyState
              className="mt-12"
              title="New listings are on their way"
              description="Tell us what you're looking for and we'll share matching properties on WhatsApp."
            />
          )}
        </div>
      </section>

      {/* BROWSE BY TYPE */}
      <section aria-labelledby="browse-title" className="bg-canvas section-y">
        <div className="container-page">
          <Reveal>
            <SectionHeading id="browse-title" eyebrow="Browse by property type" title="Start with what you need" />
          </Reveal>
          <Stagger className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {categories.map((c, i) => (
              <StaggerItem key={c.title} className={i === 0 ? "col-span-2 lg:col-span-1" : ""}>
                <Link
                  href={c.href}
                  className="group/cat relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl bg-navy-900 p-4 sm:p-6 max-lg:first:aspect-[16/10]"
                >
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-quint)] group-hover/cat:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
                  <div className="relative">
                    <p className="text-xs font-medium text-white/70 tabular">{pluralize(c.count, "listing")}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white sm:text-2xl">{c.title}</h3>
                    <p className="mt-1 hidden text-sm text-white/70 sm:block">{c.blurb}</p>
                    <span className="mt-4 inline-flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors group-hover/cat:bg-white group-hover/cat:text-navy-900">
                      <ArrowUpRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* WHY YAAM */}
      <section aria-labelledby="why-title" className="section-y">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Why Yaam</p>
            <h2 id="why-title" className="section-title mt-3">
              A local firm that has been doing this since {settings.establishedYear}.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">{settings.aboutIntro}</p>
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-xl">
              <Image src="/demo/services-planning.jpg" alt="Reviewing building plans" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <ol className="divide-y divide-line border-y border-line">
            {reasons.map((r, i) => (
              <li key={r.title}>
                <Reveal delay={i * 0.04} className="grid grid-cols-[3rem_1fr] gap-4 py-7 sm:grid-cols-[4rem_1fr]">
                  <span className="text-sm font-semibold text-brand tabular">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg font-semibold sm:text-xl">{r.title}</h3>
                    <p className="mt-1.5 text-ink-muted">{r.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section aria-labelledby="how-title" className="bg-canvas section-y">
        <div className="container-page">
          <Reveal>
            <SectionHeading id="how-title" eyebrow="How it works" title="From search to keys in five steps" />
          </Reveal>
          <Stagger className="relative mt-14 grid gap-8 md:grid-cols-5 md:gap-6" stagger={0.1}>
            <div className="absolute top-5 right-[10%] left-[10%] hidden h-px bg-line md:block" aria-hidden />
            {steps.map((s, i) => (
              <StaggerItem key={s.title} className="relative flex gap-4 md:flex-col md:items-start">
                <span
                  className={`relative z-[1] inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular ring-4 ring-canvas ${
                    i === 3 ? "bg-whatsapp text-white" : "bg-navy-900 text-white"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* SERVICES */}
      <section aria-labelledby="services-title" className="relative overflow-hidden bg-navy-950 section-y">
        <div className="container-page relative">
          <Reveal>
            <SectionHeading
              id="services-title"
              tone="light"
              eyebrow="Services"
              title="Everything around your property, under one roof"
              action={
                <Link href="/services" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  All services
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              }
            />
          </Reveal>
          <Stagger className="mt-14 grid border-t border-l border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {settings.services.map((s) => {
              const Icon = serviceIcon(s.title)
              return (
                <StaggerItem key={s.title} className="group/svc border-r border-b border-white/10 p-7 transition-colors hover:bg-white/[0.03] sm:p-9">
                  <Icon className="size-6 text-brand-cyan" aria-hidden />
                  <h3 className="mt-6 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{s.description}</p>
                </StaggerItem>
              )
            })}
          </Stagger>
        </div>
      </section>

      {/* LOCAL EXPERTISE */}
      <section aria-labelledby="local-title" className="section-y">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Local expertise</p>
            <h2 id="local-title" className="section-title mt-3">
              Rooted in Sainikpuri. Working across Hyderabad &amp; Secunderabad.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              Our office is on Main Road, Defence Colony, Sainikpuri. These are the areas we work in most — tap one to
              see what&apos;s available there.
            </p>
            <a
              href={settings.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand"
            >
              <MapPinned className="size-4" aria-hidden /> Get directions to our office
            </a>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="flex flex-wrap gap-3">
              {settings.serviceAreas.map((area) => (
                <li key={area}>
                  <Link
                    href={`/properties?location=${encodeURIComponent(area)}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-[0.95rem] font-medium text-ink transition-colors hover:border-brand hover:bg-brand-light hover:text-navy-900"
                  >
                    {area}
                    <ArrowUpRight className="size-3.5 text-ink-muted transition-colors group-hover:text-brand" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-title" className="pb-16 sm:pb-20 lg:pb-28">
        <div className="container-page">
          <Reveal className="relative isolate overflow-hidden rounded-2xl bg-navy-900 px-6 py-14 sm:px-12 sm:py-20 lg:px-16">
            <Image src="/demo/villa-kompally-2.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-900/40" />
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-brand-cyan uppercase">
                <CalendarCheck2 className="size-4" aria-hidden /> We reply on WhatsApp
              </p>
              <h2 id="cta-title" className="section-title mt-4 text-white">
                Looking for a property?
              </h2>
              <p className="mt-4 text-lg text-white/75">Tell us what you&apos;re looking for and we&apos;ll help you find it.</p>
              <WhatsAppButton
                number={settings.whatsappNumber}
                message={generalEnquiryMessage(settings.shortName)}
                label="Chat with Yaam on WhatsApp"
                size="lg"
                className="mt-8"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
