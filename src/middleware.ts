import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  
  // Public routes that should redirect to dashboard if authenticated
  const publicAuthRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/en", "/en/login", "/en/register"];
  
  if (token && publicAuthRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Internationalization Rewrite
  let lang = req.cookies.get("NEXT_LOCALE")?.value || "es";
  let rewriteUrl = req.nextUrl.clone();
  let isRewrite = false;

  // Keep legacy path-based routing just in case
  if (pathname.startsWith("/en/") || pathname === "/en") {
    lang = "en";
    const newPath = pathname.replace(/^\/en/, "") || "/";
    rewriteUrl.pathname = newPath;
    isRewrite = true;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-language', lang);

  if (isRewrite) {
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|opengraph-image|robots.txt|sitemap.xml).*)',
  ]
};
