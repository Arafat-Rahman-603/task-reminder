<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Application Status & Routes

## Public Routes
- / (Landing Page)
- /features (Features Overview)
- /pricing (Pricing Info)
- /security (Security Overview)
- /about (About Us)
- /faq (Frequently Asked Questions)

## Legal Pages
- /terms (Terms of Service)
- /privacy (Privacy Policy)
- /cookies (Cookie Policy)
- /financial-disclaimer (Financial Disclaimer)
- /acceptable-use (Acceptable Use Policy)
- /contact (Contact Form)

## Auth & Support Pages
- /login
- /register
- /forgot-password
- /reset-password
- /verify-email (If configured)

## Cookie Behavior
- Only essential cookies (NextAuth authentication, session state) are used.
- No analytics or tracking cookies are currently implemented.

## SEO Structure
- Marketing pages use static metadata headers for SEO.
- A sitemap/robots.txt can be served dynamically if needed.

## Manual Review Needed
- Legal pages (Terms, Privacy, Cookies, Disclaimer, Acceptable Use) are templates based on common practices. They REQUIRE review by legal counsel before public launch.
- Pricing page currently displays a placeholder 'Free' early access message.

