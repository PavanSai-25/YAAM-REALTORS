import { ArrowRight, Building2, CircleCheck, FilePen, Home, Inbox, KeyRound, Plus, ShieldAlert, Sparkles } from "lucide-react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/property/status-badge"
import { ENQUIRY_SOURCE_LABELS } from "@/config/property-options"
import { isStaff, requirePageUser } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { formatPrice, formatRelative } from "@/lib/format"

export const metadata: Metadata = { title: "Dashboard" }

// Recharts is client-only and only needed here — keep it out of other admin bundles.
const EnquiriesChart = dynamic(() => import("@/components/admin/enquiries-chart").then((m) => m.EnquiriesChart), {
  loading: () => <div className="h-56 animate-pulse rounded-lg bg-canvas" />,
})

function StatCard({ label, value, icon: Icon, href, tone = "default" }: { label: string; value: number; icon: typeof Home; href: string; tone?: "default" | "accent" }) {
  return (
    <Link href={href} className="group rounded-xl border border-line bg-white p-5 transition-[border-color,box-shadow] hover:border-brand/30 hover:shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{label}</p>
        <span className={`inline-flex size-9 items-center justify-center rounded-lg ${tone === "accent" ? "bg-brand text-white" : "bg-brand-light text-brand"}`}>
          <Icon className="size-[1.1rem]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular">{value}</p>
    </Link>
  )
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requirePageUser()
  const { denied } = await searchParams
  const staff = isStaff(user)
  const store = await getAdminStore()
  const scope = staff ? undefined : { ownerId: user.id }
  const [stats, recentProps, recentEnq] = await Promise.all([
    store.stats(scope),
    store.properties.recent(5, scope),
    staff ? store.enquiries.recent(6) : Promise.resolve([]),
  ])
  const firstName = user.fullName.split(" ")[0]

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={staff ? "Here's what's happening across Yaam's listings and leads." : "Track your property submissions."}
        actions={
          <Link href="/admin/properties/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-navy-900">
            <Plus className="size-4" aria-hidden /> {staff ? "Add property" : "Submit property"}
          </Link>
        }
      />

      {denied && (
        <div role="alert" className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="size-4" aria-hidden /> You don&apos;t have access to that page.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total properties" value={stats.totalProperties} icon={Building2} href="/admin/properties" />
        <StatCard label="Active listings" value={stats.activeListings} icon={CircleCheck} href="/admin/properties?status=published" />
        <StatCard label="Sold" value={stats.sold} icon={Home} href="/admin/properties?status=sold" />
        <StatCard label="Rented" value={stats.rented} icon={KeyRound} href="/admin/properties?status=rented" />
        <StatCard label="Drafts" value={stats.drafts} icon={FilePen} href="/admin/properties?status=draft" />
        {staff ? (
          <StatCard label="Enquiries" value={stats.enquiries} icon={Inbox} href="/admin/enquiries" tone="accent" />
        ) : (
          <StatCard label="Pending review" value={stats.pendingReview} icon={Sparkles} href="/admin/properties?status=pending_review" tone="accent" />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {staff && (
          <section aria-labelledby="chart-title" className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 id="chart-title" className="text-base font-semibold">
                Enquiries per day <span className="font-normal text-ink-muted">· last 14 days</span>
              </h2>
              <p className="text-sm text-ink-muted">
                <span className="font-semibold text-ink tabular">{stats.newEnquiries}</span> new
              </p>
            </div>
            <EnquiriesChart data={stats.enquiriesByDay} />
          </section>
        )}

        <section aria-labelledby="quick-title" className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 id="quick-title" className="text-base font-semibold">
            Quick actions
          </h2>
          <ul className="mt-4 space-y-2">
            {[
              { href: "/admin/properties/new", label: staff ? "Add a property" : "Submit a property", icon: Plus },
              { href: "/admin/properties", label: staff ? "Manage properties" : "My submissions", icon: Building2 },
              ...(staff ? [{ href: "/admin/enquiries?status=new", label: "Respond to new enquiries", icon: Inbox }] : []),
              ...(staff && stats.pendingReview ? [{ href: "/admin/sellers", label: `Review ${stats.pendingReview} seller submission${stats.pendingReview > 1 ? "s" : ""}`, icon: Sparkles }] : []),
            ].map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="group flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm font-medium hover:border-brand/40 hover:bg-brand-light/40">
                  <a.icon className="size-4 text-brand" aria-hidden />
                  <span className="flex-1">{a.label}</span>
                  <ArrowRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="recent-props" className="rounded-xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="recent-props" className="text-base font-semibold">
              Recently updated properties
            </h2>
            <Link href="/admin/properties" className="text-sm font-medium text-brand">
              View all
            </Link>
          </div>
          {recentProps.length ? (
            <ul className="divide-y divide-line">
              {recentProps.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/properties/${p.id}/edit`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas/60">
                    <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md bg-canvas">
                      {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-ink-muted">
                        {formatPrice(p)} · {formatRelative(p.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">No properties yet.</p>
          )}
        </section>

        {staff && (
          <section aria-labelledby="recent-enq" className="rounded-xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 id="recent-enq" className="text-base font-semibold">
                Recent enquiries
              </h2>
              <Link href="/admin/enquiries" className="text-sm font-medium text-brand">
                View all
              </Link>
            </div>
            {recentEnq.length ? (
              <ul className="divide-y divide-line">
                {recentEnq.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/enquiries?open=${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas/60">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.name ?? "Anonymous WhatsApp lead"}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {ENQUIRY_SOURCE_LABELS[e.source]} · {e.propertyTitle ?? "General enquiry"} · {formatRelative(e.createdAt)}
                        </p>
                      </div>
                      <EnquiryStatusBadge status={e.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-ink-muted">No enquiries yet. They&apos;ll appear here when visitors tap WhatsApp or request a callback.</p>
            )}
          </section>
        )}
      </div>
    </>
  )
}
