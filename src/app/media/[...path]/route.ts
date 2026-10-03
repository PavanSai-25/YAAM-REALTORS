import { readFile } from "node:fs/promises"
import path from "node:path"
import { BACKEND } from "@/lib/backend"
import { UPLOAD_DIR } from "@/lib/data/local/db"
import { isSafeStoragePath } from "@/lib/storage"

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" }

/** Serves locally uploaded images (local backend only; Supabase serves its own public URLs). */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  if (BACKEND !== "local") return new Response("Not found", { status: 404 })
  const { path: parts } = await ctx.params
  const storagePath = parts.join("/")
  if (!isSafeStoragePath(storagePath)) return new Response("Not found", { status: 404 })
  try {
    const file = await readFile(path.join(UPLOAD_DIR, storagePath))
    return new Response(new Uint8Array(file), {
      headers: {
        "content-type": TYPES[path.extname(storagePath).slice(1)] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
