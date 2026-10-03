import { ArrowRight, Bath, BedDouble, Car, Check, Compass, ExternalLink, Layers, MapPin, Phone, PlayCircle, Ruler, Sofa } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PropertyCard } from "@/components/property/property-card"
import { PropertyGallery } from "@/components/property/property-gallery"
import { PropertyMap } from "@/components/property/property-map"
import { AvailabilityBadge, DemoBadge, FeaturedBadge, PurposeBadge, VerifiedBadge } from "@/components/property/status-badge"
import { JsonLd } from "@/components/seo/json-ld"
import { EnquiryForm } from "@/components/shared/enquiry-form"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import {
  AMENITY_LABELS,
  CATEGORY_LABELS,
  FACING_LABELS,
  FURNISHING_LABELS,
  POSSESSION_LABELS,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
} from "@/config/property-options"
import { absoluteUrl } from "@/config/site"
import { getPublicStore } from "@/lib/data"
import { formatArea, formatDate, formatLocation, formatNumber, formatPrice, propertyHeadline } from "@/lib/format"
import { breadcrumbJsonLd, propertyJsonLd, propertySeoDescription, propertySeoTitle } from "@/lib/seo/structured-data"
import { getSiteSettings } from "@/lib/settings"
import { generalEnquiryMessage, propertyEnquiryMessage, telUrl } from "@/lib/whatsapp"
import type { PublicProperty } from "@/types/domain"

export const revalidate = 300

// Render each listing on first request, then serve it from cache (ISR).
// Admin saves call revalidatePath, so edits show up immediately.
export async function generateStaticParams() {
  return []
}

async function load(slug: string) {
  return getPublicStore().properties.getBySlug(decodeURIComponent(slug))
}

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const [property, settings] = await Promise.all([load(slug), getSiteSettings()])
  if (!property) notFound()
  const title = propertySeoTitle(property)
  const description = propertySeoDescription(property, settings.companyName)
  const url = `/properties/${property.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${title} | Yaam Realtors`,
      description,
      url,
      images: property.coverImageUrl ? [{ url: absoluteUrl(property.coverImageUrl), alt: property.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: property.isDemo ? { index: false, follow: true } : undefined,
  }
}

function keyFacts(p: PublicProperty) {
  return [
    p.bedrooms ? { icon: BedDouble, label: "Bedrooms", value: `${p.bedrooms} BHK` } : null,
    p.bathrooms ? { icon: Bath, label: "Bathrooms", value: String(p.bathrooms) } : null,
    { icon: Ruler, label: "Area", value: formatArea(p.area, p.areaUnit) },
    p.parking ? { icon: Car, label: "Parking", value: String(p.parking) } : null,
    p.furnishing ? { icon: Sofa, label: "Furnishing", value: FURNISHING_LABELS[p.furnishing] } : null,
    p.facing ? { icon: Compass, label: "Facing", value: FACING_LABELS[p.facing] } : null,
    p.floor !== null && p.totalFloors
      ? { icon: Layers, label: "Floor", value: p.floor === 0 ? `Ground of ${p.totalFloors}` : `${p.floor} of ${p.totalFloors}` }
      : null,
  ].filter((f): f is { icon: typeof Ruler; label: string; value: string } => f !== null)
}

function specs(p: PublicProperty): [string, string][] {
  const rows: [string, string | null | undefined][] = [
    ["Purpose", PURPOSE_LABELS[p.purpose]],
    ["Category", CATEGORY_LABELS[p.category]],
    ["Property type", PROPERTY_TYPE_LABELS[p.propertyType]],
    ["Area", formatArea(p.area, p.areaUnit)],
    p.areaUnit !== "sqft" ? ["Area (sq.ft.)", `${formatNumber(p.areaSqft)} sq.ft.`] : ["", null],
    ["Bedrooms", p.bedrooms?.toString()],
    ["Bathrooms", p.bathrooms?.toString()],
    ["Parking", p.parking?.toString()],
    ["Furnishing", p.furnishing ? FURNISHING_LABELS[p.furnishing] : null],
    ["Floor", p.floor !== null ? (p.floor === 0 ? "Ground" : String(p.floor)) : null],
    ["Total floors", p.totalFloors?.toString()],
    ["Facing", p.facing ? FACING_LABELS[p.facing] : null],
    ["Built in", p.constructionYear?.toString()],
    ["Possession", p.possessionStatus ? POSSESSION_LABELS[p.possessionStatus] : null],
    ["Price negotiable", p.negotiable ? "Yes" : null],
    ["Listed on", formatDate(p.publishedAt ?? p.createdAt)],
    ...Object.entries(p.customFields),
  ]
  return rows.filter((r): r is [string, string] => !!r[0] && !!r[1])
}

export default async function PropertyPage({ params }: PageProps<"/properties/[slug]">) {
  const { slug } = await params
  const [property, settings] = await Promise.all([load(slug), getSiteSettings()])
  if (!property) notFound()
  const p = property
  const similar = await getPublicStore().properties.listSimilar(p, 3)

  const url = absoluteUrl(`/properties/${p.slug}`)
  const closed = p.status === "sold" || p.status === "rented"
  const message = closed
    ? `${generalEnquiryMessage(settings.shortName)} I saw "${p.title}" (now ${p.status}) and I'm looking for something similar.`
    : propertyEnquiryMessage(p, { url, companyShortName: settings.shortName })
  const facts = keyFacts(p)
  const typeHref = `/properties?category=${p.category}`

  const badges = (
    <>
      <PurposeBadge purpose={p.purpose} />
      {p.featured && !closed && <FeaturedBadge />}
      <AvailabilityBadge status={p.status} />
      {p.isDemo && <DemoBadge />}
    </>
  )

  return (
    <div className="pt-[4.25rem]">
      <div className="container-page pt-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/properties" className="hover:text-brand">
                Properties
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={typeHref} className="hover:text-brand">
                {CATEGORY_LABELS[p.category]}
              </Link>
            </li>
            <li aria-hidden className="hidden sm:inline">
              /
            </li>
            <li aria-current="page" className="hidden max-w-xs truncate text-ink-soft sm:inline">
              {p.title}
            </li>
          </ol>
        </nav>

        <PropertyGallery images={p.images} title={p.title} badges={badges} />

        {closed && (
          <div className="mt-6 rounded-xl border border-line bg-canvas px-5 py-4 text-sm text-ink-soft" role="status">
            This property has been <strong className="font-semibold text-ink">{p.status}</strong>. Talk to us about similar
            options in {p.locality}.
          </div>
        )}
      </div>

      <div className="container-page grid gap-10 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14 lg:pb-24 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <article className="min-w-0">
          <header>
            <p className="text-sm font-semibold text-brand">
              {propertyHeadline(p)} · {PURPOSE_LABELS[p.purpose]}
            </p>
            <h1 className="mt-2 text-[1.85rem] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[2.5rem]">{p.title}</h1>
            <p className="mt-3 flex items-start gap-1.5 text-ink-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden />
              {[p.address, formatLocation(p), p.pincode].filter(Boolean).join(", ")}
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
              <p className="text-3xl font-semibold tracking-tight text-navy-900 tabular sm:text-4xl">{formatPrice(p)}</p>
              {p.negotiable && <p className="pb-1 text-sm font-medium text-ink-muted">Negotiable</p>}
              {p.verified && <VerifiedBadge className="pb-1.5" />}
            </div>
          </header>

          <ul className="mt-8 grid grid-cols-2 overflow-hidden rounded-xl border border-line sm:grid-cols-3 xl:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <li key={label} className="-mr-px -mb-px flex items-center gap-3 border-r border-b border-line bg-white p-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Icon className="size-[1.15rem]" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-ink-muted">{label}</span>
                  <span className="block truncate text-[0.95rem] font-semibold text-ink tabular">{value}</span>
                </span>
              </li>
            ))}
          </ul>

          <section aria-labelledby="about-heading" className="mt-12">
            <h2 id="about-heading" className="text-xl font-semibold sm:text-2xl">
              About this property
            </h2>
            <div className="mt-4 space-y-4 text-[1.02rem] leading-relaxed text-ink-soft">
              {p.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {p.highlights.length > 0 && (
            <section aria-labelledby="highlights-heading" className="mt-12">
              <h2 id="highlights-heading" className="text-xl font-semibold sm:text-2xl">
                Highlights
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 rounded-lg bg-canvas px-4 py-3.5 text-ink-soft">
                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.amenities.length > 0 && (
            <section aria-labelledby="amenities-heading" className="mt-12">
              <h2 id="amenities-heading" className="text-xl font-semibold sm:text-2xl">
                Amenities
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {p.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2.5 text-ink-soft">
                    <Check className="size-4 shrink-0 text-brand-accent" aria-hidden />
                    {AMENITY_LABELS[a] ?? a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="specs-heading" className="mt-12">
            <h2 id="specs-heading" className="text-xl font-semibold sm:text-2xl">
              Specifications
            </h2>
            <dl className="mt-5 grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
              {specs(p).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line py-3.5 text-[0.95rem]">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {(p.videoUrl || p.virtualTourUrl) && (
            <section aria-labelledby="media-heading" className="mt-12">
              <h2 id="media-heading" className="text-xl font-semibold sm:text-2xl">
                Video &amp; virtual tour
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {p.videoUrl && (
                  <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand">
                    <PlayCircle className="size-4" aria-hidden /> Watch video
                  </a>
                )}
                {p.virtualTourUrl && (
                  <a href={p.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand">
                    <ExternalLink className="size-4" aria-hidden /> Open virtual tour
                  </a>
                )}
              </div>
            </section>
          )}

          <section aria-labelledby="location-heading" className="mt-12">
            <h2 id="location-heading" className="text-xl font-semibold sm:text-2xl">
              Location
            </h2>
            <div className="mt-5">
              {p.latitude !== null && p.longitude !== null ? (
                <PropertyMap latitude={p.latitude} longitude={p.longitude} precision={p.locationPrecision} label={formatLocation(p)} />
              ) : (
                <p className="rounded-xl bg-canvas px-5 py-4 text-ink-soft">
                  {formatLocation(p)}. Ask us for the exact location and directions.
                </p>
              )}
            </div>
            {p.nearbyLandmarks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-base font-semibold">Nearby</h3>
                <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                  {p.nearbyLandmarks.map((l) => (
                    <li key={l.name} className="flex items-center justify-between gap-4 px-4 py-3 text-[0.95rem]">
                      <span className="text-ink-soft">{l.name}</span>
                      <span className="font-medium text-ink tabular">{l.distance}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </article>

        {/* Enquiry panel — sticky on desktop */}
        <aside aria-labelledby="enquire-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{closed ? "Looking for similar?" : "Interested?"}</p>
            <h2 id="enquire-heading" className="mt-1.5 text-xl font-semibold">
              {closed ? "We can help you find one" : "Talk to Yaam about this property"}
            </h2>
            <div className="mt-5 grid gap-2.5">
              <WhatsAppButton number={settings.whatsappNumber} message={message} propertyId={p.id} size="lg" className="w-full" />
              <a
                href={telUrl(settings.phone)}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-line text-[0.95rem] font-semibold text-navy-900 transition-colors hover:border-brand hover:text-brand"
              >
                <Phone className="size-[1.1rem]" aria-hidden /> Call Yaam
              </a>
            </div>
            <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
              <span className="h-px flex-1 bg-line" />
              or request a callback
              <span className="h-px flex-1 bg-line" />
            </div>
            <EnquiryForm
              source="callback_form"
              propertyId={p.id}
              whatsappNumber={settings.whatsappNumber}
              whatsappMessage={message}
              messagePlaceholder="Preferred time for a call or site visit (optional)"
            />
          </div>
          <p className="mt-4 px-2 text-xs leading-relaxed text-ink-muted">
            {settings.companyName} · Est. {settings.establishedYear}
            {p.isDemo && " · This is a demo listing used to showcase the platform."}
          </p>
        </aside>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similar-heading" className="border-t border-line bg-canvas py-16 lg:py-20">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <h2 id="similar-heading" className="section-title">
                Similar properties
              </h2>
              <Link href={typeHref} className="group hidden items-center gap-1.5 text-sm font-semibold text-brand sm:inline-flex">
                View more <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <PropertyCard key={s.id} property={s} whatsappNumber={settings.whatsappNumber} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_auto] gap-2 border-t border-line bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <WhatsAppButton number={settings.whatsappNumber} message={message} propertyId={p.id} className="h-12 w-full" />
        <a
          href={telUrl(settings.phone)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line px-5 text-sm font-semibold text-navy-900"
        >
          <Phone className="size-4" aria-hidden /> Call
        </a>
      </div>

      <JsonLd data={propertyJsonLd(p, settings)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
          { name: CATEGORY_LABELS[p.category], path: typeHref },
          { name: p.title, path: `/properties/${p.slug}` },
        ])}
      />
    </div>
  )
}
