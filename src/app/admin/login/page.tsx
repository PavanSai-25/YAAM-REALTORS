import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import { getSessionUser } from "@/lib/auth/session"
import { BACKEND } from "@/lib/backend"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in", robots: { index: false } }

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getSessionUser()) redirect("/admin")
  const { next } = await searchParams
  const showDemoHint = BACKEND === "local" && process.env.NODE_ENV !== "production"

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" aria-label="Back to Yaam Realtors website" className="w-fit">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-ink-muted">Manage listings, enquiries and settings.</p>
          <LoginForm next={typeof next === "string" ? next : "/admin"} />
          {showDemoHint && (
            <p className="mt-6 rounded-lg border border-dashed border-line bg-canvas px-4 py-3 text-xs leading-relaxed text-ink-muted">
              <strong className="font-semibold text-ink-soft">Local demo mode.</strong> Sign in with{" "}
              <code className="font-mono">{process.env.LOCAL_ADMIN_EMAIL ?? "admin@yaam.local"}</code> and the password set
              in <code className="font-mono">LOCAL_ADMIN_PASSWORD</code> (default <code className="font-mono">yaam-demo-admin</code>).
            </p>
          )}
        </div>
        <p className="text-xs text-ink-muted">Authorised Yaam staff only.</p>
      </div>
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <Image src="/demo/villa-kompally-1.jpg" alt="" fill priority sizes="55vw" className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent" />
        <div className="absolute inset-x-12 bottom-12 max-w-md text-white">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-cyan uppercase">Yaam platform</p>
          <p className="mt-3 text-3xl leading-tight font-semibold tracking-tight">Every listing, every lead, in one place.</p>
        </div>
      </div>
    </main>
  )
}
