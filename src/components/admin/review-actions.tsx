"use client"

import { Check, MessageSquareWarning, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { reviewSubmission } from "@/app/actions/properties"
import { Textarea } from "@/components/ui/textarea"

export function ReviewActions({ id }: { id: string }) {
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [pending, start] = useTransition()

  const decide = (decision: "approve" | "reject" | "request_changes") =>
    start(async () => {
      const res = await reviewSubmission({ id, decision, notes })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(decision === "approve" ? "Approved — the listing is now live." : decision === "reject" ? "Submission rejected." : "Changes requested from the seller.")
      router.refresh()
    })

  return (
    <div className="space-y-3">
      <label htmlFor={`notes-${id}`} className="sr-only">
        Notes for the seller
      </label>
      <Textarea id={`notes-${id}`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for the seller (required to reject or request changes)" maxLength={2000} />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => decide("approve")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
          <Check className="size-4" aria-hidden /> Approve &amp; publish
        </button>
        <button type="button" disabled={pending} onClick={() => decide("request_changes")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-sm font-semibold hover:border-amber-400 disabled:opacity-60">
          <MessageSquareWarning className="size-4 text-amber-600" aria-hidden /> Request changes
        </button>
        <button type="button" disabled={pending} onClick={() => decide("reject")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-sm font-semibold text-destructive hover:border-destructive/40 disabled:opacity-60">
          <X className="size-4" aria-hidden /> Reject
        </button>
      </div>
    </div>
  )
}
