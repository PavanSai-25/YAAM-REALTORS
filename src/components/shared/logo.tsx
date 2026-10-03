import { cn } from "@/lib/utils"

/** House mark echoing the visiting card: roof chevron, frame and an upward keyline. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-9", className)}>
      <rect width="40" height="40" rx="9" fill="currentColor" />
      <path
        d="M9.5 19.5 20 10.5l10.5 9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 17.5V29h14V17.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 26v-6.5m-2.6 2.4L20 19.4l2.6 2.5" fill="none" stroke="#5cc8f5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({
  className,
  tone = "dark",
  compact = false,
}: {
  className?: string
  tone?: "dark" | "light"
  compact?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={tone === "dark" ? "text-brand" : "text-brand-accent"} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.2rem] font-bold tracking-[-0.03em]",
            tone === "dark" ? "text-navy-900" : "text-white",
          )}
        >
          Yaam
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 text-[0.58rem] font-semibold tracking-[0.2em] uppercase",
              tone === "dark" ? "text-ink-muted" : "text-white/60",
            )}
          >
            Realtors & Consultants
          </span>
        )}
      </span>
    </span>
  )
}
