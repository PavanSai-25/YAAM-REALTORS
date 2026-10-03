"use server"

import { redirect } from "next/navigation"
import { signIn, signOut } from "@/lib/auth/session"
import { rateLimit } from "@/lib/rate-limit"
import { loginSchema } from "@/lib/validations/settings"

export type LoginState = { error?: string; email?: string }

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : ""
  // Only same-site admin paths — prevents open redirects.
  return /^\/admin(\/[\w\-/?=&%.]*)?$/.test(next) && !next.startsWith("/admin/login") ? next : "/admin"
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
  if (!(await rateLimit("login", 8, 10 * 60_000))) {
    return { error: "Too many sign-in attempts. Please wait a few minutes.", email }
  }
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") })
  if (!parsed.success) return { error: "Enter your email and password.", email }

  const result = await signIn(parsed.data.email, parsed.data.password)
  if (!result.ok) return { error: result.error, email }
  redirect(safeNext(formData.get("next")))
}

export async function logoutAction() {
  await signOut()
  redirect("/admin/login")
}
