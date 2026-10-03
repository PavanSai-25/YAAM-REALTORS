import { BadgeCheck, CircleDot, FlaskConical, Star } from "lucide-react"
import { PURPOSE_LABELS, STATUS_LABELS, type PropertyStatus, type Purpose } from "@/config/property-options"
import { cn } from "@/lib/utils"

const pill = "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.66rem] font-bold tracking-[0.08em] uppercase leading-none"

export function PurposeBadge({ purpose, className }: { purpose: Purpose; className?: string }) {
  return <span className={cn(pill, "bg-white/95 text-navy-900 shadow-sm", className)}>{PURPOSE_LABELS[purpose]}</span>
}

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span className={cn(pill, "bg-brand text-white shadow-sm", className)}>
      <Star className="size-3 fill-current" aria-hidden /> Featured
    </span>
  )
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-brand", className)}>
      <BadgeCheck className="size-4" aria-hidden /> Verified by Yaam
    </span>
  )
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      title="Sample listing for demonstration — not a real Yaam property"
      className={cn(pill, "bg-navy-950/75 text-white/90 backdrop-blur-sm", className)}
    >
      <FlaskConical className="size-3" aria-hidden /> Demo
    </span>
  )
}

/** Public-facing status for non-standard states (text + icon, never colour alone). */
export function AvailabilityBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  if (status === "published") return null
  const tone =
    status === "sold" || status === "rented"
      ? "bg-ink text-white"
      : status === "under_negotiation"
        ? "bg-amber-100 text-amber-900"
        : "bg-muted text-ink-soft"
  return (
    <span className={cn(pill, tone, className)}>
      <CircleDot className="size-3" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  )
}

const ADMIN_TONES: Record<PropertyStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  pending_review: "bg-amber-50 text-amber-800 ring-amber-200",
  changes_requested: "bg-orange-50 text-orange-800 ring-orange-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  under_negotiation: "bg-sky-50 text-sky-800 ring-sky-200",
  sold: "bg-violet-50 text-violet-800 ring-violet-200",
  rented: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  archived: "bg-zinc-100 text-zinc-600 ring-zinc-200",
}

/** Admin table status chip. */
export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        ADMIN_TONES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  )
}
