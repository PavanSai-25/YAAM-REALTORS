import { Building2, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { AdminFilters } from "@/components/admin/admin-filters"
import { PageHeader } from "@/components/admin/page-header"
import { PropertiesTable } from "@/components/admin/properties-table"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { CATEGORIES, CATEGORY_LABELS, PROPERTY_STATUSES, PURPOSES, PURPOSE_LABELS, STATUS_LABELS } from "@/config/property-options"
import { isStaff, requirePageUser } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { parseAdminPropertyFilter } from "@/lib/validations/filters"

export const metadata: Metadata = { title: "Properties" }

export default async function AdminPropertiesPage({ searchParams }: PageProps<"/admin/properties">) {
  const user = await requirePageUser()
  const raw = await searchParams
  const filter = parseAdminPropertyFilter(raw)
  const store = await getAdminStore()
  const result = await store.properties.list(filter, isStaff(user) ? undefined : { ownerId: user.id })
  const seller = !isStaff(user)

  const hrefFor = (page: number) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(filter)) if (v && k !== "page") qs.set(k, String(v))
    if (page > 1) qs.set("page", String(page))
    return `/admin/properties${qs.size ? `?${qs}` : ""}`
  }
  const filtered = Object.entries(filter).some(([k, v]) => k !== "page" && v)

  return (
    <>
      <PageHeader
        title={seller ? "My submissions" : "Properties"}
        description={`${result.total} ${result.total === 1 ? "property" : "properties"}`}
        actions={
          <Link href="/admin/properties/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-navy-900">
            <Plus className="size-4" aria-hidden /> {seller ? "Submit property" : "Add property"}
          </Link>
        }
      />
      <div className="mb-4">
        <AdminFilters
          searchPlaceholder="Search title or locality"
          filters={[
            { name: "status", label: "Statuses", options: PROPERTY_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
            { name: "category", label: "Categories", options: CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })) },
            { name: "purpose", label: "Purposes", options: PURPOSES.map((p) => ({ value: p, label: PURPOSE_LABELS[p] })) },
          ]}
        />
      </div>
      {result.items.length ? (
        <>
          <PropertiesTable properties={result.items} role={user.role} />
          <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
        </>
      ) : (
        <EmptyState
          icon={Building2}
          title={filtered ? "No properties match these filters" : seller ? "You haven't submitted a property yet" : "No properties yet"}
          description={filtered ? "Try a different search or clear the filters." : "Add your first listing — it takes a few minutes."}
          action={
            <Link href={filtered ? "/admin/properties" : "/admin/properties/new"} className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white">
              {filtered ? "Clear filters" : "Add property"}
            </Link>
          }
        />
      )}
    </>
  )
}
