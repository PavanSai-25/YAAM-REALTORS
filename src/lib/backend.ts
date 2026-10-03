import "server-only"

/**
 * Which backend the app talks to.
 *
 * - "supabase": production. Postgres + Auth + Storage with RLS.
 * - "local":    development/demo only. JSON file in .data/, uploads on disk,
 *               signed-cookie admin session. Refuses to run on Vercel because
 *               serverless filesystems are ephemeral.
 *
 * Selected automatically from env; override with DATA_BACKEND.
 */
export type Backend = "supabase" | "local"

function resolveBackend(): Backend {
  const explicit = process.env.DATA_BACKEND
  if (explicit === "supabase" || explicit === "local") return explicit
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "supabase"
    : "local"
}

export const BACKEND: Backend = resolveBackend()

export function assertLocalBackendAllowed() {
  if (BACKEND === "local" && process.env.VERCEL) {
    throw new Error(
      "The local data backend cannot run on Vercel. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }
}
