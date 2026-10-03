import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  tone = "dark",
  className,
  id,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  tone?: "dark" | "light"
  className?: string
  id?: string
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className={cn("eyebrow", tone === "light" && "text-brand-cyan")}>{eyebrow}</p>}
        <h2 id={id} className={cn("section-title mt-3", tone === "light" && "text-white")}>
          {title}
        </h2>
        {description && (
          <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", tone === "light" ? "text-white/70" : "text-ink-muted")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
