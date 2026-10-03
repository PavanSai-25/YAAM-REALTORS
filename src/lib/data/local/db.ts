import "server-only"
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Role } from "@/config/property-options"
import { assertLocalBackendAllowed } from "@/lib/backend"
import { buildSeedProperties } from "@/lib/data/seed"
import type { Enquiry, EnquiryNote, Property, SiteSettings, UserProfile } from "@/types/domain"

/**
 * Development-only persistence: a single JSON document in .data/db.json.
 * Writes are serialised through a promise queue and committed atomically
 * (write temp file → rename) so a crash never leaves a half-written file.
 */

export const DATA_DIR = path.join(process.cwd(), ".data")
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

let seeding: Promise<LocalDb> | null = null

async function load(): Promise<LocalDb> {
  assertLocalBackendAllowed()
  try {
    return JSON.parse(await readFile(DB_FILE, "utf8")) as LocalDb
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
    // First run: seed exactly once even if many requests arrive together.
    seeding ??= (async () => {
      const db = freshDb()
      await persist(db)
      return db
    })().finally(() => {
      seeding = null
    })
    return seeding
  }
}

async function persist(db: LocalDb) {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${DB_FILE}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`
  await writeFile(tmp, JSON.stringify(db, null, 2))
  await rename(tmp, DB_FILE)
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
