# Local Developer Setup Guide

This guide walks you through running the West Bengal Labour Department Unified Portal Dashboard (SSO) natively on your local developer machine (Windows, macOS, or Linux).

---

## 1. Prerequisites

- **Node.js**: v20.x or higher (tested on Node.js v24+)
- **npm**: v10.x or higher (npm workspaces enabled)
- **PostgreSQL**: Locally installed PostgreSQL 15, 16, or 17 (listening on port `5432`)
- **No Docker / No Containers**: All services run natively as Node.js processes.

---

## 2. Database Preparation

1. Connect to your local PostgreSQL instance:
   ```bash
   psql -U postgres -h localhost
   ```
2. Create the unified SSO database:
   ```sql
   CREATE DATABASE wb_sso;
   ```
3. Grant permissions if using a non-default user:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE wb_sso TO postgres;
   ```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `DATABASE_URL` matches your local credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wb_sso?schema=public"
```

---

## 4. Setup Project with One Command

Run the setup automation script:
```bash
npm run setup
```

This single command automatically:
1. Copies `.env.example` to `.env` (if not present).
2. Generates a local 2048-bit RS256 RSA keypair in `apps/api/keys/` (`private.pem` and `public.pem`).
3. Installs dependencies across all workspaces.
4. Generates the Prisma Client and pushes the database schema.
5. Seeds all test accounts, department portals, and initial notifications.

---

## 5. Starting All Services

Start the entire platform with a single command:
```bash
npm run dev
```

This launches four services concurrently:
| Service | URL | Description |
|---|---|---|
| **Unified Portal Dashboard** (Web) | `http://localhost:5173` | React 19 Frontend |
| **Central Identity & SSO API** | `http://localhost:3000` | NestJS Core Backend |
| **API Documentation (Swagger)** | `http://localhost:3000/api/docs` | OpenAPI Specification |
| **JWKS Public Key Endpoint** | `http://localhost:3000/.well-known/jwks.json` | Token verification |
| **Mock Factory Licensing Portal** | `http://localhost:4001` | Mock Portal A |
| **Mock BOCW Labour Welfare Portal** | `http://localhost:4002` | Mock Portal B |

---

## 6. Seeded Test Accounts

| User Type | Username | Password | Entitled Portals |
|---|---|---|---|
| **Admin** | `admin_wb` | `Admin@WB2026` | Admin Console access |
| **Applicant A** | `applicant_factory` | `Pass@WB2026` | Factory Portal only |
| **Applicant B** | `applicant_both` | `Pass@WB2026` | Factory Portal + Labour Welfare Portal B |
| **Officer 1** | `officer_factory` | `Pass@WB2026` | Factory Portal (Inspector role) |
| **Officer 2** | `officer_general` | `Pass@WB2026` | Labour Welfare Portal B (Welfare Officer) |

*Dev Mock OTP Code (if choosing OTP login): `123456`*
