import { UserCheck } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/admin/page-header"
import { ReviewActions } from "@/components/admin/review-actions"
import { StatusBadge } from "@/components/property/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PROPERTY_TYPE_LABELS } from "@/config/property-options"
import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { formatArea, formatLocation, formatPrice, formatRelative, pluralize } from "@/lib/format"

export const metadata: Metadata = { title: "Seller submissions" }

export default async function SellersPage() {
  await requirePageUser(STAFF_ROLES, "/admin/sellers")
  const store = await getAdminStore()
  const [pending, recent, users] = await Promise.all([
    store.properties.list({ page: 1 }, { statuses: ["pending_review"] }),
    store.properties.list({ page: 1 }, { statuses: ["changes_requested", "rejected"] }),
    store.users.list(),
  ])
  const sellers = users.filter((u) => u.role === "seller")
  const nameOf = (id: string | null) => users.find((u) => u.id === id)?.fullName ?? "Unknown seller"

  return (
    <>
      <PageHeader
        title="Seller submissions"
        description="Property owners' listings wait here until Yaam approves them. Only approved listings appear on the website."
      />

      {pending.items.length ? (
        <ul className="space-y-4">
          {pending.items.map((p) => (
            <li key={p.id} className="grid gap-5 rounded-xl border border-line bg-white p-5 md:grid-cols-[12rem_1fr_minmax(0,22rem)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-canvas">
                {p.coverImageUrl ? (
                  <Image src={p.coverImageUrl} alt="" fill sizes="200px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-ink-muted">No photos</span>
                )}
              </div>
              <div className="min-w-0">
                <StatusBadge status={p.status} />
                <Link href={`/admin/properties/${p.id}/edit`} className="mt-2 block text-base font-semibold hover:text-brand">
                  {p.title}
                </Link>
                <p className="mt-1 text-sm text-ink-muted">
                  {PROPERTY_TYPE_LABELS[p.propertyType]} · {formatLocation(p)} · {formatArea(p.area, p.areaUnit)}
                </p>
                <p className="mt-2 font-semibold tabular">{formatPrice(p)}</p>
                <p className="mt-2 text-xs text-ink-muted">
                  Submitted by {nameOf(p.createdBy)} · {formatRelative(p.updatedAt)} · {pluralize(p.images.length, "photo")}
                </p>
              </div>
              <ReviewActions id={p.id} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={UserCheck} title="No submissions waiting for review" description="When a seller submits a property, it will appear here for approval." />
      )}

      {recent.items.length > 0 && (
        <section className="mt-10" aria-labelledby="awaiting-seller">
          <h2 id="awaiting-seller" className="text-base font-semibold">
            Waiting on the seller
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
            {recent.items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <Link href={`/admin/properties/${p.id}/edit`} className="min-w-0 flex-1 truncate font-medium hover:text-brand">
                  {p.title}
                </Link>
                <span className="text-ink-muted">{nameOf(p.createdBy)}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="seller-accounts">
        <h2 id="seller-accounts" className="text-base font-semibold">
          Seller accounts <span className="font-normal text-ink-muted">({sellers.length})</span>
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Sellers can submit and edit their own listings but never see other listings, enquiries or settings. Admins manage accounts under Staff &amp; Users.</p>
      </section>
    </>
  )
}
