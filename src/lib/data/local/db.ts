import "server-only"
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { Role } from "@/config/property-options"
import { assertLocalBackendAllowed } from "@/lib/backend"
import { buildSeedProperties } from "@/lib/data/seed"
import type { Enquiry, EnquiryNote, Property, SiteSettings, UserProfile } from "@/types/domain"

/**
 * Persistence for demo/development mode.
 * On serverless environments (Vercel, AWS Lambda), the filesystem outside /tmp is read-only.
 * We prioritize in-memory caching and /tmp fallback so that queries never throw runtime errors.
 */

export const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join(os.tmpdir(), "yaam-data")
    : path.join(process.cwd(), ".data")
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads")
const DB_FILE = path.join(DATA_DIR, "db.json")

export interface LocalUser extends UserProfile {
  passwordHash: string
}

export interface LocalDb {
  version: 1
  properties: Property[]
  enquiries: Enquiry[]
  enquiryNotes: EnquiryNote[]
  users: LocalUser[]
  settings: Partial<SiteSettings> | null
}

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$")
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
  return timingSafeEqual(actual, expected)
}

function seedAdmin(): LocalUser {
  const email = (process.env.LOCAL_ADMIN_EMAIL ?? "admin@yaam.local").toLowerCase()
  const password = process.env.LOCAL_ADMIN_PASSWORD ?? "yaam-demo-admin"
  return {
    id: "user-admin",
    email,
    fullName: "Yaam Admin",
    role: "admin" satisfies Role,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  }
}

function freshDb(): LocalDb {
  return {
    version: 1,
    properties: buildSeedProperties(),
    enquiries: [],
    enquiryNotes: [],
    users: [seedAdmin()],
    settings: null,
  }
}

let memoryDb: LocalDb | null = null
let seeding: Promise<LocalDb> | null = null

async function load(): Promise<LocalDb> {
  assertLocalBackendAllowed()
  if (memoryDb) {
    return memoryDb
  }

  // 1. Try reading from DB_FILE (e.g. .data/db.json or /tmp/yaam-data/db.json)
  try {
    const raw = await readFile(DB_FILE, "utf8")
    memoryDb = JSON.parse(raw) as LocalDb
    return memoryDb
  } catch {
    // DB_FILE doesn't exist or is not readable yet
  }

  // 2. Fallback check: cwd .data/db.json if DB_FILE was redirected to tmp
  const defaultCwdDb = path.join(process.cwd(), ".data", "db.json")
  if (DB_FILE !== defaultCwdDb) {
    try {
      const raw = await readFile(defaultCwdDb, "utf8")
      memoryDb = JSON.parse(raw) as LocalDb
      return memoryDb
    } catch {
      // not bundled
    }
  }

  // 3. First run: seed exactly once in memory and attempt persistence
  seeding ??= (async () => {
    const db = freshDb()
    memoryDb = db
    await persist(db).catch(() => undefined)
    return db
  })().finally(() => {
    seeding = null
  })
  return seeding
}

async function persist(db: LocalDb) {
  memoryDb = db
  try {
    await mkdir(DATA_DIR, { recursive: true })
    const tmp = `${DB_FILE}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`
    await writeFile(tmp, JSON.stringify(db, null, 2))
    await rename(tmp, DB_FILE)
  } catch (err) {
    // If writing to DATA_DIR failed (e.g. read-only filesystem), try /tmp fallback
    const tmpDir = path.join(os.tmpdir(), "yaam-data")
    if (DATA_DIR !== tmpDir) {
      try {
        await mkdir(tmpDir, { recursive: true })
        const tmpFile = path.join(tmpDir, "db.json")
        await writeFile(tmpFile, JSON.stringify(db, null, 2))
        return
      } catch {
        // Fallback also failed
      }
    }
    console.warn("LocalDb: filesystem is read-only, continuing with in-memory state:", (err as Error).message)
  }
}

let queue: Promise<unknown> = Promise.resolve()

export async function readDb(): Promise<LocalDb> {
  await queue.catch(() => undefined)
  return load()
}

/** Run a read-modify-write transaction. Mutate `db` in place; return any value. */
export function mutateDb<T>(fn: (db: LocalDb) => T | Promise<T>): Promise<T> {
  const run = queue.catch(() => undefined).then(async () => {
    const db = await load()
    const result = await fn(db)
    await persist(db)
    return result
  })
  queue = run
  return run
}

export function newId(prefix: string) {
  return `${prefix}-${randomBytes(8).toString("hex")}`
}
