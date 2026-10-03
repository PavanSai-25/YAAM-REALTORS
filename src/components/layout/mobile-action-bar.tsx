"use client"

import { Building2, Phone, Search } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { telUrl } from "@/lib/whatsapp"

/**
 * Sticky bottom bar on phones. Property detail pages render their own
 * [WhatsApp][Call] bar with property context, so this one hides there.
 */
export function MobileActionBar({
  whatsappNumber,
  whatsappMessage,
  phone,
}: {
  whatsappNumber: string
  whatsappMessage: string
  phone: string
}) {
  const pathname = usePathname()
  if (/^\/properties\/[^/]+/.test(pathname)) return null

  const item = "flex flex-1 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-ink-soft"
  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="flex h-16 items-stretch">
        <Link href="/properties" className={item}>
          <Search className="size-5" aria-hidden />
          Search
        </Link>
        <Link href="/properties?sort=featured" className={item}>
          <Building2 className="size-5" aria-hidden />
          Properties
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <WhatsAppButton number={whatsappNumber} message={whatsappMessage} label="WhatsApp" size="sm" className="h-10 rounded-full px-4" />
        </div>
        <a href={telUrl(phone)} className={item}>
          <Phone className="size-5" aria-hidden />
          Call
        </a>
      </div>
    </nav>
  )
}
