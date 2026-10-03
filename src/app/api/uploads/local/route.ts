import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { verifyUploadToken } from "@/lib/auth/local-session"
import { getSessionUser } from "@/lib/auth/session"
import { BACKEND } from "@/lib/backend"
import { UPLOAD_DIR } from "@/lib/data/local/db"
import { isSafeStoragePath, MAX_UPLOAD_BYTES } from "@/lib/storage"

/** Magic-byte sniffing so a renamed non-image can't be stored. */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg"
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png"
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp"
  if (buf.subarray(4, 12).toString("ascii").startsWith("ftypavi")) return "avif"
  return null
}

/** Local-backend equivalent of a Supabase signed upload URL. */
export async function PUT(request: Request) {
  if (BACKEND !== "local") return NextResponse.json({ error: "Not available" }, { status: 404 })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 })

  const url = new URL(request.url)
  const storagePath = url.searchParams.get("path") ?? ""
  const token = url.searchParams.get("token") ?? ""
  if (!isSafeStoragePath(storagePath) || !verifyUploadToken(storagePath, user.id, token)) {
    return NextResponse.json({ error: "Upload link expired. Please try again." }, { status: 403 })
  }
  const length = Number(request.headers.get("content-length") ?? 0)
  if (length > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image is larger than 10 MB." }, { status: 413 })

  const buf = Buffer.from(await request.arrayBuffer())
  if (buf.length > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image is larger than 10 MB." }, { status: 413 })
  const kind = sniff(buf)
  if (!kind || path.extname(storagePath).slice(1) !== kind) {
    return NextResponse.json({ error: "That file isn't a supported image." }, { status: 415 })
  }

  const target = path.join(UPLOAD_DIR, storagePath)
  if (!target.startsWith(UPLOAD_DIR + path.sep)) return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, buf, { flag: "wx" }).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "EEXIST") throw err
  })
  return NextResponse.json({ ok: true }, { status: 201 })
}
