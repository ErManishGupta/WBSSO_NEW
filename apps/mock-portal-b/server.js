const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose');

const app = express();
const PORT = process.env.PORT || 4002;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';

app.use(cors({ origin: [DASHBOARD_URL, API_URL], credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sessions = new Map();
const JWKS = createRemoteJWKSet(new URL(`${API_URL}/.well-known/jwks.json`));

// SSO Handoff Callback for Portal B
app.get('/sso/callback', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('SSO Error: Missing Token');
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: 'labour-welfare-portal',
    });

    // Central API verify-handoff
    const verifyRes = await fetch(`${API_URL}/api/v1/portals/verify-handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jti: payload.jti,
        portalSlug: 'labour-welfare-portal',
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head><title>SSO Replay Error</title>
        <style>
          body { font-family: system-ui; background: #F4F6FA; padding: 40px; display: flex; justify-content: center; }
          .card { background: white; border: 1px solid #C62828; border-radius: 12px; padding: 32px; max-width: 500px; }
          h1 { color: #C62828; font-size: 20px; }
        </style>
        </head>
        <body>
          <div class="card">
            <h1>⛔ SSO Token Replay Blocked</h1>
            <p>${err.message || 'Token was already used or expired.'}</p>
            <a href="${DASHBOARD_URL}">Return to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    const sessionId = 'bocw_sess_' + Math.random().toString(36).substring(2);
    sessions.set(sessionId, {
      sub: payload.sub,
      portalUserId: payload.portal_user_id,
      portalRole: payload.portal_role,
      loginTime: new Date().toISOString(),
    });

    res.cookie('bocw_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.redirect('/app');
  } catch (error) {
    console.error('SSO verification error Portal B:', error.message);
    res.status(401).send(`Verification failed: ${error.message}`);
  }
});

app.get('/app', (req, res) => {
  const sessionId = req.cookies.bocw_session;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.redirect('/');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WB BOCW Welfare Board Portal</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: #F4F6FA; color: #101828; }
        .top-strip { height: 3px; display: flex; }
        .strip-1 { width: 33.33%; background: #FF9933; }
        .strip-2 { width: 33.33%; background: #FFFFFF; }
        .strip-3 { width: 33.33%; background: #138808; }
        header { background: #0E6627; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .title { font-size: 18px; font-weight: 600; margin: 0; }
        .sub { font-size: 12px; opacity: 0.85; margin: 0; }
        .btn-return { background: rgba(255,255,255,0.2); color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; }
        .container { max-width: 1000px; margin: 32px auto; padding: 0 16px; }
        .card { background: white; border: 1px solid #D9DFEA; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .badge { background: #0E6627; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="top-strip">
        <div class="strip-1"></div><div class="strip-2"></div><div class="strip-3"></div>
      </div>
      <header>
        <div class="brand">
          <div>
            <h1 class="title">WB Building & Other Construction Workers (BOCW) Board</h1>
            <p class="sub">Labour Department, Government of West Bengal</p>
          </div>
        </div>
        <div>
          <a class="btn-return" href="${DASHBOARD_URL}">← Back to Dashboard</a>
          <a style="color: white; margin-left: 12px; font-size: 13px;" href="/logout">Logout</a>
        </div>
      </header>
      <div class="container">
        <div class="card">
          <h2 style="margin-top:0; font-size:18px; color: #0E6627;">Welfare Board Active Session</h2>
          <p><strong>Beneficiary / Establishment ID:</strong> ${session.portalUserId}</p>
          <p><strong>Role:</strong> <span class="badge">${session.portalRole}</span></p>
          <p><strong>Authenticated via SSO:</strong> RS256 Central Token Claim Verified</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  const sessionId = req.cookies.bocw_session;
  if (sessionId && sessions.has(sessionId)) {
    return res.redirect('/app');
  }
  res.send(`
    <html>
      <body style="font-family: system-ui; padding: 50px; text-align: center;">
        <h2>WB BOCW Welfare Board Portal</h2>
        <p>Please authenticate via <a href="${DASHBOARD_URL}">Unified Portal Dashboard</a></p>
      </body>
    </html>
  `);
});

app.get('/logout', (req, res) => {
  res.clearCookie('bocw_session');
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🤝 Mock Portal B (BOCW) running on http://localhost:${PORT}`);
});
