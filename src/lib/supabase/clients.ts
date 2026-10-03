import "server-only"
import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Three clients, three trust levels:
 *
 *  - publicClient():  anon key, no cookies. Used by public pages so they can be
 *                     statically cached. RLS limits it to published content.
 *  - sessionClient(): anon key + the visitor's auth cookies. Every admin query
 *                     runs as the signed-in user, so RLS enforces roles even if
 *                     an app-level check were missed.
 *  - serviceClient(): service-role key. Bypasses RLS. Used ONLY for creating
 *                     staff accounts. Never imported by client components
 *                     ("server-only" guarantees that at build time).
 */

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)")
  return { url, anonKey }
}

let cachedPublic: SupabaseClient | null = null

export function publicClient() {
  if (!cachedPublic) {
    const { url, anonKey } = env()
    cachedPublic = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cachedPublic
}

export async function sessionClient() {
  const { url, anonKey } = env()
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a Server Component render: cookies are read-only there.
          // proxy.ts refreshes the session cookie on the next request instead.
        }
      },
    },
  })
}

export function serviceClient() {
  const { url } = env()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "property-images"
