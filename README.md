# West Bengal Labour Department — Unified Portal Dashboard (SSO)

A Single Sign-On (SSO) platform and consolidated dashboard for the **Labour Department, Government of West Bengal**. It allows applicants and department officers to log in once and see **only** the department portals they are entitled to access (e.g. Factory Licensing Portal, BOCW Welfare Board, etc.). Clicking any portal tile launches that portal via a secure, tamper-proof, single-use signed token handoff (RS256 JWT) without requiring a second login.

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v20+ (tested on Node.js v24+)
- **npm**: v10+ (npm workspaces)
- **PostgreSQL**: Locally installed and running on port 5432
- **Zero Containers**: Runs 100% natively on Windows, macOS, or Linux.

### 1. Create Local Database
Connect to PostgreSQL and create the database:
```sql
CREATE DATABASE wb_sso;
```

### 2. Setup the Project
Run the automated setup script:
```bash
npm run setup
```
This command copies `.env.example` to `.env`, generates 2048-bit RS256 RSA keys, compiles shared packages, pushes the Prisma database schema, and seeds test accounts.

### 3. Start All Services
```bash
npm run dev
```

All 4 services will start concurrently:
- 🌐 **Unified Dashboard (React 19)**: [http://localhost:5173](http://localhost:5173)
- ⚙️ **Central Identity & SSO API (NestJS)**: [http://localhost:3000](http://localhost:3000)
- 📚 **Swagger OpenAPI Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- 🔑 **JWKS Public Key Endpoint**: [http://localhost:3000/.well-known/jwks.json](http://localhost:3000/.well-known/jwks.json)
- 🏭 **Mock Factory Portal**: [http://localhost:4001](http://localhost:4001)
- 🤝 **Mock Labour Welfare Portal B**: [http://localhost:4002](http://localhost:4002)

---

## 👥 Seeded Test Accounts (Fake Data)

Use these accounts to test the different entitlement tiers and role views:

| Account Type | Username | Password | Entitled Portals (Strict Filter) |
|---|---|---|---|
| **System Admin** | `admin_wb` | `Admin@WB2026` | Full Admin Console (Portals, Accounts, Audit Logs) |
| **Applicant A** | `applicant_factory` | `Pass@WB2026` | **1 Tile**: Only Factory Portal |
| **Applicant B** | `applicant_both` | `Pass@WB2026` | **2 Tiles**: Factory Portal + Labour Welfare Portal B |
| **Officer 1** | `officer_factory` | `Pass@WB2026` | Factory Portal (Senior Inspector role + 12 pending dossiers) |
| **Officer 2** | `officer_general` | `Pass@WB2026` | Labour Welfare Portal B (Welfare Officer role) |

*💡 Dev Mock OTP: You can also choose the "Login using Dev Mock OTP" option on the login card with code `123456`.*

---

## 🏛️ Key Features

1. **Strict Entitlement Mirroring**:
   - `applicant_factory` sees **only 1 tile**.
   - `applicant_both` sees **2 tiles**.
   - `shops-establishments-portal` (Portal C) is in the directory but has 0 linked accounts, proving unauthorized portals are never rendered.
2. **Tamper-Proof Single-Use SSO Launch**:
   - Launching a portal signs a 60-second RS256 JWT with claims: `sub`, `portal_user_id`, `portal_role`, `aud`, `jti`, `exp`.
   - The mock portals verify against the JWKS endpoint and burn the token via `POST /api/v1/portals/verify-handoff`.
   - Replay attacks are automatically blocked if the launch callback is reloaded.
3. **Account Revocation Enforcement**:
   - Revoking an account in the Admin Console (`admin_wb`) immediately removes the tile from the applicant's dashboard on reload.
4. **Bilingual Support (English & Bengali)**:
   - Full UI toggle (`English` / `বাংলা`) with bundled Noto Sans and Noto Sans Bengali fonts.
5. **GIGW 3.0 & WCAG 2.1 AA Accessibility**:
   - High-contrast mode via CSS variables (`[data-contrast="high"]`).
   - Text size resizing (`A-`, `A`, `A+`).
   - Skip to main content link and keyboard-friendly focus rings.
6. **Full Audit Trail**:
   - All logins, launches, linking, and admin revocations are permanently recorded in `AuditLog` and exportable as CSV.

---

## 🧪 Running Tests

- **API Integration Tests**: `npm run test:api`
- **Web Frontend Tests**: `npm run test:web`
- **Linting**: `npm run lint`

---

## 📖 Documentation
- [Local Developer Setup](docs/local-setup.md)
- [Architecture & Design Decisions](docs/architecture.md)
- [Secure SSO Handoff Protocol](docs/sso-handoff.md)
- [Adding a Department Portal](docs/adding-a-portal.md)
