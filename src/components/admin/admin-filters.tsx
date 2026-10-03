"use client"

import { Search, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type FilterDef = { name: string; label: string; options: { value: string; label: string }[] }

const ALL = "__all"

/** URL-driven filter bar for admin tables. */
export function AdminFilters({ filters, searchPlaceholder }: { filters: FilterDef[]; searchPlaceholder: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const [q, setQ] = useState(params.get("q") ?? "")

  const push = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    next.delete("page")
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }))
  }

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return
    const t = setTimeout(() => push({ q: q.trim() || null }), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on q only
  }, [q])

  const active = filters.some((f) => params.get(f.name)) || !!params.get("q")

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", pending && "opacity-70")} aria-busy={pending}>
      <div className="relative min-w-56 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <label className="sr-only" htmlFor="table-search">
          Search
        </label>
        <input
          id="table-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-accent focus:ring-3 focus:ring-brand-accent/20"
        />
      </div>
      {filters.map((f) => (
        <Select key={f.name} value={params.get(f.name) ?? ALL} onValueChange={(v) => push({ [f.name]: v === ALL ? null : v })}>
          <SelectTrigger aria-label={f.label} className="h-9 w-auto min-w-36 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All {f.label.toLowerCase()}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {active && (
        <button
          type="button"
          onClick={() => {
            setQ("")
            start(() => router.replace(pathname, { scroll: false }))
          }}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-ink-muted hover:bg-white hover:text-ink"
        >
          <X className="size-3.5" aria-hidden /> Clear
        </button>
      )}
    </div>
  )
}
