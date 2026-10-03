"use client"

import { ExternalLink, Loader2, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addEnquiryNote, updateEnquiry } from "@/app/actions/enquiries"
import { WhatsAppIcon } from "@/components/shared/icons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ENQUIRY_SOURCE_LABELS, ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS } from "@/config/property-options"
import { formatDate, formatRelative } from "@/lib/format"
import { telUrl, whatsappUrl } from "@/lib/whatsapp"
import type { Enquiry, EnquiryNote, UserProfile } from "@/types/domain"

const UNASSIGNED = "__none"

export function EnquiryDrawer({
  enquiry,
  notes,
  staff,
  companyShortName,
}: {
  enquiry: Enquiry
  notes: EnquiryNote[]
  staff: UserProfile[]
  companyShortName: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [note, setNote] = useState("")
  const [saving, start] = useTransition()

  const close = () => {
    const next = new URLSearchParams(params.toString())
    next.delete("open")
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }

  const update = (patch: { status?: string; assignedTo?: string | null }, success: string) =>
    start(async () => {
      const res = await updateEnquiry({ id: enquiry.id, ...patch })
      if (res.ok) {
        toast.success(success)
        router.refresh()
      } else toast.error(res.error)
    })

  const replyText = `Hi${enquiry.name ? ` ${enquiry.name.split(" ")[0]}` : ""}, this is ${companyShortName} following up on your enquiry${
    enquiry.propertyTitle ? ` about "${enquiry.propertyTitle}"` : ""
  } (Ref: ${enquiry.reference}).`

  return (
    <Sheet open onOpenChange={(o) => !o && close()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-line px-6 py-5">
          <SheetTitle className="text-lg">{enquiry.name ?? "Anonymous WhatsApp lead"}</SheetTitle>
          <SheetDescription>
            {ENQUIRY_SOURCE_LABELS[enquiry.source]} · {formatDate(enquiry.createdAt, { hour: "numeric", minute: "2-digit" })} ·{" "}
            <span className="font-mono">{enquiry.reference}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-2">
            {enquiry.phone ? (
              <>
                <a href={whatsappUrl(enquiry.phone, replyText)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-whatsapp text-sm font-semibold text-white hover:bg-whatsapp-hover">
                  <WhatsAppIcon className="size-4" /> WhatsApp
                </a>
                <a href={telUrl(enquiry.phone)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line text-sm font-semibold hover:border-brand hover:text-brand">
                  <Phone className="size-4" aria-hidden /> Call
                </a>
              </>
            ) : (
              <p className="col-span-2 rounded-lg bg-canvas px-4 py-3 text-sm text-ink-soft">
                This visitor started a WhatsApp chat without leaving details. Find the chat containing{" "}
                <span className="font-mono font-semibold">{enquiry.reference}</span> and add their number in a note.
              </p>
            )}
          </div>

          <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-ink-muted">Phone</dt>
            <dd className="font-medium tabular">{enquiry.phone ?? "—"}</dd>
            <dt className="text-ink-muted">Email</dt>
            <dd className="truncate">
              {enquiry.email ? (
                <a href={`mailto:${enquiry.email}`} className="inline-flex items-center gap-1 text-brand hover:underline">
                  <Mail className="size-3.5" aria-hidden /> {enquiry.email}
                </a>
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-ink-muted">Property</dt>
            <dd>
              {enquiry.propertySlug ? (
                <Link href={`/properties/${enquiry.propertySlug}`} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
                  {enquiry.propertyTitle} <ExternalLink className="size-3" aria-hidden />
                </Link>
              ) : (
                (enquiry.propertyTitle ?? "General enquiry")
              )}
            </dd>
            {enquiry.message && (
              <>
                <dt className="text-ink-muted">Message</dt>
                <dd className="whitespace-pre-line">{enquiry.message}</dd>
              </>
            )}
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="enq-status" className="text-sm font-medium text-ink-soft">
                Status
              </label>
              <Select value={enquiry.status} onValueChange={(v) => update({ status: v }, `Marked as ${ENQUIRY_STATUS_LABELS[v as keyof typeof ENQUIRY_STATUS_LABELS]}.`)} disabled={saving}>
                <SelectTrigger id="enq-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENQUIRY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ENQUIRY_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="enq-assignee" className="text-sm font-medium text-ink-soft">
                Assigned to
              </label>
              <Select
                value={enquiry.assignedTo ?? UNASSIGNED}
                onValueChange={(v) => update({ assignedTo: v === UNASSIGNED ? null : v }, v === UNASSIGNED ? "Unassigned." : "Assigned.")}
                disabled={saving}
              >
                <SelectTrigger id="enq-assignee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <section aria-labelledby="notes-heading">
            <h3 id="notes-heading" className="text-sm font-semibold">
              Internal notes <span className="font-normal text-ink-muted">· only visible to Yaam staff</span>
            </h3>
            {notes.length ? (
              <ol className="mt-3 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-canvas px-4 py-3">
                    <p className="text-sm whitespace-pre-line">{n.body}</p>
                    <p className="mt-1.5 text-xs text-ink-muted">
                      {n.authorName} · {formatRelative(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">No notes yet.</p>
            )}
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!note.trim()) return
                start(async () => {
                  const res = await addEnquiryNote({ enquiryId: enquiry.id, body: note })
                  if (res.ok) {
                    setNote("")
                    router.refresh()
                  } else toast.error(res.error)
                })
              }}
            >
              <label htmlFor="enq-note" className="sr-only">
                Add a note
              </label>
              <Textarea id="enq-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called, site visit booked for Saturday…" maxLength={4000} />
              <button type="submit" disabled={saving || !note.trim()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-brand disabled:opacity-50">
                {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden />} Add note
              </button>
            </form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
