Fix before production
Back-channel logout never checks the signature (Node). handleBackchannelLogout only decodes the payload and checks claims, though 6.5 says to verify RS256. Anyone can POST a forged logout_token and log users out. The code also skips exp, never prunes processedJti, and returns success when neither sid nor sub is present. Use jose or openid-client to verify against the JWKS, and reject a token that has neither sid nor sub.
Sessions, transactions and jti live in memory (Map, a Python dict, Go sync.Map).
They vanish on restart and grow without limit.
With two or more instances, a back-channel logout reaches the wrong one and revokes nothing, silently.
Use Redis or the database with TTLs.
Nothing enforces the session on each request.
isSessionValid and touchSession aren’t called by any guard shown, and /auth/me reads an unexplained req.user.
AuthController uses this.dataSource but never injects it, so the code won’t compile.
Add a global guard that verifies the cookie, checks isSessionValid, and touches the session. The JWT-plus-session layering is redundant, so an opaque session ID is simpler, as the Python example does.
“Active” is inconsistent, and it fails open.
Most queries use c_status = 'A', but 6.3 and the Node code use n_status = 1. One of those columns is probably wrong.
OR … IS NULL treats a missing status as active in all of them. Check your real schema, and make “active” an explicit value.
Go has login CSRF. State is stored by state alone, with no cookie tying it to the browser. An attacker can start a login and trick a victim into completing it as the attacker. Add the txnId cookie as in Node, and enforce the stored created timestamp.
High
iss should be mandatory. Every template accepts a callback with no iss. If the OP advertises authorization_response_iss_parameter_supported, reject when it’s missing. Java’s check reads the ID token’s iss, which Spring already validates, so it isn’t RFC 9207.
The Python template won’t run. SessionMiddleware was removed, but Authlib’s authorize_redirect needs request.session. Redirects like /user/dashboard also land on the API host and not the UI.
“Every template enforces the session store” is overstated (lines 780–781). Only Node implements revocation by sid.
Go and PHP issue stateless tokens, and PHP has no idle timeout.
.NET has SaveTokens=false, so it has no id_token_hint, no absolute lifetime and no back-channel logout.
Java and Python have no back-channel handler.
Either implement these or label the templates “login only”.
Client secret hashing is still unresolved. v3.4 still says “SHA-256 digest” with client_secret_basic. Stock oidc-provider compares the Basic secret against a stored plaintext value, so a hash won’t verify. Ask the OP author how verification works. If it’s customised, document that. Otherwise use private_key_jwt or encrypted storage.
IDOR risk. fetchDashboardData(userId) sends a client-supplied ID. Add a rule that the server ignores client IDs and derives the user from the session. Add a test that user A can’t read user B’s dashboard.
Medium and low
Secure flag: it depends on NODE_ENV and fails silently if misconfigured. Derive it from the HTTPS base URL, and set trust proxy behind TLS termination.
Back-channel endpoint: Nest returns 201 by default, so add @HttpCode(200) and Cache-Control: no-store.
Logout: verifyToken throws on an expired cookie, so wrap it in a try/catch and still clear the cookie. Encode post_logout_redirect_uri in Python.
Errors: the Node catch swallows failures with no audit log. Python, Go and PHP return distinguishable 403 texts, unlike Node’s generic redirect.
CSRF header: X-Requested-With is only checked on logout, though 9.1 says it protects all state-changing routes. Enforce it globally, and lock CORS to the exact origin.
9.1 wording: schemes now count in “schemeful same-site”. Ports are ignored but http vs https is not.
Applicant flow: it exists only as a diagram. The transaction must record flow=applicant, and the fa_applicant_identities schema isn’t defined. State that auto-provisioning applies to applicants only, so it doesn’t contradict mandate 6.
.NET template: it lacks using Microsoft.EntityFrameworkCore; and the DbContext registration.
Test matrix additions: forged or unsigned logout token, IDOR, idle and absolute timeout, revocation across two instances, login CSRF, and missing iss.
