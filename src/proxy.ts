import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Network-edge guard for /admin. This is an *optimistic* check only (cookie
 * present?) to bounce anonymous visitors early; the authoritative role check
 * happens server-side in every admin layout, page and action
 * (lib/auth/session.ts) and, with Supabase, again in Postgres RLS.
 *
 * With Supabase it also refreshes the auth session cookie.
 */
const LOCAL_COOKIE = "yaam_session"

function usesSupabase() {
  if (process.env.DATA_BACKEND === "local") return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLogin = pathname === "/admin/login"
  let response = NextResponse.next({ request })
  let signedIn = false

  if (usesSupabase()) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options)
        },
      },
    })
    const { data } = await supabase.auth.getClaims()
    signedIn = !!data?.claims
  } else {
    signedIn = !!request.cookies.get(LOCAL_COOKIE)?.value
  }

  if (!signedIn && !isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
