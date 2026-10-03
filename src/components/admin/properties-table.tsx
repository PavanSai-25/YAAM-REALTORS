"use client"

import { Archive, Eye, EyeOff, MoreHorizontal, Pencil, Star, StarOff, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { bulkPropertyAction, deleteProperty } from "@/app/actions/properties"
import { ConfirmDialog, type ConfirmRequest } from "@/components/admin/confirm-dialog"
import { StatusBadge } from "@/components/property/status-badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CATEGORY_LABELS, PUBLIC_STATUSES, PURPOSE_LABELS, type Role } from "@/config/property-options"
import { formatLocation, formatPrice, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Property } from "@/types/domain"

type BulkAction = "publish" | "unpublish" | "archive" | "delete" | "feature" | "unfeature"

const LABELS: Record<BulkAction, { verb: string; done: string }> = {
  publish: { verb: "Publish", done: "published" },
  unpublish: { verb: "Unpublish", done: "moved to drafts" },
  archive: { verb: "Archive", done: "archived" },
  delete: { verb: "Delete", done: "deleted" },
  feature: { verb: "Feature", done: "featured" },
  unfeature: { verb: "Unfeature", done: "unfeatured" },
}

export function PropertiesTable({ properties, role }: { properties: Property[]; role: Role }) {
  const router = useRouter()
  const staff = role !== "seller"
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [pending, start] = useTransition()

  const allSelected = properties.length > 0 && selected.size === properties.length
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  function run(ids: string[], action: BulkAction) {
    start(async () => {
      const res = await bulkPropertyAction({ ids, action })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`${ids.length === 1 ? "Property" : `${ids.length} properties`} ${LABELS[action].done}.`)
      setSelected(new Set())
      router.refresh()
    })
  }

  function ask(ids: string[], action: BulkAction) {
    const n = ids.length === 1 ? "this property" : `${ids.length} properties`
    if (action === "delete") {
      setConfirm({
        title: `Delete ${n}?`,
        description: "This permanently removes the listing and its photos. Enquiries linked to it are kept. This can't be undone.",
        confirmLabel: "Delete permanently",
        destructive: true,
        onConfirm: () => run(ids, action),
      })
    } else if (action === "archive" || action === "unpublish") {
      setConfirm({
        title: `${LABELS[action].verb} ${n}?`,
        description: "It will be removed from the public website. You can publish it again at any time.",
        confirmLabel: LABELS[action].verb,
        onConfirm: () => run(ids, action),
      })
    } else run(ids, action)
  }

  function removeOwn(p: Property) {
    setConfirm({
      title: "Delete this submission?",
      description: "This permanently removes your submission and its photos.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () =>
        start(async () => {
          const res = await deleteProperty(p.id)
          if (res.ok) {
            toast.success("Submission deleted.")
            router.refresh()
          } else toast.error(res.error)
        }),
    })
  }

  function RowMenu({ p }: { p: Property }) {
    const isPublic = PUBLIC_STATUSES.includes(p.status)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink" aria-label={`Actions for ${p.title}`}>
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/properties/${p.id}/edit`}>
              <Pencil className="size-4" aria-hidden /> Edit
            </Link>
          </DropdownMenuItem>
          {isPublic && (
            <DropdownMenuItem asChild>
              <Link href={`/properties/${p.slug}`} target="_blank">
                <Eye className="size-4" aria-hidden /> Preview
              </Link>
            </DropdownMenuItem>
          )}
          {staff && (
            <>
              <DropdownMenuSeparator />
              {isPublic ? (
                <DropdownMenuItem onSelect={() => ask([p.id], "unpublish")}>
                  <EyeOff className="size-4" aria-hidden /> Unpublish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => ask([p.id], "publish")}>
                  <Upload className="size-4" aria-hidden /> Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => ask([p.id], p.featured ? "unfeature" : "feature")}>
                {p.featured ? <StarOff className="size-4" aria-hidden /> : <Star className="size-4" aria-hidden />}
                {p.featured ? "Remove from featured" : "Feature"}
              </DropdownMenuItem>
              {p.status !== "archived" && (
                <DropdownMenuItem onSelect={() => ask([p.id], "archive")}>
                  <Archive className="size-4" aria-hidden /> Archive
                </DropdownMenuItem>
              )}
            </>
          )}
          {(role === "admin" || (role === "seller" && ["draft", "changes_requested", "rejected"].includes(p.status))) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => (role === "admin" ? ask([p.id], "delete") : removeOwn(p))}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const ids = [...selected]

  return (
    <div className={cn("transition-opacity", pending && "pointer-events-none opacity-60")}>
      {staff && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand-light px-4 py-2.5" role="region" aria-label="Bulk actions">
          <p className="mr-2 text-sm font-medium text-navy-900">{selected.size} selected</p>
          {(["publish", "unpublish", "feature", "archive"] as const).map((a) => (
            <button key={a} type="button" onClick={() => ask(ids, a)} className="h-8 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:border-brand hover:text-brand">
              {LABELS[a].verb}
            </button>
          ))}
          {role === "admin" && (
            <button type="button" onClick={() => ask(ids, "delete")} className="h-8 rounded-lg border border-destructive/30 bg-white px-3 text-sm font-medium text-destructive hover:bg-destructive/5">
              Delete
            </button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-ink-muted hover:text-ink">
            Clear selection
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-white md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-canvas/60 text-left text-xs font-medium tracking-wide text-ink-muted uppercase">
            <tr>
              {staff && (
                <th className="w-10 py-3 pl-4">
                  <Checkbox checked={allSelected} onCheckedChange={(v) => setSelected(v ? new Set(properties.map((p) => p.id)) : new Set())} aria-label="Select all properties" />
                </th>
              )}
              <th className="py-3 pr-4 pl-4 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">Updated</th>
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {properties.map((p) => (
              <tr key={p.id} className={cn("hover:bg-canvas/50", selected.has(p.id) && "bg-brand-light/50")}>
                {staff && (
                  <td className="py-3 pl-4">
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} />
                  </td>
                )}
                <td className="py-3 pr-4 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-canvas">
                      {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/properties/${p.id}/edit`} className="line-clamp-1 font-medium text-ink hover:text-brand">
                        {p.title}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-muted">
                        {formatLocation(p)}
                        {p.featured && (
                          <span className="inline-flex items-center gap-0.5 text-brand">
                            · <Star className="size-3 fill-current" aria-hidden /> Featured
                          </span>
                        )}
                        {p.isDemo && <span>· Demo</span>}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap tabular">{formatPrice(p)}</td>
                <td className="hidden px-4 py-3 text-ink-soft lg:table-cell">
                  {CATEGORY_LABELS[p.category]}
                  <span className="block text-xs text-ink-muted">{PURPOSE_LABELS[p.purpose]}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="hidden px-4 py-3 whitespace-nowrap text-ink-muted xl:table-cell">{formatRelative(p.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <RowMenu p={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {properties.map((p) => (
          <li key={p.id} className="flex gap-3 rounded-xl border border-line bg-white p-3">
            {staff && (
              <Checkbox className="mt-1" checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} />
            )}
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-canvas">
              {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" fill sizes="80px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/admin/properties/${p.id}/edit`} className="line-clamp-2 text-sm font-medium">
                {p.title}
              </Link>
              <p className="mt-0.5 text-xs text-ink-muted">
                {formatPrice(p)} · {p.locality}
              </p>
              <div className="mt-2">
                <StatusBadge status={p.status} />
              </div>
            </div>
            <RowMenu p={p} />
          </li>
        ))}
      </ul>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
