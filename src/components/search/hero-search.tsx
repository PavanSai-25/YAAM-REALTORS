"use client"

import { Search } from "lucide-react"
import { m } from "motion/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  BEDROOM_OPTIONS,
  BUDGET_PRESETS,
  PROPERTY_TYPE_LABELS,
  TYPES_BY_CATEGORY,
  type PropertyType,
} from "@/config/property-options"
import { searchToQuery, type PropertySearch } from "@/lib/validations/filters"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationCombobox } from "./location-combobox"

type Tab = "buy" | "rent" | "commercial" | "land"

const TABS: { id: Tab; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "commercial", label: "Commercial" },
  { id: "land", label: "Land" },
]

const SIZE_PRESETS = {
  commercial: [
    { label: "Under 1,000 sq.ft.", max: 1000 },
    { label: "1,000 – 5,000 sq.ft.", min: 1000, max: 5000 },
    { label: "5,000 – 20,000 sq.ft.", min: 5000, max: 20000 },
    { label: "20,000+ sq.ft.", min: 20000 },
  ],
  land: [
    { label: "Under 200 sq.yd.", max: 1800 },
    { label: "200 – 500 sq.yd.", min: 1800, max: 4500 },
    { label: "500 sq.yd. – 1 acre", min: 4500, max: 43560 },
    { label: "1 acre +", min: 43560 },
  ],
}

const ANY = "any"

function typesFor(tab: Tab): PropertyType[] {
  if (tab === "commercial") return TYPES_BY_CATEGORY.commercial.filter((t) => t !== "other")
  if (tab === "land") return TYPES_BY_CATEGORY.land.filter((t) => t !== "other")
  return TYPES_BY_CATEGORY.residential.filter((t) => t !== "other")
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 px-4 py-3 md:px-5 md:py-3.5", className)}>
      <span className="block text-[0.68rem] font-semibold tracking-[0.12em] text-ink-muted uppercase" aria-hidden>
        {label}
      </span>
      {children}
    </div>
  )
}

const triggerClass =
  "mt-1 h-auto w-full border-0 bg-transparent p-0 text-[0.95rem] font-medium text-ink shadow-none focus-visible:ring-0 data-[placeholder]:font-normal data-[placeholder]:text-ink-muted/80 [&_svg]:text-ink-muted"

export function HeroSearch({ localities }: { localities: string[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("buy")
  const [location, setLocation] = useState("")
  const [type, setType] = useState(ANY)
  const [third, setThird] = useState(ANY) // budget, or buy/lease for commercial
  const [fourth, setFourth] = useState(ANY) // BHK, or size

  function switchTab(next: Tab) {
    setTab(next)
    setType(ANY)
    setThird(ANY)
    setFourth(ANY)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q: Partial<PropertySearch> = {}
    if (location.trim()) q.location = location.trim()
    if (type !== ANY) q.propertyType = type as PropertyType

    if (tab === "buy") q.purpose = "sale"
    if (tab === "rent") q.purpose = "rent"
    if (tab === "commercial") {
      q.category = "commercial"
      if (third !== ANY) q.purpose = third as "sale" | "rent"
    }
    if (tab === "land") q.category = "land"

    if (tab !== "commercial" && third !== ANY) {
      const preset = BUDGET_PRESETS[tab === "rent" ? "rent" : "sale"][Number(third)]
      q.minPrice = preset?.min
      q.maxPrice = preset?.max
    }
    if (fourth !== ANY) {
      if (tab === "buy" || tab === "rent") q.bedrooms = Number(fourth)
      else {
        const preset = SIZE_PRESETS[tab][Number(fourth)]
        q.minArea = preset?.min
        q.maxArea = preset?.max
      }
    }
    router.push(`/properties${searchToQuery(q)}`)
  }

  const residential = tab === "buy" || tab === "rent"
  const budgets = BUDGET_PRESETS[tab === "rent" ? "rent" : "sale"]

  return (
    <div className="w-full">
      <div role="tablist" aria-label="What are you looking for?" className="mb-3 inline-flex gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-md">
        {TABS.map((t) => {
          const selected = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => switchTab(t.id)}
              className={cn(
                "relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:px-5",
                selected ? "text-navy-900" : "text-white/85 hover:text-white",
              )}
            >
              {selected && (
                <m.span layoutId="hero-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: "spring", bounce: 0.15, duration: 0.45 }} />
              )}
              <span className="relative">{t.label}</span>
            </button>
          )
        })}
      </div>

      <form
        role="search"
        aria-label="Property search"
        onSubmit={submit}
        className="grid overflow-visible rounded-2xl bg-white shadow-float md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center md:divide-x md:divide-line"
      >
        <LocationCombobox
          value={location}
          onChange={setLocation}
          suggestions={localities}
          className="border-b border-line px-4 py-3 md:border-b-0 md:px-5 md:py-3.5"
        />

        <Field label="Property type" className="border-b border-line md:border-b-0">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger aria-label="Property type" className={triggerClass}>
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any type</SelectItem>
              {typesFor(tab).map((t) => (
                <SelectItem key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={tab === "commercial" ? "Buy or lease" : "Budget"} className="border-b border-line md:border-b-0">
          <Select value={third} onValueChange={setThird}>
            <SelectTrigger aria-label={tab === "commercial" ? "Buy or lease" : "Budget"} className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tab === "commercial" ? (
                <>
                  <SelectItem value={ANY}>Buy or lease</SelectItem>
                  <SelectItem value="sale">Buy</SelectItem>
                  <SelectItem value="rent">Lease</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value={ANY}>Any budget</SelectItem>
                  {budgets.map((b, i) => (
                    <SelectItem key={b.label} value={String(i)}>
                      {b.label}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </Field>

        <Field label={residential ? "BHK" : "Size"}>
          <Select value={fourth} onValueChange={setFourth}>
            <SelectTrigger aria-label={residential ? "Bedrooms" : "Size"} className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{residential ? "Any BHK" : "Any size"}</SelectItem>
              {residential
                ? BEDROOM_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 5 ? "5+ BHK" : `${n}+ BHK`}
                    </SelectItem>
                  ))
                : SIZE_PRESETS[tab as "commercial" | "land"].map((s, i) => (
                    <SelectItem key={s.label} value={String(i)}>
                      {s.label}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="p-2.5">
          <button
            type="submit"
            className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-navy-900 md:h-14"
          >
            <Search className="size-[1.1rem] transition-transform duration-300 group-hover:scale-110" aria-hidden />
            <span>Search Properties</span>
          </button>
        </div>
      </form>
    </div>
  )
}
