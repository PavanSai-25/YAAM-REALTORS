import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/config/property-options"
import { cn } from "@/lib/utils"

const TONES: Record<EnquiryStatus, string> = {
  new: "bg-sky-50 text-sky-800 ring-sky-200",
  contacted: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  follow_up: "bg-amber-50 text-amber-800 ring-amber-200",
  closed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lost: "bg-zinc-100 text-zinc-600 ring-zinc-200",
}

export function EnquiryStatusBadge({ status, className }: { status: EnquiryStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", TONES[status], className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {ENQUIRY_STATUS_LABELS[status]}
    </span>
  )
}
