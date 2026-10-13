# Secure SSO Token Handoff Protocol

## 1. Sequence Diagram

```
Citizen / Officer         Unified Web (5173)         Central API (3000)         Factory Portal (4001)
       |                          |                         |                            |
       | 1. Click "Open portal"   |                         |                            |
       |------------------------->| 2. POST /launch         |                            |
       |                          |------------------------>|                            |
       |                          |                         | 3. Create JTI & sign       |
       |                          |                         |    RS256 JWT (60s exp)     |
       |                          | 4. Return Launch URL    |<---------------------------|
       |                          |<------------------------|                            |
       | 5. Redirect browser      |                         |                            |
       |-------------------------------------------------------------------------------->|
       |                          |                         | 6. Fetch JWKS              |
       |                          |                         |<---------------------------|
       |                          |                         |    GET /.well-known/jwks.json
       |                          |                         |--------------------------->|
       |                          |                         | 7. Verify Signature        |
       |                          |                         | 8. Burn Token (Single Use) |
       |                          |                         |<---------------------------|
       |                          |                         |    POST /verify-handoff    |
       |                          |                         |--------------------------->|
       | 9. Render Authenticated Dashboard                  |                            |
       |<--------------------------------------------------------------------------------|
```

---

## 2. Token Claims Specification

Tokens are signed using **RS256** (RSA Signature with SHA-256) with a 2048-bit private key.

| Claim | Type | Description |
|---|---|---|
| `sub` | `string` | Central platform user UUID |
| `portal_user_id` | `string` | External citizen/officer ID within target portal (e.g. `FAC-LIC-77012`) |
| `portal_role` | `string` | Role mapped inside portal (e.g. `Factory Occupier (Licence Holder)`) |
| `aud` | `string` | Target portal slug identifier (e.g. `factory-portal`) |
| `jti` | `string` | Unique UUID token identifier used for single-use burn protection |
| `iat` | `number` | Issued-at epoch timestamp |
| `exp` | `number` | Expiration epoch timestamp (`iat + 60` seconds) |

---

## 3. Anti-Replay Protection

1. When a token is created via `POST /api/v1/portals/:id/launch`, the API records a `LaunchToken` row:
   ```sql
   INSERT INTO "LaunchToken" (jti, userId, portalId, expiresAt, usedAt)
   VALUES ('...', '...', '...', NOW() + INTERVAL '60 SECONDS', NULL);
   ```
2. When the destination portal receives the token, it invokes `POST /api/v1/portals/verify-handoff` with `{ jti, portalSlug }`.
3. If `usedAt` is not null, the request fails with **HTTP 401 Unauthorized (Replay Blocked)**.
4. If valid, the API sets `usedAt = NOW()`, permanently burning the token.
