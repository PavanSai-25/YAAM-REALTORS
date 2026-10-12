"use client"

import { Menu, Phone, Search, X } from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/shared/logo"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { cn } from "@/lib/utils"
import { telUrl } from "@/lib/whatsapp"

export const NAV_LINKS = [
  { href: "/properties?purpose=sale", label: "Buy" },
  { href: "/properties?purpose=rent", label: "Rent" },
  { href: "/properties?category=commercial", label: "Commercial" },
  { href: "/properties?category=land", label: "Land" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
] as const

type Contact = { whatsappNumber: string; phone: string; whatsappMessage: string }

export function Navbar({ contact }: { contact: Contact }) {
  const pathname = usePathname()
  const overlay = pathname === "/"
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const solid = !overlay || scrolled || open

  // Query-string links (Buy/Rent/…) aren't highlighted: the listings page
  // shows its own purpose tabs, and reading search params here would opt
  // every static page out of prerendering.
  function isActive(link: (typeof NAV_LINKS)[number]) {
    return !link.href.includes("?") && pathname.startsWith(link.href)
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
        solid
          ? "border-b border-line/80 bg-white/95 shadow-[0_1px_0_rgb(16_24_40/0.02)] backdrop-blur-md supports-[backdrop-filter]:bg-white/85"
          : "border-b border-transparent bg-gradient-to-b from-black/35 to-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-white px-3 py-2 text-sm font-medium text-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <nav aria-label="Primary" className="container-page flex h-[4.25rem] items-center gap-6">
        <Link href="/" aria-label="YAAM Realtors — home" className="shrink-0 rounded-md">
          <Logo tone={solid ? "dark" : "light"} />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-[0.9rem] font-medium transition-colors",
                    solid ? "text-ink-soft hover:text-brand" : "text-white/85 hover:text-white",
                    active && (solid ? "text-brand" : "text-white"),
                  )}
                >
                  {link.label}
                  {active && (
                    <m.span
                      layoutId="nav-underline"
                      className={cn("absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full", solid ? "bg-brand" : "bg-white")}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/properties"
            aria-label="Search properties"
            className={cn(
              "hidden size-10 items-center justify-center rounded-full transition-colors sm:inline-flex",
              solid ? "text-ink-soft hover:bg-canvas hover:text-brand" : "text-white hover:bg-white/10",
            )}
          >
            <Search className="size-[1.15rem]" />
          </Link>
          <Link
            href="/list-property"
            className={cn(
              "hidden h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors md:inline-flex",
              solid
                ? "border border-line text-navy-900 hover:border-brand/40 hover:text-brand"
                : "border border-white/30 text-white hover:bg-white/10",
            )}
          >
            List Property
          </Link>
          <WhatsAppButton
            number={contact.whatsappNumber}
            message={contact.whatsappMessage}
            label="WhatsApp"
            size="sm"
            className="hidden h-10 px-4 sm:inline-flex"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full lg:hidden",
              solid ? "text-navy-900 hover:bg-canvas" : "text-white hover:bg-white/10",
            )}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-line bg-white lg:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-6">
              {NAV_LINKS.map((link, i) => (
                <m.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-line/70 py-4 text-xl font-semibold tracking-tight text-navy-900"
                  >
                    {link.label}
                  </Link>
                </m.div>
              ))}
              <div className="mt-6 grid gap-3">
                <Link
                  href="/list-property"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-line font-semibold text-navy-900"
                >
                  List your property
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={telUrl(contact.phone)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-navy-900 font-semibold text-white"
                  >
                    <Phone className="size-4" /> Call
                  </a>
                  <WhatsAppButton
                    number={contact.whatsappNumber}
                    message={contact.whatsappMessage}
                    label="WhatsApp"
                    className="h-12"
                  />
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  )
}
