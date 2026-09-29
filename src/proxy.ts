import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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

  // Force sync the cookie so the client matches the server state
  response.cookies.set("NEXT_LOCALE", lang, { path: "/", maxAge: 31536000 });
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
    '/((?!api|_next/static|_next/image|favicon|logo|icon|manifest|apple-icon|workbox|sw\\.js).*)',
  ]
};
