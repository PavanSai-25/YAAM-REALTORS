"use client"

import {
  Building2,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  Menu,
  PlusSquare,
  Settings,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/shared/logo"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { Role } from "@/config/property-options"
import { cn } from "@/lib/utils"
import { ADMIN_NAV } from "./nav"

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  properties: Building2,
  add: PlusSquare,
  enquiries: Inbox,
  sellers: UserCheck,
  staff: Users,
  settings: Settings,
}

function NavList({ role, counts, onNavigate }: { role: Role; counts: Record<string, number>; onNavigate?: () => void }) {
  const pathname = usePathname()
  const items = ADMIN_NAV.filter((i) => i.roles.includes(role))
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon]
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const label = role === "seller" && item.href === "/admin/properties" ? "My Submissions" : role === "seller" && item.icon === "add" ? "Submit Property" : item.label
        const count = counts[item.href]
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("size-[1.1rem]", active ? "text-brand-cyan" : "text-sidebar-foreground/70")} aria-hidden />
              <span className="flex-1">{label}</span>
              {count ? (
                <span className="rounded-full bg-brand-accent px-1.5 py-0.5 text-[0.65rem] font-bold text-white tabular">{count}</span>
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function SidebarBody({ role, counts, onNavigate }: { role: Role; counts: Record<string, number>; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link href="/admin" onClick={onNavigate}>
          <Logo tone="light" />
        </Link>
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-2">
        <NavList role={role} counts={counts} onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          target="_blank"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-[1.1rem] opacity-70" aria-hidden /> View website
        </Link>
      </div>
    </div>
  )
}

export function AdminSidebar({ role, counts }: { role: Role; counts: Record<string, number> }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">
      <SidebarBody role={role} counts={counts} />
    </aside>
  )
}

export function AdminMobileNav({ role, counts }: { role: Role; counts: Record<string, number> }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="inline-flex size-10 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0 text-sidebar-foreground" showCloseButton={false}>
        <SheetTitle className="sr-only">Admin navigation</SheetTitle>
        <SheetDescription className="sr-only">Links to admin sections</SheetDescription>
        <SidebarBody role={role} counts={counts} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
