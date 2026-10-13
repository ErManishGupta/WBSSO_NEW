# Implementation Plan: West Bengal Labour Department Unified Portal Dashboard

The **Unified Portal Dashboard** is a Single Sign-On (SSO) platform for the West Bengal Labour Department. It allows applicants and department officers to log in once and see **only** the department portals they are entitled to access (e.g. Factory Portal, Boilers Portal, Shops & Establishments, etc.). Clicking any portal tile launches that portal via a secure, tamper-proof, single-use signed token handoff (RS256 JWT) without requiring a second login.

---

## 1. Architecture Overview

### 1.1 Monorepo Structure (npm workspaces)
- `apps/web`: **React 19+** (`^19.0.0`) / Vite 6+ / TypeScript 5.7+, Tailwind CSS with design tokens, Radix UI primitives, TanStack Query v5, Zustand v5, react-i18next v15, lucide-react. Port **5173**.
- `apps/api`: NestJS 11+ / TypeScript 5.7+, Prisma ORM 6+, PostgreSQL, argon2 password hashing, RS256 token signing with jose / node:crypto, Swagger OpenAPI docs. Port **3000**.
- `apps/mock-factory-portal`: Express mock service for WB Factory Licensing Portal verifying SSO handoff against the JWKS endpoint. Port **4001**.
- `apps/mock-portal-b`: Express mock service for WB Labour Welfare Portal B verifying SSO handoff against the JWKS endpoint. Port **4002**.
- `packages/ui`: Design tokens (navy, saffron, green, canvas, surface), shared React 19 components, buttons, dialogs, badges.
- `packages/types`: Shared TypeScript models, SSO payload contracts, DTO interfaces.
- `scripts/`: Cross-platform Node.js automation scripts (`setup.mjs`, `generate-keys.mjs`, etc.).
- `ai-services/`: Architectural extension point with placeholder `README.md` (no AI code executed in this phase).
- `docs/`: `architecture.md`, `sso-handoff.md`, `adding-a-portal.md`, `local-setup.md`.

---

## 2. Milestones & Task Breakdown

### Milestone 1: Monorepo Setup, Scripts, Prisma Schema & Seed (M1)
- [ ] Initialize root `package.json` with npm workspaces (`apps/*`, `packages/*`).
- [ ] Configure ESLint, Prettier, TypeScript base configs (`tsconfig.base.json`).
- [ ] Set up `packages/types` and `packages/ui`.
- [ ] Set up `apps/api` with NestJS scaffolding and Prisma schema:
  - Models: `User`, `Session`, `Portal`, `PortalAccount`, `LaunchToken`, `Notification`, `AuditLog`.
  - Enums: `UserType` (APPLICANT, OFFICER, ADMIN), `PortalStatus` (ACTIVE, MAINTENANCE, DISABLED), `AccountStatus` (ACTIVE, SUSPENDED, REVOKED), `LinkingMethod` (OIDC_FEDERATION, SIGNED_TOKEN_HANDOFF, CONSENT_LINK), `NotificationLevel` (INFO, ACTION, WARNING).
- [ ] Implement `scripts/setup.mjs` (copies `.env.example` -> `.env`, generates RSA keys, runs `prisma migrate` / `db push`, seeds data).
- [ ] Create seed script with:
  - 1 Admin (`admin_wb` / `Admin@WB2026`)
  - 2 Applicants:
    - `applicant_factory` (linked only to Factory Portal) / `Pass@WB2026`
    - `applicant_both` (linked to Factory Portal + Portal B) / `Pass@WB2026`
  - 2 Officers:
    - `officer_factory` (Officer role in Factory Portal) / `Pass@WB2026`
    - `officer_general` (Officer role in Portal B) / `Pass@WB2026`
  - 3 Portals:
    - Factory Portal (active)
    - Labour Welfare Portal B (active)
    - Boilers & Inspection Portal C (active, unlinked to show zero unauthorized tiles)
  - Sample notifications for each user.
- [ ] Verification: run setup script, inspect database tables, capture screenshot / verify health.

### Milestone 2: Built-in Auth, Session Management & Login Page (M2)
- [ ] Implement `IdentityProvider` interface and `LocalIdentityProvider` in `apps/api`:
  - Password verification with `argon2`.
  - Failed login tracking (lockout for 15 minutes after 5 failed attempts).
  - Dev mock OTP flow (verification code `123456` logged in console when OTP flag is enabled).
  - Server-side session generation stored in PostgreSQL `Session` table.
  - Set `httpOnly; Secure; SameSite=Lax` session cookie (`wb_sso_session`).
- [ ] API endpoints:
  - `POST /api/v1/auth/login` (username/password)
  - `POST /api/v1/auth/otp/verify`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/me` (current authenticated user + session)
  - `GET /api/v1/me/sessions` and `DELETE /api/v1/me/sessions/:id`
- [ ] Build Login Page in `apps/web`:
  - Split layout: Left banner with Government of West Bengal Labour Department identity, trust badges (Single Login, Strictly Entitled Portals, Audited Access).
  - Right card: Tabbed username/mobile login, password, OTP toggle, language switcher, validation with React Hook Form + Zod.
  - Error alert for locked accounts or invalid credentials.
- [ ] Screenshots & responsive check: Desktop (1440px), Tablet (820px), Mobile (390px).

### Milestone 3: Design System, Layout Shell & Accessibility (M3)
- [ ] Design tokens implementation:
  - Navy `#14306B`, Navy Dark `#0D2049`, Accent Saffron `#F28C28`, Success Green `#138A36`, Canvas `#F4F6FA`, Surface `#FFFFFF`, Border `#D9DFEA`.
  - High-contrast mode tokens via CSS custom variables (`[data-contrast="high"]`).
  - Text resizing support (Normal, Large +20%, Extra Large +40% via `data-text-size`).
- [ ] Bilingual support (react-i18next): English (`en`) and Bengali (`bn`) with Noto Sans & Noto Sans Bengali.
- [ ] Layout Shell:
  - Top 3px subtle tricolour strip.
  - Utility Bar: Skip to main content link, text size controls (A- A A+), high-contrast toggle, language selector (EN / বাংলা).
  - Identity Bar: Neutral State Emblem placeholder component with explanatory comment, "Government of West Bengal | Labour Department" (পশ্চিমবঙ্গ সরকার | শ্রম দপ্তর).
  - User Menu: User avatar, name, role badge, session status, profile/settings link, sign out button.
  - Footer: GIGW compliant links (Privacy Policy, Terms of Use, Accessibility Statement, Help & Feedback, Last Updated, 24x7 Helpline).
- [ ] Screenshots & responsive check: Desktop (1440px), Tablet (820px), Mobile (390px).

### Milestone 4: Entitlement-Based Dashboard & Notifications (M4)
- [ ] Dashboard API: `GET /api/v1/dashboard`:
  - Queries user's `PortalAccount` records with status `ACTIVE`.
  - Filters out unentitled portals entirely (no greyed-out unauthorized tiles).
  - Returns portal metadata, user's portal role, and pending action counts for officers.
- [ ] Build Dashboard UI:
  - Welcome greeting: "Welcome, {name}", User Type chip (Applicant / Officer / Admin), last login timestamp.
  - "My Portals" grid:
    - Portal card with bilingual title, description, role chip (e.g. "Licensed Factory Occupier" or "Inspector"), status badge (Active), pending badge if officer, and "Open portal" button.
    - "Link another portal" dashed card (always rendered last in the grid).
  - Right sidebar:
    - Notifications tabbed panel (All / Action Needed) with unread count and mark-as-read action.
    - Quick links and Help & Support helpline card.
  - Extension point: Docked placeholder for "AI Assistant" (hidden when flag `VITE_ENABLE_AI_ASSISTANT=false`).
- [ ] Screenshots & responsive check for Applicant A (1 tile), Applicant B (2 tiles), Officer (with badge).

### Milestone 5: Secure Portal SSO Launch & Mock Portals (M5)
- [ ] RS256 Keypair generation in `apps/api/keys/` (`jwt-private.pem`, `jwt-public.pem`).
- [ ] API Endpoints:
  - `GET /.well-known/jwks.json` (public RSA key in standard JWKS format).
  - `POST /api/v1/portals/:id/launch`:
    - Checks entitlement and portal status.
    - Creates `LaunchToken` record with unique UUID `jti`, 60-second expiration.
    - Signs RS256 JWT with claims: `sub`, `portal_user_id`, `portal_role`, `aud`, `jti`, `exp`.
    - Logs launch in `AuditLog`.
    - Returns launch URL (e.g. `http://localhost:4001/sso/callback?token=...`).
- [ ] Mock Portals (`apps/mock-factory-portal` on 4001, `apps/mock-portal-b` on 4002):
  - Fetches JWKS from `http://localhost:3000/.well-known/jwks.json`.
  - Verifies token signature, audience, and expiration.
  - Calls `POST /api/v1/portals/verify-handoff` to mark token as used (blocks replay attacks).
  - Displays authenticated portal landing page showing user details and role.
- [ ] Replay test: re-submitting the same token fails with 401 Unauthorized / Token already used.
- [ ] Screenshots of portal launch and authenticated landing page.

### Milestone 6: Portal Linking & Unlinking Flow (M6)
- [ ] API Endpoints:
  - `GET /api/v1/portals/linkable` (portals eligible for linking, not yet active for user).
  - `POST /api/v1/portals/:id/link/start`:
    - Generates linking challenge/session (Consent OTP or Mock Portal Credential proof).
  - `POST /api/v1/portals/:id/link/confirm`:
    - Verifies proof, creates `PortalAccount` record, audits event.
  - `DELETE /api/v1/portals/:id/link`:
    - Unlinks portal, records in `AuditLog`.
- [ ] UI: Stepper Dialog:
  - Step 1: Select available portal. Notice: "We only connect accounts you already have. No new access is created."
  - Step 2: Verification (Portal Reference ID / OTP or portal credential challenge).
  - Step 3: Confirmation and immediate tile addition.
  - Unlink option from portal menu with confirmation modal.
- [ ] Screenshots & verification.

### Milestone 7: Admin Console & Audit Log (M7)
- [ ] Admin API (`apps/api` with AdminGuard):
  - `GET /api/v1/admin/portals`, `POST /api/v1/admin/portals`, `PUT /api/v1/admin/portals/:id`
  - `GET /api/v1/admin/accounts`, `PATCH /api/v1/admin/accounts/:id` (Suspend / Revoke / Activate)
  - `GET /api/v1/admin/audit` (paginated, filtered by actor, action, date range, entity)
  - `GET /api/v1/admin/audit/export` (CSV export)
- [ ] Admin UI:
  - Portals management table with status switcher and Add/Edit drawer.
  - Accounts management table with Revoke/Suspend actions.
  - Audit log table with search, action filter, date range filter, and CSV download button.
- [ ] Screenshots & test verifying account revocation immediately hides the portal on the applicant's dashboard.

### Milestone 8: Hardening, Automated Tests, Accessibility (Axe) & Documentation (M8)
- [ ] Automated tests:
  - Unit/Component tests in `apps/web` with Vitest and React Testing Library.
  - API integration tests in `apps/api` with Jest and Supertest.
  - End-to-end flows in Playwright (Login -> Dashboard -> SSO Launch -> Link Portal -> Admin Revocation).
  - Automated Axe accessibility checks with 0 critical/serious violations.
- [ ] Security hardening:
  - Helmet headers, CORS policies, rate-limiting on `/auth/*` and `/launch`.
  - Session timeout modal (warns at 14 minutes, logs out at 15 minutes of inactivity).
- [ ] Documentation:
  - `docs/local-setup.md`, `docs/architecture.md`, `docs/sso-handoff.md`, `docs/adding-a-portal.md`.
  - Root `README.md` with credentials table, quickstart, and architecture summary.

---

## 3. Technology Stack & Packages (Latest Stable 2026/2025)
 
| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js 20+, npm workspaces | Node 24+ / npm 11+ |
| Web Frontend | React 19+, Vite 6, TypeScript 5.7+ | `react@^19.0.0`, `vite@^6.2.0`, `typescript@^5.7.3` |
| UI & State | Tailwind CSS, Radix UI (React 19), TanStack Query v5, Zustand v5 | `@tanstack/react-query@^5.66.0`, `zustand@^5.0.3` |
| Form & Validation | React Hook Form, Zod | `react-hook-form@^7.54.2`, `zod@^3.24.2` |
| Internationalization | react-i18next, i18next | `react-i18next@^15.4.1`, `i18next@^24.2.2` |
| Icons & Fonts | Lucide React, Fontsource Noto Sans & Bengali | `lucide-react@^1.16.0`, `@fontsource/noto-sans`, `@fontsource/noto-sans-bengali` |
| Backend API | NestJS 11, TypeScript 5.7+ | `@nestjs/core@^11.0.10`, `@nestjs/common@^11.0.10` |
| ORM & Database | Prisma ORM 6, PostgreSQL | `@prisma/client@^6.4.0`, `prisma@^6.4.0` |
| Cryptography & Auth | argon2, jose (RS256 JWT & JWKS) | `argon2@^0.41.1`, `jose@^5.9.6`, `cookie-parser@^1.4.7` |
| Mock Portals | Express 4/5 | `express@^4.21.2` |
| Testing | Vitest, React Testing Library, Jest, Supertest, Playwright, axe-core | Latest stable releases |
| Code Quality | ESLint, Prettier | Latest |
