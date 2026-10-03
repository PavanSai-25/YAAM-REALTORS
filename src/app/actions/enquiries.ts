"use server"

import { revalidatePath } from "next/cache"
import { AuthError, requireUser, STAFF_ROLES } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { enquiryNoteSchema, enquiryUpdateSchema } from "@/lib/validations/enquiry"

type Result = { ok: true } | { ok: false; error: string }

function failure(err: unknown): Result {
  if (err instanceof AuthError) return { ok: false, error: err.message }
  console.error("[enquiries]", err)
  return { ok: false, error: "Something went wrong. Please try again." }
}

export async function updateEnquiry(input: { id: string; status?: string; assignedTo?: string | null }): Promise<Result> {
  try {
    await requireUser(STAFF_ROLES)
    const parsed = enquiryUpdateSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: "Invalid update." }
    const { id, ...patch } = parsed.data
    const store = await getAdminStore()
    if (patch.assignedTo) {
      const users = await store.users.list()
      const assignee = users.find((u) => u.id === patch.assignedTo)
      if (!assignee || assignee.role === "seller") return { ok: false, error: "Enquiries can only be assigned to staff." }
    }
    await store.enquiries.update(id, patch)
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}

/** Internal notes: staff-only, never rendered on public pages. */
export async function addEnquiryNote(input: { enquiryId: string; body: string }): Promise<Result> {
  try {
    const user = await requireUser(STAFF_ROLES)
    const parsed = enquiryNoteSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid note." }
    const store = await getAdminStore()
    await store.enquiries.addNote({ ...parsed.data, authorId: user.id, authorName: user.fullName })
    revalidatePath("/admin/enquiries")
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}
