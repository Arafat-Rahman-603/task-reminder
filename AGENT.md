# Personal OS — Project State & Architecture (AGENT.md)

> **This is the single source of truth.** Updated: 2026-09-28. Reflects actual repository state.

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| **Name** | Personal OS |
| **Type** | B2C SaaS Web Application |
| **Purpose** | A flexible Personal Operating System — users manage productivity, life, money, ideas, and personal systems |
| **Stage** | Core MVP — Auth, Tasks, Ideas, Money, Custom DB, and navigation shell implemented |
| **Philosophy** | Modular (toggle on/off), strict navigation integrity (no broken links), server-side data trust |

---

## 2. TECH STACK

| Technology | Version | Why |
|---|---|---|
| Next.js | 16.3.6 (App Router) | Core framework, SSR + API routes |
| React | 19.2.8 | UI library |
| TypeScript | ^5 | Full type safety |
| Tailwind CSS | ^4 | Styling via CSS variables (`@theme`) |
| MongoDB + Mongoose | ^9.10.2 | Flexible schema for Custom Sections |
| NextAuth.js | ^4.24.15 | CredentialsProvider, JWT sessions |
| Brevo | API v3 | Transactional email |
| next-themes | ^0.4.6 | Dark/Light/System theme |
| Lucide React | ^1.48.0 | Icons |
| next-pwa | ^5.6.0 | PWA / Service Worker |
| Zod | ^3.25.76 | Input validation in Server Actions |
| React Hook Form | ^7.89.0 | Form state management |
| Zustand | ^5.0.15 | Installed, not yet actively used |
| bcryptjs | ^3.0.3 | Password hashing |
| Jest + ts-jest | ^30.5.2 | Unit/integration tests |
| mongodb-memory-server | ^11.3.0 | In-memory DB for tests |

---

## 3. DIRECTORY MAP

```
src/
  app/           — Next.js App Router pages, layouts, API routes
  components/    — Reusable UI: Sidebar, MobileNav, CommandMenu, ModuleGuard
  actions/       — Server Actions (DB mutations, validated with Zod)
  lib/           — DB connection, auth config, finance engine, email, env validation
  models/        — Mongoose schemas
    custom/      — CustomSection, CustomField, CustomRecord, CustomView
  config/        — SYSTEM_MODULES registry (modules.ts)
  types/         — TypeScript type declarations
__tests__/       — Jest test files
scripts/         — verify-routes.js (route consistency checker)
public/          — Static assets
```

---

## 4. ROUTE INVENTORY

### Public Routes
| Route | Purpose | Status |
|---|---|---|
| `/` | Landing page | IMPLEMENTED |
| `/login` | Login form | IMPLEMENTED |
| `/register` | Registration | IMPLEMENTED |
| `/forgot-password` | Password recovery UI | IMPLEMENTED (email delivery: manual config) |
| `/reset-password` | New password form | IMPLEMENTED |
| `/contact` | Contact form | IMPLEMENTED |

### Authenticated Routes
| Route | Purpose | Auth | Status |
|---|---|---|---|
| `/dashboard` | Overview — conditionally renders by enabled modules | Yes | IMPLEMENTED |
| `/onboarding` | First-run setup | Yes | IMPLEMENTED |
| `/dashboard/settings` | Theme + Module preferences | Yes | IMPLEMENTED |
| `/dashboard/today` | Daily focus (tasks) | Yes | IMPLEMENTED |
| `/dashboard/tasks` | Task CRUD | Yes | IMPLEMENTED |
| `/dashboard/ideas` | Idea capture | Yes | IMPLEMENTED |
| `/dashboard/money` | Finance overview | Yes | IMPLEMENTED |
| `/dashboard/money/accounts` | Account management | Yes | IMPLEMENTED |
| `/dashboard/money/accounts/new` | Create account | Yes | IMPLEMENTED |
| `/dashboard/money/transactions` | Transaction list | Yes | IMPLEMENTED |
| `/dashboard/money/transactions/new` | Log transaction | Yes | IMPLEMENTED |
| `/dashboard/custom/new` | Custom Section builder | Yes | IMPLEMENTED |
| `/dashboard/custom/[slug]` | Custom Section viewer | Yes | IMPLEMENTED |

### Hidden Routes (unimplemented — do NOT add navigation for these)
- `/dashboard/projects`, `/dashboard/calendar`, `/dashboard/routines`, `/dashboard/habits`
- `/dashboard/goals`, `/dashboard/notes`, `/dashboard/journal`, `/dashboard/investments`
- `/dashboard/reports`, `/dashboard/documents`, `/dashboard/contacts`

---

## 5. FEATURE INVENTORY

| Feature | Status | Notes |
|---|---|---|
| Landing page | IMPLEMENTED | |
| Register | IMPLEMENTED | bcrypt hash, User created |
| Login | IMPLEMENTED | NextAuth CredentialsProvider |
| Logout | IMPLEMENTED | `signOut()` |
| Forgot password | IMPLEMENTED (UI) | Email delivery requires Brevo config |
| Reset password | IMPLEMENTED (UI) | Token flow partially implemented |
| Dashboard overview | IMPLEMENTED | Conditionally renders by module state |
| Today | IMPLEMENTED | Task list, quick add |
| Tasks | IMPLEMENTED | Create, complete, delete, Zod-validated |
| Task edit (full form) | PARTIAL | `updateTask` action exists; full edit UI not built |
| Ideas | IMPLEMENTED | Create, view — no edit/delete UI yet |
| Money (accounts + transactions) | IMPLEMENTED | Decimal128 persistence, finance engine |
| Transfer transactions | IMPLEMENTED | Bidirectional linked records |
| Money (budgets/investments/reports) | NOT IMPLEMENTED | |
| Custom Sections (create schema) | IMPLEMENTED | |
| Custom Sections (view/records) | PARTIAL | Table view renders; Kanban/Gallery not built |
| Custom Section create new record | NOT IMPLEMENTED | No form on the slug page |
| Settings (Theme + Modules) | IMPLEMENTED | GET+POST API, Map-based user prefs |
| Module enable/disable | IMPLEMENTED | SYSTEM_MODULES registry + User preferences Map |
| Mobile navigation | IMPLEMENTED | Slide-in drawer + fixed top bar |
| Command menu (Cmd+K) | IMPLEMENTED | Quick navigation, filtered by enabled+implemented |
| Contact form | IMPLEMENTED | Brevo delivery; requires API key config |
| Global 404 | IMPLEMENTED | `src/app/not-found.tsx` |
| ModuleGuard | IMPLEMENTED | Disabled modules show `<ModuleDisabled>` not 404 |
| PWA | PARTIAL | Manifest + SW generated on build; offline sync not tested |
| Search | NOT IMPLEMENTED | Cmd+K is navigation-only |
| User profile page | NOT IMPLEMENTED | |
| Change password | NOT IMPLEMENTED | |
| Email verification | NOT IMPLEMENTED (backend) | `emailVerified` field exists in schema |
| Notifications | NOT IMPLEMENTED | |

---

## 6. DATABASE MODEL INVENTORY

### User (`src/models/User.ts`)
- Fields: `name`, `email`, `passwordHash`, `emailVerified`, `preferences.currency`, `preferences.theme`, `preferences.modules` (Mongoose `Map<string, boolean>`), `subscription`
- **Important**: `modules` is a flexible Map — any module ID can be stored without schema migrations.

### Task (`src/models/Task.ts`)
- Fields: `userId`, `title`, `description`, `priority` (Low/Medium/High/Urgent), `status` (Inbox/Planned/In Progress/Completed/Cancelled), `dueDate`, `tags`
- Index: `userId`

### Idea (`src/models/Idea.ts`)
- Fields: `userId`, `title`, `description`, `status`, `tags`
- Index: `userId`

### Account (`src/models/Account.ts`)
- Fields: `userId`, `name`, `type` (checking/savings/credit/investment/cash), `currency`, `balance` (Decimal128), `isActive`
- Index: `userId`

### Transaction (`src/models/Transaction.ts`)
- Fields: `userId`, `amount` (Decimal128), `currency`, `date`, `accountId`, `categoryId`, `description`, `type` (income/expense/transfer), `transferId`, `tags`
- Index: `userId`, `accountId`

### Category (`src/models/Category.ts`)
- Fields: `userId`, `name`, `type`, `color`

### CustomSection (`src/models/custom/CustomSection.ts`)
- Fields: `userId`, `name`, `slug`, `icon`, `description`, `layout`, `sortOrder`, `isActive`
- Unique index: `{ userId, slug }`

### CustomField (`src/models/custom/CustomField.ts`)
- Fields: `sectionId`, `name`, `type`, `sortOrder`, `required`, `options`

### CustomRecord (`src/models/custom/CustomRecord.ts`)
- Fields: `userId`, `sectionId`, `data` (Map/Mixed)

### CustomView (`src/models/custom/CustomView.ts`)
- Fields: `sectionId`, `userId`, `name`, `type`, `config`

### Other models (schemas exist, no actions/UI implemented)
- `Asset.ts`, `Debt.ts`, `Subscription.ts`, `Investment.ts`, `InvestmentTransaction.ts`
- `Project.ts`, `Goal.ts`, `Habit.ts`, `Routine.ts`, `CalendarEvent.ts`
- `Contact.ts`, `Document.ts`, `Reminder.ts`, `AuditLog.ts`, `VerificationToken.ts`

---

## 7. DATABASE RELATIONSHIPS

- `User` → Many → `Task`, `Idea`, `Account`, `Transaction`, `Category`, `CustomSection`, `CustomRecord`
- `Account` → Many → `Transaction` (via `accountId`)
- `Category` → Many → `Transaction` (via `categoryId`)
- `Transaction` ↔ `Transaction` (transfers linked via `transferId`)
- `CustomSection` → Many → `CustomField` (via `sectionId`)
- `CustomSection` → Many → `CustomRecord` (via `sectionId`)
- `CustomSection` → Many → `CustomView` (via `sectionId`)

---

## 8. TENANCY / MULTI-USER SECURITY

- **Session**: NextAuth JWT, server-side only via `getServerSession(authOptions)`.
- **Rule**: Every query scoped by `userId` extracted from session — never from client input.
- **Verified implementations**: Tasks, Ideas, Accounts, Transactions, CustomSections, CustomRecords (strict section ownership applied).

---

## 9. AUTHENTICATION

- **Provider**: NextAuth CredentialsProvider
- **Strategy**: JWT (HttpOnly cookie)
- **Password**: bcrypt (bcryptjs)
- **No OTP on signup** — correct
- **No OTP on login** — correct
- **Forgot password**: UI exists, email sends OTP via Brevo — delivery requires credentials
- **Email verification**: `emailVerified` field exists in User schema but verification flow is NOT implemented
- **Route protection**: Dashboard layout redirects to `/login` if no session; redirects to `/onboarding` if no currency preference set

---

## 10. BREVO EMAIL

- **File**: `src/lib/email/` (directory with Brevo wrapper)
- **Method**: Direct POST to `api.brevo.com/v3/smtp/email` with `BREVO_API_KEY`
- **Status**: Code implemented. Real delivery requires valid environment variables.
- **Flows using it**: Contact form, forgot-password OTP (partially)

---

## 11. ENVIRONMENT VARIABLES

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | **YES** | MongoDB connection (standard replica set string) |
| `NEXTAUTH_URL` | **YES** (prod) | Full app URL |
| `NEXTAUTH_SECRET` | **YES** | JWT signing secret |
| `BREVO_API_KEY` | Optional | Brevo transactional email |
| `BREVO_SENDER_EMAIL` | Optional | Verified sender |
| `BREVO_SENDER_NAME` | Optional | Display name |
| `CONTACT_RECEIVER_EMAIL` | Optional | Where contact form goes |

**Validation**: `src/lib/env.ts` uses Zod to validate `MONGODB_URI` and `NEXTAUTH_SECRET` on startup (hard crash if missing).

---

## 12. FINANCIAL ENGINE

- **Location**: `src/lib/finance.ts`
- **Precision**: Integer cents internally (`toCents` / `toDecimal` helpers)
- **Functions**: `calculateNewBalance`, `calculateTransfer`, `calculateBudgetProgress`, `calculateNetWorth`
- **Decimal128**: MongoDB stores balances as `Decimal128`; parsed via `parseFloat(balance.toString())`
- **Transfer**: Bidirectional — creates two linked `Transaction` documents, updates both `Account` balances atomically via `Promise.all`
- **Important**: Balance update in `createTransaction` NOW routes through `calculateNewBalance()` — no direct float arithmetic

---

## 13. TESTING

| Suite | File | Tests | Status |
|---|---|---|---|
| Finance engine | `__tests__/finance.test.ts` | 7 | PASSING |
| Tenancy regression | `__tests__/tenancy.test.ts` | 3 | PASSING |

- **Total**: 10 tests, 10 passing
- **Missing**: `updateTask`, `deleteTask` tenancy tests; `createTransaction` Zod validation tests
- **Browser E2E**: BLOCKED (no automation available)
- **Route consistency**: `node scripts/verify-routes.js` — PASSES

---

## 14. NAVIGATION ARCHITECTURE

- **Registry**: `src/config/modules.ts` — `SYSTEM_MODULES` with `implemented: boolean` flag
- **Rule**: Navigation renders only modules where `implemented === true` AND user hasn't disabled it
- **Desktop Sidebar**: `src/components/Sidebar.tsx` — `hidden md:flex`
- **Mobile Drawer**: `src/components/MobileNav.tsx` — `md:hidden`, slide-in with fixed top bar at `h-14`
- **Command Menu**: `src/components/CommandMenu.tsx` — `Cmd+K`, filters `supportsQuickAdd && implemented`
- **Custom Sections**: Dynamically fetched from DB and injected into both Sidebar and MobileNav

---

## 15. UI / DESIGN SYSTEM

- **Tokens**: `src/app/globals.css` — CSS variables via Tailwind v4 `@theme`
- **Light mode**: `:root` block
- **Dark mode**: `.dark` class block (toggled by `next-themes`)
- **Key tokens**: `background`, `foreground`, `surface`, `elevated`, `primary`, `secondary`, `muted`, `success`, `warning`, `danger`, `border`, `focus`
- **Rule**: Always use semantic tokens (`bg-surface`, `text-foreground`) — never hardcode `zinc-*` or `gray-*`

---

## 16. CUSTOM SECTION SYSTEM

- **Create**: `POST /api/custom-sections` → `CustomSection` model
- **View**: `/dashboard/custom/[slug]` — resolves section by slug+userId
- **Fields**: Defined in `CustomField` documents linked to section
- **Records**: `CustomRecord` documents with dynamic `data` Map
- **Tenancy**: Verified at every step. `createCustomRecord` checks section ownership before record creation.

---

## 17. MODULE ENABLE/DISABLE SYSTEM

1. User toggles a switch in `/dashboard/settings`
2. Client calls `POST /api/user/preferences` with `{ modules: { [id]: boolean } }`
3. Server merges into `user.preferences.modules` (Mongoose Map)
4. `GET /api/user/preferences` returns current state (Map serialized to plain object)
5. Dashboard layout reads Map, serializes to plain object for client components
6. Sidebar/MobileNav/CommandMenu filter by enabled + implemented
7. Direct URL access to disabled module: `<ModuleGuard>` shows `<ModuleDisabled>` page

---

## 18. KNOWN BUGS / LIMITATIONS

1. **Task full-edit UI not built** — `updateTask` action exists but no edit form/dialog
3. **Idea edit/delete not built** — actions don't exist
4. **Account edit/delete not built** — actions don't exist
5. **Transaction delete/edit not built**
6. **Email verification flow not built** (backend)
7. **Change password not implemented**
8. **User profile page not implemented**
9. **Mobile: `p-8` on main content cuts off on very small screens** — adjust manually
10. **PWA offline behavior untested**
11. **Brevo credentials not configured** — email delivery requires manual setup
12. **Browser E2E testing unavailable**

---

## 19. DO NOT BREAK

1. Never expose `MONGODB_URI` or `BREVO_API_KEY` client-side.
2. Never trust client-supplied `userId`.
3. Never show navigation items without a real, implemented page behind them.
4. Never remove `<ModuleGuard>` from module pages.
5. Never change `Decimal128` balance storage to plain `Number`.
6. Never do float arithmetic on balances — always use `finance.ts` functions.
7. Never spread/merge user preferences without Map-aware handling.
8. Never count transfers as income or expense.

---

## 20. CODING CONVENTIONS

- **Server Components first** — `"use client"` only when hooks/state required
- **Server Actions for mutations** — not API routes where avoidable
- **Zod validation** — all Server Action inputs validated before DB writes
- **Design tokens** — `text-foreground`, `bg-surface`, `border-border` — no raw colors
- **Ownership check pattern**: `Model.findOne({ _id: id, userId })` — always include userId
- **Decimal128 serialization**: `serializeDoc()` helper converts `$numberDecimal` before returning

---

## 21. DEVELOPMENT COMMANDS

```bash
npm run dev           # Development server (uses --webpack for next-pwa compat)
npm run build         # Production build
npm run test          # Jest tests
npx tsc --noEmit      # TypeScript type check
node scripts/verify-routes.js  # Route consistency audit
```

---

## 22. SETUP PROCESS

1. `npm install`
2. Copy `.env.example` → `.env.local`
3. Set `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
4. Optionally set Brevo vars for email
5. `npm run dev`

---

## 23. MANUAL CONFIGURATION REQUIRED

- `MONGODB_URI` — MongoDB Atlas replica set string
- `NEXTAUTH_SECRET` — Any strong random string
- `NEXTAUTH_URL` — Full URL (e.g., `http://localhost:3000`)
- `BREVO_API_KEY` — For email flows
- `CONTACT_RECEIVER_EMAIL` — For contact form delivery

---

## 24. FUTURE WORK (ranked by product impact)

1. Build idea edit/delete
3. Build full task edit UI
4. Build account edit/delete
5. Build transaction edit/delete
6. Implement email verification flow
7. Implement change password
8. Build user profile page
9. Implement custom record create form in slug page
10. Build Projects module (most requested productivity feature)
11. Build Goals module
12. Build Notes module
13. PWA offline safety audit
14. Global search across collections

---

## 25. RULES FOR FUTURE AI AGENTS

1. **Read this file first.** Don't guess project structure.
2. Check existing models/actions before creating new ones.
3. Never invent credentials. Never fake delivery.
4. Always scope DB queries with `userId` from session.
5. Use `calculateNewBalance()` from `lib/finance.ts` — never raw `+/-` on balances.
6. Use design tokens, not zinc/gray hardcoded classes.
7. Never show navigation to an unimplemented route.
8. Validate mutations with Zod before writing to DB.
9. Keep server-side logic in Server Actions or API routes — not client components.
10. Update this file after any architectural change.
11. Run `npx tsc --noEmit` and `npm test` after major changes.
12. The `User.preferences.modules` field is a Mongoose `Map` — serialize with `Object.fromEntries()` before passing to client.

---

## 26. CURRENT STATE SUMMARY

| Area | Status |
|---|---|
| Authentication | IMPLEMENTED |
| Navigation shell (desktop + mobile) | IMPLEMENTED |
| Tasks | IMPLEMENTED |
| Ideas | PARTIAL (no edit/delete) |
| Money (accounts + transactions + transfers) | IMPLEMENTED |
| Custom Section builder | PARTIAL (create schema; records need form) |
| Module enable/disable | IMPLEMENTED |
| Settings | IMPLEMENTED |
| Mobile navigation | IMPLEMENTED |
| Financial engine (precision math) | IMPLEMENTED + TESTED |
| Tenancy isolation | IMPLEMENTED (one known gap in CustomRecord) |
| Tests | 10/10 passing |
| TypeScript | CLEAN (0 errors) |
| PWA | PARTIAL |
| Email | PARTIAL (code ready; credentials manual) |
| Search | NOT IMPLEMENTED |
| Profile/Account management | NOT IMPLEMENTED |
