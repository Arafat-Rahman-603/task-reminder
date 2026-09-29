# Manageo — Project State & Architecture (AGENT.md)

> **This is the single source of truth.** Updated: 2026-09-28. Reflects actual repository state.

---

## 1. PROJECT IDENTITY

| Field          | Value                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| **Name**       | Manageo                                                                                                     |
| **Type**       | B2C SaaS Web Application                                                                                    |
| **Purpose**    | A flexible Personal Operating System — users manage productivity, life, money, ideas, and personal systems  |
| **Stage**      | Core MVP — Auth, Tasks, Ideas, Money, Custom DB, Dashboards, and navigation shell implemented               |
| **Philosophy** | Modular (toggle on/off), strict navigation integrity, strict visual design (Stitch), server-side data trust |

---

## 2. TECH STACK

| Technology            | Version             | Why                                  |
| --------------------- | ------------------- | ------------------------------------ |
| Next.js               | 16.3.6 (App Router) | Core framework, SSR + API routes     |
| React                 | 19.2.8              | UI library                           |
| TypeScript            | ^5                  | Full type safety                     |
| Tailwind CSS          | ^4                  | Styling via CSS variables (`@theme`) |
| MongoDB + Mongoose    | ^9.10.2             | Flexible schema for Custom Sections  |
| NextAuth.js           | ^4.24.15            | CredentialsProvider, JWT sessions    |
| Brevo                 | API v3              | Transactional email                  |
| Lucide React          | ^1.48.0             | Icons                                |
| next-pwa              | ^5.6.0              | PWA / Service Worker                 |
| Zod                   | ^3.25.76            | Input validation in Server Actions   |
| React Hook Form       | ^7.89.0             | Form state management                |
| Zustand               | ^5.0.15             | Installed, not yet actively used     |
| bcryptjs              | ^3.0.3              | Password hashing                     |
| Jest + ts-jest        | ^30.5.2             | Unit/integration tests               |
| mongodb-memory-server | ^11.3.0             | In-memory DB for tests               |

---

## 3. DIRECTORY MAP

```
src/
  app/           — Next.js App Router pages, layouts, API routes
  components/    — Reusable UI: Sidebar, MobileNav, CommandMenu, ModuleGuard
    dashboard/   — Dashboard Block Engine, custom section renders
  actions/       — Server Actions (DB mutations, validated with Zod)
  lib/           — DB connection, auth config, finance engine, email, env validation
  models/        — Mongoose schemas
    custom/      — CustomSection, CustomField, CustomRecord, CustomView, DashboardBlock
  config/        — SYSTEM_MODULES registry (modules.ts)
  types/         — TypeScript type declarations
__tests__/       — Jest test files
scripts/         — verify-routes.js (route consistency checker)
public/          — Static assets
```

---

## 4. ROUTE INVENTORY

### Public Routes

| Route              | Purpose              | Status      |
| ------------------ | -------------------- | ----------- |
| `/`                | Landing page         | IMPLEMENTED |
| `/login`           | Login form           | IMPLEMENTED |
| `/register`        | Registration         | IMPLEMENTED |
| `/forgot-password` | Password recovery UI | IMPLEMENTED |
| `/reset-password`  | New password form    | IMPLEMENTED |
| `/contact`         | Contact form         | IMPLEMENTED |

### Authenticated Routes

| Route                               | Purpose                                             | Auth | Status      |
| ----------------------------------- | --------------------------------------------------- | ---- | ----------- |
| `/dashboard`                        | Overview — conditionally renders by enabled modules | Yes  | IMPLEMENTED |
| `/onboarding`                       | First-run setup                                     | Yes  | IMPLEMENTED |
| `/dashboard/settings`               | Control Center (Modules, Nav, Sections, Profile)    | Yes  | IMPLEMENTED |
| `/dashboard/today`                  | Daily focus (tasks)                                 | Yes  | IMPLEMENTED |
| `/dashboard/tasks`                  | Task CRUD                                           | Yes  | IMPLEMENTED |
| `/dashboard/ideas`                  | Idea capture                                        | Yes  | IMPLEMENTED |
| `/dashboard/money`                  | Finance overview                                    | Yes  | IMPLEMENTED |
| `/dashboard/money/accounts`         | Account management                                  | Yes  | IMPLEMENTED |
| `/dashboard/money/accounts/new`     | Create account                                      | Yes  | IMPLEMENTED |
| `/dashboard/money/transactions`     | Transaction list                                    | Yes  | IMPLEMENTED |
| `/dashboard/money/transactions/new` | Log transaction                                     | Yes  | IMPLEMENTED |
| `/dashboard/custom/new`             | Custom Section builder                              | Yes  | IMPLEMENTED |
| `/dashboard/custom/[slug]`          | Custom Section viewer                               | Yes  | IMPLEMENTED |

---

## 5. FEATURE INVENTORY

| Feature                         | Status      | Notes                                                    |
| ------------------------------- | ----------- | -------------------------------------------------------- |
| Landing page                    | IMPLEMENTED |                                                          |
| Register                        | IMPLEMENTED | bcrypt hash, User created                                |
| Login                           | IMPLEMENTED | NextAuth CredentialsProvider                             |
| Logout                          | IMPLEMENTED | `signOut()`                                              |
| Dashboard overview              | IMPLEMENTED | Fixed layout                                             |
| Today                           | IMPLEMENTED | Task list, quick add                                     |
| Tasks                           | IMPLEMENTED | Create, complete, delete, Zod-validated                  |
| Ideas                           | IMPLEMENTED | Create, view                                             |
| Money (accounts + transactions) | IMPLEMENTED | Decimal128 persistence, finance engine                   |
| Transfer transactions           | IMPLEMENTED | Bidirectional linked records                             |
| Settings Control Center         | IMPLEMENTED | Module Management, Nav Builder, Section Lifecycle        |
| Navigation Builder              | IMPLEMENTED | Rename, move items, custom groups                        |
| Custom Sections (Schema)        | IMPLEMENTED |                                                          |
| Custom Sections (Dashboards)    | IMPLEMENTED | `DashboardBlockEngine.tsx`                               |
| Dashboard Blocks                | IMPLEMENTED | Stat, progress, chart, list, table, status_summary, text |
| Module enable/disable           | IMPLEMENTED | SYSTEM_MODULES registry + User preferences Map           |
| Mobile navigation               | IMPLEMENTED | Slide-in drawer + fixed top bar                          |
| Command menu (Cmd+K)            | IMPLEMENTED | Quick navigation, filtered by enabled+implemented        |
| Contact form                    | IMPLEMENTED | Brevo delivery                                           |
| ModuleGuard                     | IMPLEMENTED | Disabled modules show `<ModuleDisabled>` not 404         |

---

## 6. DATABASE MODEL INVENTORY

### User (`src/models/User.ts`)

- Fields: `name`, `email`, `passwordHash`, `emailVerified`, `preferences.currency`, `preferences.modules` (Mongoose `Map<string, boolean>`), `subscription`

### NavigationGroup (`src/models/NavigationGroup.ts`)

- Fields: `userId`, `name`, `sortOrder`, `isCollapsed`, `items` (Array of mapped modules/sections)

### Custom Models (`src/models/custom/`)

- `CustomSection`: Schema for user-created databases
- `CustomField`: Column definitions
- `CustomRecord`: Row data (Map/Mixed)
- `DashboardBlock`: Configurable blocks (type, config, width) for Custom Dashboards

---

## 7. TENANCY / MULTI-USER SECURITY

- **Session**: NextAuth JWT, server-side only via `getServerSession(authOptions)`.
- **Rule**: Every query scoped by `userId` extracted from session — never from client input.
- **Verified implementations**: Tasks, Ideas, Accounts, Transactions, CustomSections, CustomRecords.

---

## 8. DESIGN SYSTEM (STITCH)

- **Tokens**: `src/app/globals.css` — CSS variables via Tailwind v4 `@theme`
- **Theme**: Light/Dark theme selector was REMOVED. The system is forced to `dark` using the authorized Stitch aesthetics.
- **Key tokens**: `background`, `surface`, `primary`, `surface-container`, `surface-container-high`.
- **Rule**: Always use semantic tokens (`bg-surface-container`, `text-on-surface`) — never hardcode `zinc-*` or `gray-*`.

---

## 9. NAVIGATION ARCHITECTURE

- **Resolver**: `getResolvedNavigation()` merges `SYSTEM_MODULES`, user module preferences, and `NavigationGroup` configurations.
- **Desktop Sidebar**: `src/components/Sidebar.tsx` reads resolved `NavGroup`s.
- **Mobile Drawer**: `src/components/MobileNav.tsx` reads resolved `NavGroup`s.
- **Command Menu**: `src/components/CommandMenu.tsx`.

---

## 10. RULES FOR FUTURE AI AGENTS

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
12. **The theme system is DEAD. Do not attempt to add light mode or a theme switcher back.**

---

## 11. RECENT IMPLEMENTATIONS (Tasks, Routines, Notifications)

### Task Fields & slug
- Rebuilt with full schedulable fields: `title`, `description`, `status` (Inbox/Planned/In Progress/Completed/Cancelled), `priority`, `dueDate`, `dueTime`, `startDate`, `startTime`, `recurringSchedule`, `tags`.
- Every task receives a unique user-scoped `slug`.

### Task Settings
- Stored in User Preferences (`taskSettings.defaultPriority`, `taskSettings.defaultView`, `taskSettings.hideCompleted`).
- Defaults are automatically applied in UI and filtering logic.

### Filters & UI
- Progressive disclosure forms (Modals/Drawers) implemented for new creations.
- Clean toolbars provide `Search`, `Filter`, `List/Kanban` views.
- Filters actually restrict data shown on the client based on Priority, Due Date (today/overdue), and Time of Day (Routines).

### Routine Scheduling
- Routines include `startDate`, `startTime`, `schedule` (Daily or Weekdays array), `timeOfDay`, and `recurrence`.
- Individual routine items support `isCompleted` and `durationMinutes`.

### Reminder & Notification Engine
- **Centralized Engine**: Actions create generalized `Reminder` documents (entityType, entityId, remindAt).
- **Automatic Reminder Creation**: Creating a task/routine with a `reminderTime` creates a linked Reminder record in DB.
- **Delivery Strategy**: Notifications are delivered via a polling mechanism inside `NotificationsButton.tsx` (checks `/api/notifications` every 5 minutes).
- **Limitations**: The PWA currently relies on open-app polling. It does not yet implement background Service Worker Web Push (which requires VAPID setup and push subscriptions), so it will not behave like a native alarm clock if the app is closed on iOS/Android.

### Date Range
- System includes a reusable `DateRangeSelector` to filter tasks and routines based on standardized period presets.

### PWA Behavior
- Investigating mobile shortcut vs WebAPK installability. Handled via `manifest.json`, `next-pwa`, and Cloudflare Tunnel bypass rules. Mobile install behavior can be blocked by development tunnels without proper SSL intercept definitions.

### Tests
- Type checking (`tsc --noEmit`) passes correctly.
- Manual browser UI flows verified (creation, filtering, reminders, view switching).
