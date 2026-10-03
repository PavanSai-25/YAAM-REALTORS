"use client"

import { RotateCcw, SlidersHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useId, useState, useTransition } from "react"
import {
  AVAILABILITY_FILTERS,
  AVAILABILITY_LABELS,
  BEDROOM_OPTIONS,
  CATEGORIES,
  CATEGORY_LABELS,
  FURNISHING,
  FURNISHING_LABELS,
  POSSESSION,
  POSSESSION_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  TYPES_BY_CATEGORY,
} from "@/config/property-options"
import { searchToQuery, type PropertySearch } from "@/lib/validations/filters"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LocationCombobox } from "./location-combobox"

type Filters = Omit<PropertySearch, "page">

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
        selected
          ? "border-brand bg-brand-light text-navy-900"
          : "border-line bg-white text-ink-soft hover:border-ink-muted/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="border-b border-line py-5 first:pt-0 last:border-b-0">
      <p id={id} className="mb-3 text-[0.72rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        {title}
      </p>
      {children}
    </div>
  )
}

function NumberInput({
  label,
  value,
  onCommit,
  placeholder,
}: {
  label: string
  value: number | undefined
  onCommit: (v: number | undefined) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "")
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    setSynced(value)
    setDraft(value?.toString() ?? "")
  }
  const commit = () => {
    const n = Number(draft.replace(/[^\d]/g, ""))
    onCommit(draft.trim() && Number.isFinite(n) ? n : undefined)
  }
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        inputMode="numeric"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none placeholder:text-ink-muted/70 focus:border-brand-accent focus:ring-3 focus:ring-brand-accent/20"
      />
    </label>
  )
}

/** Debounced so typing doesn't push a URL per keystroke. */
function LocationFilter({
  value,
  onCommit,
  localities,
}: {
  value: string
  onCommit: (v: string) => void
  localities: string[]
}) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    setSynced(value)
    setDraft(value)
  }
  useEffect(() => {
    if (draft.trim() === value.trim()) return
    const t = setTimeout(() => onCommit(draft.trim()), 450)
    return () => clearTimeout(t)
  }, [draft, value, onCommit])
  return (
    <LocationCombobox
      hideLabel
      value={draft}
      onChange={setDraft}
      suggestions={localities}
      className="rounded-lg border border-line px-3 py-2 focus-within:border-brand-accent focus-within:ring-3 focus-within:ring-brand-accent/20"
    />
  )
}

function FilterFields({
  filters,
  set,
  localities,
}: {
  filters: Filters
  set: (patch: Partial<Filters>) => void
  localities: string[]
}) {
  const types = filters.category ? TYPES_BY_CATEGORY[filters.category] : PROPERTY_TYPES
  const residential = !filters.category || filters.category === "residential"
  const toggle = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    set({ [key]: filters[key] === value ? undefined : value } as Partial<Filters>)

  return (
    <div>
      <Group title="Purpose">
        <div className="grid grid-cols-2 gap-2">
          <Chip selected={filters.purpose === "sale"} onClick={() => toggle("purpose", "sale")}>
            Buy
          </Chip>
          <Chip selected={filters.purpose === "rent"} onClick={() => toggle("purpose", "rent")}>
            Rent
          </Chip>
        </div>
      </Group>

      <Group title="Location">
        <LocationFilter value={filters.location ?? ""} onCommit={(v) => set({ location: v || undefined })} localities={localities} />
      </Group>

      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={filters.category === c}
              onClick={() =>
                set({
                  category: filters.category === c ? undefined : c,
                  propertyType: undefined,
                })
              }
            >
              {CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Property type">
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Chip key={t} selected={filters.propertyType === t} onClick={() => toggle("propertyType", t)}>
              {PROPERTY_TYPE_LABELS[t]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title={filters.purpose === "rent" ? "Monthly rent (₹)" : "Price (₹)"}>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Minimum price" placeholder="Min" value={filters.minPrice} onCommit={(v) => set({ minPrice: v })} />
          <NumberInput label="Maximum price" placeholder="Max" value={filters.maxPrice} onCommit={(v) => set({ maxPrice: v })} />
        </div>
      </Group>

      <Group title="Area (sq.ft.)">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Minimum area" placeholder="Min" value={filters.minArea} onCommit={(v) => set({ minArea: v })} />
          <NumberInput label="Maximum area" placeholder="Max" value={filters.maxArea} onCommit={(v) => set({ maxArea: v })} />
        </div>
      </Group>

      {residential && (
        <>
          <Group title="Bedrooms">
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map((n) => (
                <Chip key={n} selected={filters.bedrooms === n} onClick={() => toggle("bedrooms", n)}>
                  {n}+
                </Chip>
              ))}
            </div>
          </Group>
          <Group title="Bathrooms">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((n) => (
                <Chip key={n} selected={filters.bathrooms === n} onClick={() => toggle("bathrooms", n)}>
                  {n}+
                </Chip>
              ))}
            </div>
          </Group>
        </>
      )}

      {filters.category !== "land" && (
        <Group title="Furnishing">
          <div className="flex flex-wrap gap-2">
            {FURNISHING.map((f) => (
              <Chip key={f} selected={filters.furnishing === f} onClick={() => toggle("furnishing", f)}>
                {FURNISHING_LABELS[f]}
              </Chip>
            ))}
          </div>
        </Group>
      )}

      <Group title="Availability">
        <div className="flex flex-wrap gap-2">
          {POSSESSION.map((p) => (
            <Chip key={p} selected={filters.possession === p} onClick={() => toggle("possession", p)}>
              {POSSESSION_LABELS[p]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Property status">
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_FILTERS.map((a) => (
            <Chip
              key={a}
              selected={(filters.availability ?? "available") === a}
              onClick={() => set({ availability: a === "available" ? undefined : a })}
            >
              {AVAILABILITY_LABELS[a]}
            </Chip>
          ))}
        </div>
      </Group>
    </div>
  )
}

export function countActiveFilters(f: Filters) {
  const keys: (keyof Filters)[] = [
    "purpose",
    "category",
    "propertyType",
    "location",
    "minPrice",
    "maxPrice",
    "minArea",
    "maxArea",
    "bedrooms",
    "bathrooms",
    "furnishing",
    "possession",
  ]
  return keys.filter((k) => f[k] !== undefined).length + (f.availability && f.availability !== "available" ? 1 : 0)
}

/** Desktop sidebar + mobile drawer. Every change rewrites the URL, so searches are shareable. */
export function PropertyFilters({
  initial,
  localities,
  total,
}: {
  initial: Filters
  localities: string[]
  total: number
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(initial)
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  // Keep local state in sync when the URL changes elsewhere (tabs, back button).
  const initialKey = JSON.stringify(initial)
  const [lastKey, setLastKey] = useState(initialKey)
  if (lastKey !== initialKey) {
    setLastKey(initialKey)
    setFilters(initial)
  }

  function apply(next: Filters) {
    setFilters(next)
    startTransition(() => router.push(`/properties${searchToQuery({ ...next, page: 1 })}`, { scroll: false }))
  }
  const set = (patch: Partial<Filters>) => apply({ ...filters, ...patch })
  const reset = () => apply({ sort: filters.sort })
  const active = countActiveFilters(filters)

  return (
    <>
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-xl border border-line bg-white p-5 [scrollbar-width:thin]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <SlidersHorizontal className="size-4 text-brand" aria-hidden /> Filters
            </h2>
            {active > 0 && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                <RotateCcw className="size-3.5" aria-hidden /> Reset
              </button>
            )}
          </div>
          <div aria-busy={pending} className={cn("transition-opacity", pending && "opacity-60")}>
            <FilterFields filters={filters} set={set} localities={localities} />
          </div>
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-navy-900 lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters
            {active > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand text-[0.7rem] text-white tabular">
                {active}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col gap-0 rounded-t-2xl p-0">
          <SheetHeader className="border-b border-line px-5 py-4">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription className="sr-only">Narrow down the property results</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <FilterFields filters={filters} set={set} localities={localities} />
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={reset} className="h-12 rounded-lg border border-line px-5 text-sm font-semibold text-ink-soft">
              Reset
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-12 rounded-lg bg-brand text-sm font-semibold text-white"
            >
              {pending ? "Updating…" : `Show ${total} ${total === 1 ? "property" : "properties"}`}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
