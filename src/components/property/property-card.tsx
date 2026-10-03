import { ArrowRight, Bath, BedDouble, MapPin, Ruler } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PROPERTY_TYPE_LABELS } from "@/config/property-options"
import { absoluteUrl } from "@/config/site"
import { formatArea, formatLocation, formatPrice, propertyHeadline } from "@/lib/format"
import { cn } from "@/lib/utils"
import { propertyEnquiryMessage } from "@/lib/whatsapp"
import type { PublicProperty } from "@/types/domain"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { AvailabilityBadge, DemoBadge, FeaturedBadge, PurposeBadge } from "./status-badge"

export function PropertyCard({
  property: p,
  whatsappNumber,
  priority = false,
  className,
}: {
  property: PublicProperty
  whatsappNumber: string
  priority?: boolean
  className?: string
}) {
  const href = `/properties/${p.slug}`
  const facts = [
    p.bedrooms ? { icon: BedDouble, label: `${p.bedrooms} ${p.bedrooms === 1 ? "Bed" : "Beds"}` } : null,
    p.bathrooms ? { icon: Bath, label: `${p.bathrooms} ${p.bathrooms === 1 ? "Bath" : "Baths"}` } : null,
    { icon: Ruler, label: formatArea(p.area, p.areaUnit) },
  ].filter((f): f is { icon: typeof Ruler; label: string } => f !== null)
  const closed = p.status === "sold" || p.status === "rented"

  return (
    <article
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-xl border border-line/80 bg-white shadow-card transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:border-line hover:shadow-lift motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-canvas">
        {p.coverImageUrl ? (
          <Image
            src={p.coverImageUrl}
            alt={p.images[0]?.alt || p.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            className={cn(
              "object-cover transition-transform duration-[900ms] ease-[var(--ease-out-quint)] group-hover/card:scale-[1.045] motion-reduce:group-hover/card:scale-100",
              closed && "grayscale-[35%]",
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">Photos coming soon</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <PurposeBadge purpose={p.purpose} />
          {p.featured && !closed && <FeaturedBadge />}
          <AvailabilityBadge status={p.status} />
        </div>
        {p.isDemo && <DemoBadge className="absolute top-3 right-3" />}
        {p.images.length > 1 && (
          <span className="absolute right-3 bottom-3 rounded-md bg-black/55 px-2 py-1 text-[0.7rem] font-medium text-white backdrop-blur-sm tabular">
            {p.images.length} photos
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[1.35rem] font-semibold tracking-tight text-navy-900 tabular">{formatPrice(p)}</p>
          <p className="truncate text-xs font-medium text-ink-muted">{PROPERTY_TYPE_LABELS[p.propertyType]}</p>
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[0.98rem] leading-snug font-semibold text-ink">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:underline">
            {p.title}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
          <MapPin className="size-3.5 shrink-0 text-brand-accent" aria-hidden />
          <span className="truncate">{formatLocation(p)}</span>
        </p>

        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/70 pt-4 text-[0.82rem] text-ink-soft">
          {facts.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5 tabular">
              <Icon className="size-4 text-ink-muted" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            View Details
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover/card:translate-x-1 motion-reduce:group-hover/card:translate-x-0"
              aria-hidden
            />
          </span>
          {!closed && (
            <WhatsAppButton
              number={whatsappNumber}
              message={propertyEnquiryMessage(p, { url: absoluteUrl(href) })}
              propertyId={p.id}
              size="icon"
              variant="outline"
              label={`Ask about ${propertyHeadline(p)} in ${p.locality} on WhatsApp`}
              className="relative z-[2] size-9"
            />
          )}
        </div>
      </div>
    </article>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line/80 bg-white" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-canvas" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-1/3 animate-pulse rounded bg-canvas" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-canvas" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-canvas" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-canvas" />
      </div>
    </div>
  )
}
