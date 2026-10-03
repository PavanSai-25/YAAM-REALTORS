"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from "@/config/property-options"
import { searchToQuery, type PropertySearch } from "@/lib/validations/filters"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SortSelect({ search }: { search: PropertySearch }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Select
      value={search.sort ?? "newest"}
      onValueChange={(v) =>
        start(() => router.push(`/properties${searchToQuery({ ...search, sort: v as SortOption, page: 1 })}`, { scroll: false }))
      }
    >
      <SelectTrigger aria-label="Sort properties" className="h-10 w-auto min-w-44 gap-2 bg-white data-[pending=true]:opacity-60" data-pending={pending}>
        <span className="text-ink-muted">Sort:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o} value={o}>
            {SORT_LABELS[o]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
