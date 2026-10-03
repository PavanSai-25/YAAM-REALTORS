"use server"

import { revalidatePath } from "next/cache"
import type { PropertyStatus } from "@/config/property-options"
import { AuthError, isStaff, requireUser, STAFF_ROLES } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { buildPropertySlug, uniqueSlug } from "@/lib/slug"
import { ALLOWED_IMAGE_TYPES, getMediaStorage, isSafeStoragePath, MAX_UPLOAD_BYTES, newStoragePath, publicUrlFor } from "@/lib/storage"
import type { UploadTarget } from "@/lib/data/types"
import {
  bulkActionSchema,
  propertyInputSchema,
  reviewDecisionSchema,
  type PropertyInput,
} from "@/lib/validations/property"
import type { Property, SessionUser } from "@/types/domain"

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

const SELLER_EDITABLE: PropertyStatus[] = ["draft", "pending_review", "changes_requested"]

function failure(err: unknown): { ok: false; error: string } {
  if (err instanceof AuthError) return { ok: false, error: err.message }
  console.error("[properties]", err)
  const msg = err instanceof Error ? err.message : ""
  if (/duplicate key|unique/i.test(msg)) return { ok: false, error: "A property with this URL already exists. Please try again." }
  return { ok: false, error: "Something went wrong. Please try again." }
}

function revalidatePublic(slugs: string[] = []) {
  revalidatePath("/", "layout")
  for (const s of slugs) revalidatePath(`/properties/${s}`)
}

/** Only images that live in our own storage (or were already on the listing) may be saved. */
function validateImages(images: PropertyInput["images"], user: SessionUser, existing: Property | null) {
  const known = new Set(existing?.images.map((i) => i.url) ?? [])
  for (const img of images) {
    if (known.has(img.url)) continue
    if (!img.storagePath || !isSafeStoragePath(img.storagePath)) return "One of the images is invalid. Please re-upload it."
    if (img.url !== publicUrlFor(img.storagePath)) return "One of the images is invalid. Please re-upload it."
    if (user.role === "seller" && !img.storagePath.startsWith(`sellers/${user.id}/`)) return "One of the images is invalid."
  }
  return null
}

export async function saveProperty(
  id: string | null,
  input: PropertyInput,
): Promise<ActionResult<{ id: string; slug: string; status: PropertyStatus }>> {
  try {
    const user = await requireUser()
    const parsed = propertyInputSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".")
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors }
    }
    const data = { ...parsed.data }
    const store = await getAdminStore()
    const existing = id ? await store.properties.getById(id) : null
    if (id && !existing) return { ok: false, error: "This property no longer exists." }

    if (!isStaff(user)) {
      if (existing && (existing.createdBy !== user.id || !SELLER_EDITABLE.includes(existing.status))) {
        return { ok: false, error: "This submission can no longer be edited. Contact Yaam to make changes." }
      }
      data.status = data.status === "draft" ? "draft" : "pending_review"
      data.featured = false
      data.verified = false
    }

    const imageError = validateImages(data.images, user, existing)
    if (imageError) return { ok: false, error: imageError, fieldErrors: { images: imageError } }

    let saved: Property
    if (existing) {
      saved = await store.properties.update(existing.id, {
        ...data,
        slug: existing.slug, // stable URLs: slugs never change after creation
        isDemo: existing.isDemo,
        reviewNotes: isStaff(user) ? existing.reviewNotes : undefined,
      })
      const kept = new Set(saved.images.map((i) => i.storagePath))
      const removed = existing.images.map((i) => i.storagePath).filter((p): p is string => !!p && !kept.has(p))
      if (removed.length) await (await getMediaStorage(user)).remove(removed).catch(() => undefined)
    } else {
      const base = buildPropertySlug(data)
      const slug = await uniqueSlug(base, (s) => store.properties.isSlugTaken(s))
      try {
        saved = await store.properties.create({ ...data, slug }, user.id)
      } catch (err) {
        // A slug hidden from this user by RLS (another seller's draft) can still collide.
        if (!/duplicate key|unique/i.test(String(err))) throw err
        saved = await store.properties.create({ ...data, slug: `${slug}-${Date.now().toString(36)}` }, user.id)
      }
    }
    revalidatePublic([saved.slug])
    return { ok: true, data: { id: saved.id, slug: saved.slug, status: saved.status } }
  } catch (err) {
    return failure(err)
  }
}

const BULK_STATUS: Partial<Record<string, PropertyStatus>> = {
  publish: "published",
  unpublish: "draft",
  archive: "archived",
}

export async function bulkPropertyAction(input: { ids: string[]; action: string }): Promise<ActionResult<{ count: number }>> {
  try {
    const parsed = bulkActionSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: "Invalid request." }
    const { ids, action } = parsed.data
    const user = await requireUser(action === "delete" ? ["admin"] : STAFF_ROLES)
    const store = await getAdminStore()

    if (action === "delete") {
      const paths = await store.properties.delete(ids)
      if (paths.length) await (await getMediaStorage(user)).remove(paths).catch(() => undefined)
      revalidatePublic()
      return { ok: true, data: { count: ids.length } }
    }
    const patch =
      action === "feature" ? { featured: true } : action === "unfeature" ? { featured: false } : { status: BULK_STATUS[action] }
    const count = await store.properties.bulkUpdate(ids, patch)
    revalidatePublic()
    return { ok: true, data: { count } }
  } catch (err) {
    return failure(err)
  }
}

export async function setPropertyStatus(id: string, status: PropertyStatus): Promise<ActionResult> {
  try {
    await requireUser(STAFF_ROLES)
    const store = await getAdminStore()
    const p = await store.properties.getById(id)
    if (!p) return { ok: false, error: "Property not found." }
    await store.properties.bulkUpdate([id], { status })
    revalidatePublic([p.slug])
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}

/** Sellers may delete their own unpublished submissions; everything else is admin-only. */
export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const store = await getAdminStore()
    const p = await store.properties.getById(id)
    if (!p) return { ok: false, error: "Property not found." }
    const sellerOwnDraft = user.role === "seller" && p.createdBy === user.id && ["draft", "changes_requested", "rejected"].includes(p.status)
    if (user.role !== "admin" && !sellerOwnDraft) return { ok: false, error: "You don't have permission to delete this property." }
    const paths = await store.properties.delete([id])
    if (paths.length) await (await getMediaStorage(user)).remove(paths).catch(() => undefined)
    revalidatePublic([p.slug])
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}

export async function reviewSubmission(input: { id: string; decision: string; notes: string }): Promise<ActionResult> {
  try {
    await requireUser(STAFF_ROLES)
    const parsed = reviewDecisionSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: "Invalid request." }
    const { id, decision, notes } = parsed.data
    if (decision !== "approve" && !notes) return { ok: false, error: "Add a note so the seller knows what to change." }
    const status: PropertyStatus = decision === "approve" ? "published" : decision === "reject" ? "rejected" : "changes_requested"
    const store = await getAdminStore()
    const p = await store.properties.getById(id)
    if (!p) return { ok: false, error: "Submission not found." }
    await store.properties.setReview(id, status, notes || null)
    revalidatePublic([p.slug])
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}

export async function requestUploadTargets(
  files: { contentType: string; size: number }[],
): Promise<ActionResult<UploadTarget[]>> {
  try {
    const user = await requireUser()
    if (!Array.isArray(files) || files.length === 0 || files.length > 20) return { ok: false, error: "Upload up to 20 images at a time." }
    for (const f of files) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.contentType)) return { ok: false, error: "Only JPEG, PNG, WebP or AVIF images are allowed." }
      if (!(f.size > 0 && f.size <= MAX_UPLOAD_BYTES)) return { ok: false, error: "Each image must be under 10 MB." }
    }
    const storage = await getMediaStorage(user)
    const targets = await Promise.all(
      files.map((f) => storage.createUploadTarget({ storagePath: newStoragePath(user, f.contentType), contentType: f.contentType })),
    )
    return { ok: true, data: targets }
  } catch (err) {
    return failure(err)
  }
}
