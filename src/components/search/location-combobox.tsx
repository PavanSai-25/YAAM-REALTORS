"use client"

import { MapPin } from "lucide-react"
import { useId, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Accessible combobox (WAI-ARIA 1.2 pattern) — free text allowed, suggestions optional. */
export function LocationCombobox({
  value,
  onChange,
  suggestions,
  placeholder = "Locality, area or city",
  className,
  inputClassName,
  label = "Location",
  hideLabel = false,
}: {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
  inputClassName?: string
  label?: string
  hideLabel?: boolean
}) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    const list = q ? suggestions.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q) : suggestions
    return list.slice(0, 8)
  }, [value, suggestions])

  const expanded = open && matches.length > 0

  function choose(v: string) {
    onChange(v)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, matches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && expanded && active >= 0) {
      e.preventDefault()
      choose(matches[active])
    } else if (e.key === "Escape") {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className={cn("block text-[0.68rem] font-semibold tracking-[0.12em] text-ink-muted uppercase", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <MapPin className="size-4 shrink-0 text-brand-accent" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full min-w-0 bg-transparent text-[0.95rem] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-muted/80",
            inputClassName,
          )}
        />
      </div>
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggested locations"
          className="absolute top-full left-0 z-30 mt-3 max-h-72 w-full min-w-56 overflow-auto rounded-xl border border-line bg-white p-1.5 shadow-float"
        >
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(m)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-soft",
                i === active && "bg-brand-light text-navy-900",
              )}
            >
              <MapPin className="size-3.5 text-ink-muted" aria-hidden />
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
