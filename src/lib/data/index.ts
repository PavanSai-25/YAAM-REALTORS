import "server-only"
import { BACKEND } from "@/lib/backend"
import { localAdminStore, localPublicStore } from "@/lib/data/local/store"
import { createSupabaseAdminStore, supabasePublicStore } from "@/lib/data/supabase/store"
import type { AdminDataStore, PublicDataStore } from "@/lib/data/types"

/**
 * Entry point for all data access. Pages and actions import from here and
 * never touch a driver directly.
 *
 * getAdminStore() must only be called after an authorization check
 * (see lib/auth/session.ts). With Supabase it additionally runs every query as
 * the signed-in user so RLS is a second line of defence.
 */
export function getPublicStore(): PublicDataStore {
  return BACKEND === "supabase" ? supabasePublicStore : localPublicStore
}

export async function getAdminStore(): Promise<AdminDataStore> {
  return BACKEND === "supabase" ? createSupabaseAdminStore() : localAdminStore
}
