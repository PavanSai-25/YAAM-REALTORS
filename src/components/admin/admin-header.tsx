import { Bell, LogOut, Search } from "lucide-react"
import Link from "next/link"
import { logoutAction } from "@/app/actions/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ENQUIRY_SOURCE_LABELS, ROLE_LABELS, type Role } from "@/config/property-options"
import { formatRelative } from "@/lib/format"
import type { Enquiry, SessionUser } from "@/types/domain"
import { AdminMobileNav } from "./admin-sidebar"

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AdminHeader({
  user,
  newEnquiries,
  counts,
}: {
  user: SessionUser
  newEnquiries: Enquiry[] | null
  counts: Record<string, number>
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <AdminMobileNav role={user.role as Role} counts={counts} />
      <form action="/admin/properties" role="search" className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <label htmlFor="admin-search" className="sr-only">
          Search properties
        </label>
        <input
          id="admin-search"
          name="q"
          type="search"
          placeholder="Search properties by title, locality…"
          className="h-10 w-full rounded-lg border border-line bg-canvas pr-3 pl-9 text-sm outline-none focus:border-brand-accent focus:bg-white focus:ring-3 focus:ring-brand-accent/20"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        {newEnquiries && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative inline-flex size-10 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas"
                aria-label={`Notifications: ${newEnquiries.length} new enquiries`}
              >
                <Bell className="size-5" />
                {newEnquiries.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold text-white tabular">
                    {newEnquiries.length > 9 ? "9+" : newEnquiries.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold">New enquiries</p>
              </div>
              {newEnquiries.length ? (
                <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                  {newEnquiries.slice(0, 8).map((e) => (
                    <li key={e.id}>
                      <Link href={`/admin/enquiries?open=${e.id}`} className="block px-4 py-3 hover:bg-canvas">
                        <p className="truncate text-sm font-medium">{e.name ?? `${ENQUIRY_SOURCE_LABELS[e.source]} lead`}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {e.propertyTitle ?? "General enquiry"} · {formatRelative(e.createdAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-center text-sm text-ink-muted">You&apos;re all caught up.</p>
              )}
              <Link href="/admin/enquiries?status=new" className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-brand hover:bg-canvas">
                View all enquiries
              </Link>
            </PopoverContent>
          </Popover>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 hover:bg-canvas" aria-label="Account menu">
              <Avatar className="size-8">
                <AvatarFallback className="bg-navy-900 text-xs font-semibold text-white">{initials(user.fullName)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-sm leading-tight font-medium">{user.fullName}</span>
                <span className="block text-xs leading-tight text-ink-muted">{ROLE_LABELS[user.role]}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" target="_blank">
                View website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOut className="size-4" aria-hidden /> Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
