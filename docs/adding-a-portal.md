# Adding a Department Portal Guide

Adding a new portal to the Unified Portal Dashboard is **purely configuration-driven**. You never need to edit the frontend dashboard source code or deploy frontend changes.

---

## Method 1: Using the Admin Console UI

1. Sign in with the administrator account (`admin_wb` / `Admin@WB2026`).
2. Click **Admin Console** in the user menu.
3. In the **Department Portals** tab, click **+ Add New Portal**.
4. Fill in the configuration fields:
   - **Slug**: Unique URL-safe identifier (e.g. `boilers-portal`)
   - **Name (English & Bengali)**: Display name in both official languages
   - **Description (English & Bengali)**: Brief summary of statutory services
   - **Base URL & Launch URL**: Destination endpoint (e.g. `https://boilers.wb.gov.in/sso/callback`)
   - **Linking Method**: `SIGNED_TOKEN_HANDOFF` or `CONSENT_LINK`
   - **Allowed User Types**: `[APPLICANT, OFFICER]`
5. Click Save. The portal is immediately available in the directory.

---

## Method 2: Via Database Seed / Migration

Insert a record into the `Portal` table:

```sql
INSERT INTO "Portal" (
  id,
  slug,
  "nameEn",
  "nameBn",
  "descriptionEn",
  "descriptionBn",
  "iconKey",
  "baseUrl",
  "launchUrl",
  "linkingMethod",
  status,
  "allowedUserTypes",
  "sortOrder"
) VALUES (
  gen_random_uuid(),
  'boilers-portal',
  'WB Directorate of Boilers Portal',
  'পশ্চিমবঙ্গ বয়লার অধিকার পোর্টাল',
  'Statutory boiler inspection certificates and renewal filings',
  'সংবিধিবদ্ধ বয়লার পরিদর্শন শংসাপত্র ও পুনর্নবীকরণ',
  'Layers',
  'http://localhost:4003',
  'http://localhost:4003/sso/callback',
  'SIGNED_TOKEN_HANDOFF',
  'ACTIVE',
  ARRAY['APPLICANT'::"UserType", 'OFFICER'::"UserType"],
  4
);
```

---

## Portal Destination Integration Checklist

To accept SSO handoff, the new portal simply needs:
1. Verify token signature against `http://localhost:3000/.well-known/jwks.json`.
2. Check `aud` matches its configured slug.
3. Call `POST http://localhost:3000/api/v1/portals/verify-handoff` with `{ jti, portalSlug }` to mark the token as used.
