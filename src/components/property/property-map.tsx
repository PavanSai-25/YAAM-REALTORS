import { ExternalLink, MapPin } from "lucide-react"
import type { LocationPrecision } from "@/config/property-options"

/**
 * Provider-agnostic location map.
 *  - Google Maps Embed API when NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY is set
 *  - OpenStreetMap embed otherwise (no key needed)
 *
 * Approximate locations: coordinates are already rounded server-side
 * (toPublicProperty), no marker is drawn and the view is zoomed out with a
 * shaded "approximate area" circle.
 */
export function PropertyMap({
  latitude,
  longitude,
  precision,
  label,
}: {
  latitude: number
  longitude: number
  precision: LocationPrecision
  label: string
}) {
  const approx = precision === "approximate"
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
  const delta = approx ? 0.03 : 0.008
  const bbox = [longitude - delta, latitude - delta * 0.6, longitude + delta, latitude + delta * 0.6].map((n) => n.toFixed(5)).join(",")

  const src = googleKey
    ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(googleKey)}&center=${latitude},${longitude}&zoom=${approx ? 14 : 16}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${approx ? "" : `&marker=${latitude},${longitude}`}`

  const external = approx
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`
    : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-canvas sm:aspect-[16/8]">
        <iframe
          title={`Map showing ${approx ? "the approximate area of" : "the location of"} ${label}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
        />
        {approx && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="size-40 rounded-full border-2 border-brand/60 bg-brand/15 sm:size-56" />
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="inline-flex items-center gap-1.5 text-ink-muted">
          <MapPin className="size-4 text-brand-accent" aria-hidden />
          {approx ? "Approximate area shown. Exact location is shared on enquiry." : label}
        </p>
        <a href={external} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
          Open in Google Maps <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </div>
  )
}
