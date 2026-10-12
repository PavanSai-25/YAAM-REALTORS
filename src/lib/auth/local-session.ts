import "server-only"
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { DATA_DIR } from "@/lib/data/local/db"

/**
 * Signed session cookie for the local backend: base64url(payload).signature
 * The cookie is httpOnly + SameSite=Lax; the user record (and therefore the
 * role) is re-read from the database on every request, so role changes and
 * deletions take effect immediately.
 */

export const LOCAL_SESSION_COOKIE = "yaam_session"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

let secretCache: string | null = null

function secret() {
  if (secretCache) return secretCache
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32) {
    secretCache = process.env.AUTH_SECRET
    return secretCache
  }
  // Dev convenience: generate once and persist next to the local database.
  const file = path.join(DATA_DIR, ".auth-secret")
  try {
    secretCache = readFileSync(file, "utf8").trim()
  } catch {
    secretCache = randomBytes(48).toString("base64url")
    try {
      mkdirSync(DATA_DIR, { recursive: true })
      writeFileSync(file, secretCache, { mode: 0o600 })
    } catch {
      // In read-only serverless environments, keep the secret cached in memory
    }
  }
  return secretCache
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url")
}

export function createSessionToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
  ).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null
  const expected = Buffer.from(sign(payload))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number }
    if (typeof uid !== "string" || exp < Date.now() / 1000) return null
    return uid
  } catch {
    return null
  }
}

/** Short-lived HMAC token authorising one local upload to one path. */
export function signUploadToken(storagePath: string, userId: string) {
  const exp = Math.floor(Date.now() / 1000) + 15 * 60
  const data = `${storagePath}|${userId}|${exp}`
  return `${exp}.${sign(data)}`
}

export function verifyUploadToken(storagePath: string, userId: string, token: string) {
  const [expStr, signature] = token.split(".")
  const exp = Number(expStr)
  if (!signature || !Number.isFinite(exp) || exp < Date.now() / 1000) return false
  const expected = Buffer.from(sign(`${storagePath}|${userId}|${exp}`))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
