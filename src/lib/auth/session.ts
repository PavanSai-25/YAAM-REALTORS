import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import type { Role } from "@/config/property-options"
import { BACKEND } from "@/lib/backend"
import { hashPassword, readDb, verifyPassword } from "@/lib/data/local/db"
import { sessionClient } from "@/lib/supabase/clients"
import type { SessionUser } from "@/types/domain"
import { createSessionToken, LOCAL_SESSION_COOKIE, readSessionToken, SESSION_TTL_SECONDS } from "./local-session"

/**
 * Server-side identity + authorization. UI hiding is cosmetic; these checks
 * are what actually protect admin pages, server actions and route handlers.
 */

export const STAFF_ROLES: Role[] = ["admin", "staff"]
export const ALL_ROLES: Role[] = ["admin", "staff", "seller"]

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message)
  }
}

/** Current user, resolved once per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (BACKEND === "supabase") {
    const sb = await sessionClient()
    const { data, error } = await sb.auth.getUser()
    if (error || !data.user) return null
    const { data: profile } = await sb.from("profiles").select("full_name, role, email").eq("id", data.user.id).maybeSingle()
    if (!profile) return null
    return {
      id: data.user.id,
      email: profile.email || data.user.email || "",
      fullName: profile.full_name || data.user.email || "User",
      role: profile.role as Role,
    }
  }

  const store = await cookies()
  const uid = readSessionToken(store.get(LOCAL_SESSION_COOKIE)?.value)
  if (!uid) return null
  const db = await readDb()
  const user = db.users.find((u) => u.id === uid)
  return user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role } : null
})

/** For pages/layouts: redirect instead of throwing. */
export async function requirePageUser(roles: Role[] = ALL_ROLES, next = "/admin"): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(next)}`)
  if (!roles.includes(user.role)) redirect("/admin?denied=1")
  return user
}

/** For server actions + route handlers. */
export async function requireUser(roles: Role[] = ALL_ROLES): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new AuthError("Please sign in again.", 401)
  if (!roles.includes(user.role)) throw new AuthError("You don't have permission to do that.", 403)
  return user
}

export function isStaff(user: Pick<SessionUser, "role">) {
  return STAFF_ROLES.includes(user.role)
}

let dummyHash: string | undefined

export async function signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const generic = "Incorrect email or password."
  if (BACKEND === "supabase") {
    const sb = await sessionClient()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    return error ? { ok: false, error: generic } : { ok: true }
  }

  const db = await readDb()
  const user = db.users.find((u) => u.email === email.toLowerCase())
  // Always run the hash comparison so timing doesn't reveal which emails exist.
  dummyHash ??= hashPassword("timing-equaliser")
  const ok = verifyPassword(password, user?.passwordHash ?? dummyHash)
  if (!user || !ok) return { ok: false, error: generic }
  const store = await cookies()
  store.set(LOCAL_SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https"),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
  return { ok: true }
}

export async function signOut() {
  if (BACKEND === "supabase") {
    const sb = await sessionClient()
    await sb.auth.signOut()
    return
  }
  const store = await cookies()
  store.delete(LOCAL_SESSION_COOKIE)
}
