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
  const isEnglishPath = pathname === "/en" || pathname.startsWith("/en/");

  const rewriteUrl = req.nextUrl.clone();
  let isRewrite = false;

  // Path-based routing: /en/* is rewritten onto the internal route tree.
  if (isEnglishPath) {
    const newPath = pathname.replace(/^\/en/, "") || "/";
    rewriteUrl.pathname = newPath;
    isRewrite = true;
  }

  // An explicit /en URL always renders English so both language versions stay
  // distinct for search engines. Otherwise the cookie is the source of truth and,
  // for authenticated users, the session token wins.
  let lang = isEnglishPath ? "en" : req.cookies.get("NEXT_LOCALE")?.value || "es";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!isEnglishPath && token && (token as any).language) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lang = (token as any).language;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-language', lang);
  // Internal (rewritten) path so server components can build canonical URLs and
  // structured data without re-deriving the /en prefix.
  requestHeaders.set('x-pathname', rewriteUrl.pathname);

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

  // Only set the cookie if missing or changed, avoiding unnecessary Set-Cookie overhead and preserving cacheability.
  // Path-localized (/en) requests never write the cookie: a crawl of /en must not
  // change the visitor's stored language preference.
  const currentLocaleCookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (!isEnglishPath && currentLocaleCookie !== lang) {
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
