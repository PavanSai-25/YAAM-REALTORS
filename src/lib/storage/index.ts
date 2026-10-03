import "server-only"
import { randomUUID } from "node:crypto"
import { unlink } from "node:fs/promises"
import path from "node:path"
import { BACKEND } from "@/lib/backend"
import { signUploadToken } from "@/lib/auth/local-session"
import { UPLOAD_DIR } from "@/lib/data/local/db"
import type { MediaStorage, UploadTarget } from "@/lib/data/types"
import { sessionClient, STORAGE_BUCKET } from "@/lib/supabase/clients"
import type { SessionUser } from "@/types/domain"

/**
 * Images never pass through our server functions in production: the browser
 * resizes them (≤2400px WebP, EXIF stripped), asks for a short-lived signed
 * upload target, then uploads directly to storage with progress events.
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

/** Staff share one folder; sellers are confined to their own (enforced by storage RLS). */
export function newStoragePath(user: SessionUser, contentType: string) {
  const ext = EXT[contentType] ?? "bin"
  const folder = user.role === "seller" ? `sellers/${user.id}` : `properties/${new Date().getUTCFullYear()}`
  return `${folder}/${randomUUID()}.${ext}`
}

/** Guard against path traversal in anything that came back from the client. */
export function isSafeStoragePath(p: string) {
  return /^(properties\/\d{4}|sellers\/[A-Za-z0-9-]+)\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(p)
}

async function removeLocal(paths: string[]) {
  await Promise.all(
    paths.filter(isSafeStoragePath).map((p) => unlink(path.join(UPLOAD_DIR, p)).catch(() => undefined)),
  )
}

function localMedia(user: SessionUser): MediaStorage {
  return {
    async createUploadTarget({ storagePath }): Promise<UploadTarget> {
      const token = signUploadToken(storagePath, user.id)
      return {
        uploadUrl: `/api/uploads/local?path=${encodeURIComponent(storagePath)}&token=${encodeURIComponent(token)}`,
        method: "PUT",
        headers: {},
        publicUrl: `/media/${storagePath}`,
        storagePath,
      }
    },
    remove: removeLocal,
  }
}

async function supabaseStorage(): Promise<MediaStorage> {
  const sb = await sessionClient()
  const bucket = sb.storage.from(STORAGE_BUCKET)
  return {
    async createUploadTarget({ storagePath, contentType }) {
      const { data, error } = await bucket.createSignedUploadUrl(storagePath)
      if (error || !data) throw new Error(`Could not prepare upload: ${error?.message ?? "unknown error"}`)
      return {
        uploadUrl: data.signedUrl,
        method: "PUT",
        headers: { "content-type": contentType, "x-upsert": "false", "cache-control": "max-age=31536000" },
        publicUrl: bucket.getPublicUrl(storagePath).data.publicUrl,
        storagePath,
      }
    },
    async remove(paths) {
      const safe = paths.filter(isSafeStoragePath)
      if (safe.length) await bucket.remove(safe)
    },
  }
}

export async function getMediaStorage(user: SessionUser): Promise<MediaStorage> {
  return BACKEND === "supabase" ? supabaseStorage() : localMedia(user)
}

/** The only URL an uploaded object may be stored with — prevents injecting arbitrary image URLs. */
export function publicUrlFor(storagePath: string) {
  if (BACKEND === "supabase") {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")
    return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`
  }
  return `/media/${storagePath}`
}
