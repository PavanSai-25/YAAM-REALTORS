import { Inbox, Phone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { AdminFilters } from "@/components/admin/admin-filters"
import { EnquiryDrawer } from "@/components/admin/enquiry-drawer"
import { EnquiryStatusBadge } from "@/components/admin/enquiry-status-badge"
import { PageHeader } from "@/components/admin/page-header"
import { WhatsAppIcon } from "@/components/shared/icons"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { ENQUIRY_SOURCES, ENQUIRY_SOURCE_LABELS, ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS } from "@/config/property-options"
import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { formatRelative } from "@/lib/format"
import { getSiteSettings } from "@/lib/settings"
import { enquiryFilterSchema } from "@/lib/validations/enquiry"
import { telUrl, whatsappUrl } from "@/lib/whatsapp"

export const metadata: Metadata = { title: "Enquiries" }

export default async function EnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  await requirePageUser(STAFF_ROLES, "/admin/enquiries")
  const raw = await searchParams
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k][0] : raw[k])
  const filter = enquiryFilterSchema.parse({ q: one("q"), status: one("status"), source: one("source"), page: one("page") ?? 1 })
  const openId = one("open")

  const store = await getAdminStore()
  const [result, users, settings] = await Promise.all([store.enquiries.list(filter), store.users.list(), getSiteSettings()])
  const staff = users.filter((u) => u.role !== "seller")

  const open = openId ? await store.enquiries.get(openId) : null
  const notes = open ? await store.enquiries.listNotes(open.id) : []

  const linkFor = (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: filter.q, status: filter.status, source: filter.source, page: filter.page > 1 ? filter.page : undefined, ...params }))
      if (v !== undefined && v !== "") qs.set(k, String(v))
    return `/admin/enquiries${qs.size ? `?${qs}` : ""}`
  }
  const filtered = !!(filter.q || filter.status || filter.source)

  return (
    <>
      <PageHeader title="Enquiries" description={`${result.total} ${result.total === 1 ? "enquiry" : "enquiries"} · leads from WhatsApp taps and website forms`} />
      <div className="mb-4">
        <AdminFilters
          searchPlaceholder="Search name, phone, reference"
          filters={[
            { name: "status", label: "Statuses", options: ENQUIRY_STATUSES.map((s) => ({ value: s, label: ENQUIRY_STATUS_LABELS[s] })) },
            { name: "source", label: "Sources", options: ENQUIRY_SOURCES.map((s) => ({ value: s, label: ENQUIRY_SOURCE_LABELS[s] })) },
          ]}
        />
      </div>

      {result.items.length ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-line bg-canvas/60 text-left text-xs tracking-wide text-ink-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((e) => (
                  <tr key={e.id} className="hover:bg-canvas/50">
                    <td className="px-4 py-3">
                      <Link href={linkFor({ open: e.id })} scroll={false} className="font-medium text-ink hover:text-brand">
                        {e.name ?? "Anonymous WhatsApp lead"}
                      </Link>
                      <p className="text-xs text-ink-muted tabular">{e.phone ?? <span className="font-mono">{e.reference}</span>}</p>
                    </td>
                    <td className="max-w-56 px-4 py-3">
                      <p className="truncate text-ink-soft">{e.propertyTitle ?? "General enquiry"}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{ENQUIRY_SOURCE_LABELS[e.source]}</td>
                    <td className="px-4 py-3">
                      <EnquiryStatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{e.assignedToName ?? <span className="text-ink-muted">—</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatRelative(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {e.phone && (
                          <>
                            <a href={whatsappUrl(e.phone, `Hi, this is ${settings.shortName} (Ref: ${e.reference}).`)} target="_blank" rel="noopener noreferrer" className="inline-flex size-8 items-center justify-center rounded-lg text-whatsapp hover:bg-whatsapp/10" aria-label={`WhatsApp ${e.name ?? "customer"}`}>
                              <WhatsAppIcon className="size-4" />
                            </a>
                            <a href={telUrl(e.phone)} className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas" aria-label={`Call ${e.name ?? "customer"}`}>
                              <Phone className="size-4" aria-hidden />
                            </a>
                          </>
                        )}
                        <Link href={linkFor({ open: e.id })} scroll={false} className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold text-brand hover:bg-brand-light">
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(p) => linkFor({ page: p > 1 ? p : undefined })} />
        </>
      ) : (
        <EmptyState
          icon={Inbox}
          title={filtered ? "No enquiries match these filters" : "No enquiries found"}
          description={filtered ? "Try a different search or clear the filters." : "When visitors tap WhatsApp or send a callback request, their enquiries appear here."}
        />
      )}

      {open && <EnquiryDrawer key={open.id + open.updatedAt + notes.length} enquiry={open} notes={notes} staff={staff} companyShortName={settings.shortName} />}
    </>
  )
}
