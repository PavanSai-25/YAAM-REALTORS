import Link from "next/link"
import { Logo } from "@/components/shared/logo"

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col bg-canvas">
      <div className="container-page py-6">
        <Link href="/" aria-label="YAAM Realtors — home">
          <Logo />
        </Link>
      </div>
      <div className="container-page flex flex-1 flex-col items-start justify-center pb-24">
        <p className="eyebrow">Error 404</p>
        <h1 className="display mt-4 max-w-2xl">This page has moved, or never existed.</h1>
        <p className="mt-5 max-w-lg text-lg text-ink-muted">
          The link may be old or mistyped. Try searching our current listings instead.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/properties" className="inline-flex h-12 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-navy-900">
            Browse properties
          </Link>
          <Link href="/" className="inline-flex h-12 items-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-navy-900">
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  )
}
