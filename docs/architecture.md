# Platform Architecture Specification

## 1. System Overview

The **Unified Portal Dashboard** for the West Bengal Labour Department provides Single Sign-On (SSO) and consolidated entitlement discovery.

### Core Architectural Principles
1. **Zero-Widening Entitlement Mirror**: The dashboard never grants or widens permissions. It acts as a strict reflector of rights already held by the user in each department portal.
2. **Invisible Unauthorized Portals**: Portals the citizen or officer is not entitled to access are **never rendered** (no greyed-out or teased tiles).
3. **Zero Credential Sharing**: The platform never handles, caches, or stores passwords for individual department portals.
4. **Configuration-Driven Portals**: Every portal is registered via a database config record. Adding a portal requires zero code changes in the dashboard.
5. **Short-Lived, Burn-on-Use SSO Tokens**: Portal handoff is executed using RS256 signed JWTs with a 60-second expiration. Every token `jti` is tracked and burned upon consumption, preventing replay attacks.
6. **Pluggable Identity Provider**: The built-in NestJS identity module sits behind an `IdentityProvider` interface, allowing future migration to Keycloak, NIC SSO, or statewide OIDC providers without modifying dashboard logic.

---

## 2. Monorepo Workspaces (`npm workspaces`)

```
/
├── apps/
│   ├── web/                     # React 19 + Vite 6 + Tailwind CSS + TanStack Query
│   ├── api/                     # NestJS 11 + Prisma ORM 6 + Argon2 + JOSE
│   ├── mock-factory-portal/     # Express mock service (Port 4001)
│   └── mock-portal-b/           # Express mock service (Port 4002)
├── packages/
│   ├── ui/                      # Shared React 19 components & design tokens
│   └── types/                   # Shared TypeScript models and DTOs
├── scripts/                     # Automation helpers (setup.mjs, generate-keys.mjs)
├── ai-services/                 # Clean extension point (reserved for future phase)
└── docs/                        # Technical documentation & guides
```

---

## 3. Security & Compliance (GIGW 3.0 & WCAG 2.1 AA)

- **Session Security**: Server-side sessions stored in PostgreSQL. Session cookies use `httpOnly; Secure; SameSite=Lax`.
- **Brute Force Protection**: Automatic lockout for 15 minutes after 5 consecutive failed login attempts.
- **Activity Monitoring**: Session timeout modal warns users at 14 minutes of inactivity and automatically logs out at 15 minutes.
- **Full Audit Trail**: Every authentication, portal launch, link, unlink, and administrative change is permanently recorded in `AuditLog`.
- **Accessibility**: High-contrast mode via CSS custom variables (`[data-contrast="high"]`), text resizing (`A-`, `A`, `A+`), semantic landmarks, and bilingual support (English and Bengali).
