"use client"

import { RefreshCw, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-start justify-center pt-28 pb-20">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Something went wrong loading this page.</h1>
      <p className="mt-3 max-w-lg text-ink-muted">It may be a network problem. Please try again — if it keeps happening, reach us on WhatsApp.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-navy-900">
          <RefreshCw className="size-4" aria-hidden /> Try again
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-line px-5 text-sm font-semibold">
          Go home
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-ink-muted">Reference: {error.digest}</p>}
    </div>
  )
}
