import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push("…")
    out.push(p)
  })
  return out
}

/** Link-based pagination so every page is crawlable and shareable. */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null
  const base = "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium tabular"
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(base, "border border-line hover:border-brand hover:text-brand")}>
          <ChevronLeft className="size-4" aria-hidden />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span className={cn(base, "border border-line text-ink-muted/50")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(base, p === page ? "bg-navy-900 text-white" : "text-ink-soft hover:bg-canvas")}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(base, "border border-line hover:border-brand hover:text-brand")}>
          <ChevronRight className="size-4" aria-hidden />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span className={cn(base, "border border-line text-ink-muted/50")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
