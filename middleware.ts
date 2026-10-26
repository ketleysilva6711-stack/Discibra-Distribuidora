// =============================================================================
// PROXY — Next.js 16 (replaces middleware.ts)
// Security headers, session management, admin route protection
// =============================================================================
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Rotas públicas que não precisam de autenticação
const PUBLIC_PATHS = [
  "/admin/login",
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/images",
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  )
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-Frame-Options", "DENY")
  headers.set("X-XSS-Protection", "1; mode=block")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  headers.set("Robots-Tag", "index, follow")
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    )
  }
  if (response.headers.get("x-api-route")) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")
  }
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  applySecurityHeaders(response)

  // ─── EARLY RETURN PARA ROTAS PÚBLICAS (Visitantes do anúncio não pagam pedágio) ───
  const requiresAuth = pathname.startsWith("/admin") || pathname.startsWith("/minha-conta") || pathname.startsWith("/api/admin")
  if (!requiresAuth || pathname.startsWith("/admin/login")) {
    return response
  }

  // ─── APENAS ROTAS PROTEGIDAS EXECUTAM AUTH NO SUPABASE ───
  let supabaseResponse = response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/admin/login"
      redirectUrl.searchParams.set("error", "nao_autenticado")
      const redirectRes = NextResponse.redirect(redirectUrl)
      supabaseResponse.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value, c))
      return redirectRes
    }
  }

  if (pathname.startsWith("/minha-conta") && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirect", "/minha-conta")
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|.*\\.(?:css|woff|woff2|ttf|eot)$).*)",
  ],
}

// Mantém updateSession para compatibilidade
export { updateSession }

export default middleware
