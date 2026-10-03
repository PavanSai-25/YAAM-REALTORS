"use server"

import { revalidatePath } from "next/cache"
import { AuthError, requireUser } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { createUserSchema, siteSettingsSchema, updateRoleSchema, type SiteSettingsInput } from "@/lib/validations/settings"

type Result = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> }

function failure(err: unknown): Result {
  if (err instanceof AuthError) return { ok: false, error: err.message }
  console.error("[admin]", err)
  return { ok: false, error: err instanceof Error && err.message.length < 140 ? err.message : "Something went wrong." }
}

export async function saveSiteSettings(input: SiteSettingsInput): Promise<Result> {
  try {
    await requireUser(["admin"])
    const parsed = siteSettingsSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors }
    }
    await (await getAdminStore()).saveSettings(parsed.data)
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}

export async function createUser(input: { email: string; fullName: string; role: string; password: string }): Promise<Result> {
  try {
    await requireUser(["admin"])
    const parsed = createUserSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." }
    const store = await getAdminStore()
    if (!store.users.canCreateUsers()) return { ok: false, error: "Creating users needs SUPABASE_SERVICE_ROLE_KEY on the server." }
    await store.users.create(parsed.data)
    revalidatePath("/admin/staff")
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}

export async function updateUserRole(input: { userId: string; role: string }): Promise<Result> {
  try {
    const me = await requireUser(["admin"])
    const parsed = updateRoleSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: "Invalid role." }
    if (parsed.data.userId === me.id && parsed.data.role !== "admin") {
      return { ok: false, error: "You can't remove your own admin access." }
    }
    await (await getAdminStore()).users.updateRole(parsed.data.userId, parsed.data.role)
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}
