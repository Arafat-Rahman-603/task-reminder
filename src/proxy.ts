import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  // Fast path: Only decrypt/verify JWT if NextAuth session cookies are present
  const hasSessionCookie = 
    req.cookies.has("next-auth.session-token") || 
    req.cookies.has("__Secure-next-auth.session-token");

  const token = hasSessionCookie 
    ? await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) 
    : null;

  const { pathname } = req.nextUrl;
  
  // Public routes that should redirect to dashboard if authenticated
  const publicAuthRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/en", "/en/login", "/en/register"];
  
  if (token && publicAuthRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Internationalization Rewrite
  let lang = req.cookies.get("NEXT_LOCALE")?.value || "es";
  
  // If user is authenticated, the token is the absolute source of truth for language
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (token && (token as any).language) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lang = (token as any).language;
  }
  
  const rewriteUrl = req.nextUrl.clone();
  let isRewrite = false;

  // Keep legacy path-based routing just in case
  if (pathname.startsWith("/en/") || pathname === "/en") {
    const newPath = pathname.replace(/^\/en/, "") || "/";
    rewriteUrl.pathname = newPath;
    isRewrite = true;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-language', lang);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isRewrite) {
    response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Only set the cookie if missing or changed, avoiding unnecessary Set-Cookie overhead and preserving cacheability
  const currentLocaleCookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (currentLocaleCookie !== lang) {
    response.cookies.set("NEXT_LOCALE", lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png, icons, manifest (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon|logo|icon|manifest|apple-icon|workbox|sw\\.js|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|ttf|woff|woff2|json|txt|xml)$).*)',
  ]
};
