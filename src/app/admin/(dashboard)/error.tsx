"use client"

import { RefreshCw, TriangleAlert } from "lucide-react"

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
      <TriangleAlert className="mx-auto size-8 text-amber-600" aria-hidden />
      <h1 className="mt-4 text-lg font-semibold">This page couldn&apos;t load</h1>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">Check your connection and try again. If the problem continues, the database may be unreachable.</p>
      <button type="button" onClick={reset} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white">
        <RefreshCw className="size-4" aria-hidden /> Retry
      </button>
      {error.digest && <p className="mt-4 text-xs text-ink-muted">Reference: {error.digest}</p>}
    </div>
  )
}
