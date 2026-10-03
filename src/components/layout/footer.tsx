import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"
import { WhatsAppIcon } from "@/components/shared/icons"
import { Logo } from "@/components/shared/logo"
import { telUrl, whatsappUrl, generalEnquiryMessage } from "@/lib/whatsapp"
import type { SiteSettings } from "@/types/domain"

const COLUMNS = [
  {
    title: "Properties",
    links: [
      { href: "/properties?purpose=sale", label: "Buy" },
      { href: "/properties?purpose=rent", label: "Rent" },
      { href: "/properties?category=commercial", label: "Commercial" },
      { href: "/properties?category=land", label: "Plots & Land" },
      { href: "/list-property", label: "List a property" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/services", label: "Services" },
      { href: "/about", label: "About Yaam" },
      { href: "/contact", label: "Contact" },
    ],
  },
]

export function Footer({ settings }: { settings: SiteSettings }) {
  const socials = Object.entries(settings.socials).filter(([, url]) => url)
  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="container-page grid gap-12 pt-16 pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr] lg:gap-10 lg:pt-20">
        <div className="max-w-sm">
          <Logo tone="light" />
          <p className="mt-5 text-sm leading-relaxed">
            {settings.companyName}. Buying, selling, rentals, construction, housing loans and property care across
            Hyderabad and Secunderabad.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="size-1.5 rounded-full bg-brand-cyan" aria-hidden />
            Established {settings.establishedYear}
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs font-semibold tracking-[0.16em] text-white uppercase">{col.title}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-xs font-semibold tracking-[0.16em] text-white uppercase">Contact</h2>
          <ul className="mt-5 space-y-4 text-sm">
            <li>
              <a
                href={whatsappUrl(settings.whatsappNumber, generalEnquiryMessage(settings.shortName))}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 hover:text-white"
              >
                <WhatsAppIcon className="mt-0.5 size-4 text-[#4ade80]" />
                <span>WhatsApp {settings.contactPerson && `· ${settings.contactPerson}`}</span>
              </a>
            </li>
            <li>
              <a href={telUrl(settings.phone)} className="flex items-start gap-3 hover:text-white">
                <Phone className="mt-0.5 size-4 text-brand-cyan" aria-hidden />
                <span className="tabular">{settings.phone}</span>
              </a>
            </li>
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-start gap-3 hover:text-white">
                  <Mail className="mt-0.5 size-4 text-brand-cyan" aria-hidden />
                  <span>{settings.email}</span>
                </a>
              </li>
            )}
            <li>
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-white"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-cyan" aria-hidden />
                <address className="not-italic leading-relaxed">
                  {settings.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </a>
            </li>
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs capitalize hover:border-white/40 hover:text-white"
                  >
                    {name} <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
          </p>
          <p>Listings marked “Demo” are sample data for presentation purposes.</p>
        </div>
      </div>
    </footer>
  )
}
