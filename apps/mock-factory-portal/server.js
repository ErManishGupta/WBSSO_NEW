const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose');

const app = express();
const PORT = process.env.PORT || 4001;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';

app.use(cors({ origin: [DASHBOARD_URL, API_URL], credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory sessions for the mock portal
const sessions = new Map();

// Remote JWKS from Central SSO API
const JWKS = createRemoteJWKSet(new URL(`${API_URL}/.well-known/jwks.json`));

// SSO Handoff Callback
app.get('/sso/callback', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><title>SSO Error - Missing Token</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #F4F6FA; padding: 40px; display: flex; justify-content: center; }
        .card { background: white; border: 1px solid #D9DFEA; border-radius: 12px; padding: 32px; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        h1 { color: #C62828; margin-top: 0; font-size: 20px; }
        p { color: #475467; font-size: 14px; line-height: 1.6; }
        a { display: inline-block; margin-top: 16px; background: #14306B; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; }
      </style>
      </head>
      <body>
        <div class="card">
          <h1>SSO Authentication Error</h1>
          <p>No handoff token provided in launch callback.</p>
          <a href="${DASHBOARD_URL}">Return to Unified Dashboard</a>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // 1. Verify token cryptographic signature, expiration, and audience
    const { payload } = await jwtVerify(token, JWKS, {
      audience: 'factory-portal',
    });

    // 2. Contact Central API to claim and burn token (strict single-use / replay protection)
    const verifyRes = await fetch(`${API_URL}/api/v1/portals/verify-handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jti: payload.jti,
        portalSlug: 'factory-portal',
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head><title>SSO Error - Replay Detected</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #F4F6FA; padding: 40px; display: flex; justify-content: center; }
          .card { background: white; border: 1px solid #C62828; border-radius: 12px; padding: 32px; max-width: 550px; }
          h1 { color: #C62828; margin-top: 0; font-size: 20px; }
          p { color: #475467; font-size: 14px; line-height: 1.6; }
          .code { background: #FFEBEE; color: #C62828; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px; margin: 12px 0; }
          a { display: inline-block; margin-top: 16px; background: #14306B; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; }
        </style>
        </head>
        <body>
          <div class="card">
            <h1>⛔ SSO Token Replay or Expiration Error</h1>
            <p>This single-use launch token has already been consumed or has expired.</p>
            <div class="code">${err.message || 'Token was already verified or invalid.'}</div>
            <p>For your security, tokens are valid for 60 seconds and can only be used once.</p>
            <a href="${DASHBOARD_URL}">Return to Unified Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // 3. Create mock portal session
    const sessionId = 'fac_sess_' + Math.random().toString(36).substring(2);
    sessions.set(sessionId, {
      sub: payload.sub,
      portalUserId: payload.portal_user_id,
      portalRole: payload.portal_role,
      loginTime: new Date().toISOString(),
    });

    res.cookie('fac_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.redirect('/app');
  } catch (error) {
    console.error('SSO verification error:', error.message);
    res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head><title>SSO Verification Failed</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #F4F6FA; padding: 40px; display: flex; justify-content: center; }
        .card { background: white; border: 1px solid #D9DFEA; border-radius: 12px; padding: 32px; max-width: 500px; }
        h1 { color: #C62828; margin-top: 0; font-size: 20px; }
        p { color: #475467; font-size: 14px; line-height: 1.6; }
        a { display: inline-block; margin-top: 16px; background: #14306B; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; }
      </style>
      </head>
      <body>
        <div class="card">
          <h1>SSO Token Signature Verification Failed</h1>
          <p>${error.message}</p>
          <a href="${DASHBOARD_URL}">Return to Unified Dashboard</a>
        </div>
      </body>
      </html>
    `);
  }
});

// Authenticated Application Page
app.get('/app', (req, res) => {
  const sessionId = req.cookies.fac_session;
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
      <title>WB Factories & Boilers Inspection Portal</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: #F4F6FA; color: #101828; }
        .top-strip { height: 3px; display: flex; }
        .strip-1 { width: 33.33%; background: #FF9933; }
        .strip-2 { width: 33.33%; background: #FFFFFF; }
        .strip-3 { width: 33.33%; background: #138808; }
        header { background: #14306B; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .emblem { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
        .title { font-size: 18px; font-weight: 600; margin: 0; }
        .sub { font-size: 12px; opacity: 0.8; margin: 0; }
        .btn-return { background: rgba(255,255,255,0.15); color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; transition: background 0.2s; }
        .btn-return:hover { background: rgba(255,255,255,0.25); }
        .btn-logout { background: #C62828; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; margin-left: 8px; }
        .container { max-width: 1000px; margin: 32px auto; padding: 0 16px; }
        .card { background: white; border: 1px solid #D9DFEA; border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); margin-bottom: 24px; }
        .success-banner { background: #E8F5E9; border-left: 4px solid #138A36; padding: 12px 16px; border-radius: 6px; color: #0E6627; font-size: 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .info-item { background: #F8FAFC; padding: 14px; border-radius: 8px; border: 1px solid #E2E8F0; }
        .info-label { font-size: 12px; color: #64748B; font-weight: 500; text-transform: uppercase; margin-bottom: 4px; }
        .info-value { font-size: 15px; font-weight: 600; color: #0F172A; }
        .badge { display: inline-block; background: #14306B; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
        .actions-title { font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 16px; }
        .action-card { border: 1px solid #D9DFEA; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .action-card:hover { border-color: #14306B; }
        .btn-action { background: #14306B; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="top-strip">
        <div class="strip-1"></div><div class="strip-2"></div><div class="strip-3"></div>
      </div>
      <header>
        <div class="brand">
          <div class="emblem">WB</div>
          <div>
            <h1 class="title">WB Directorate of Factories</h1>
            <p class="sub">Government of West Bengal | Single Sign-On Authenticated</p>
          </div>
        </div>
        <div>
          <a class="btn-return" href="${DASHBOARD_URL}">← Back to Dashboard</a>
          <a class="btn-logout" href="/logout">Logout</a>
        </div>
      </header>

      <div class="container">
        <div class="success-banner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <div>
            <strong>SSO Handoff Validated:</strong> Successfully authenticated via RS256 token from Unified Portal Dashboard.
          </div>
        </div>

        <div class="card">
          <h2 style="margin-top: 0; font-size: 18px; color: #14306B;">Authenticated Account Profile</h2>
          <div class="grid">
            <div class="info-item">
              <div class="info-label">External User ID</div>
              <div class="info-value">${session.portalUserId}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Portal Role</div>
              <div class="info-value"><span class="badge">${session.portalRole}</span></div>
            </div>
            <div class="info-item">
              <div class="info-label">SSO Subject (User ID)</div>
              <div class="info-value" style="font-family: monospace; font-size: 13px;">${session.sub.substring(0, 13)}...</div>
            </div>
            <div class="info-item">
              <div class="info-label">Session Established</div>
              <div class="info-value" style="font-size: 13px;">${new Date(session.loginTime).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="actions-title">Department Portals & Operations</h3>
          <div class="action-card">
            <div>
              <strong style="display: block; font-size: 15px;">Annual Factory License Renewal (Form 2)</strong>
              <span style="font-size: 13px; color: #64748B;">Statutory submission under Section 6 of Factories Act, 1948</span>
            </div>
            <a class="btn-action" href="javascript:alert('Demo Action: Renewal Dossier Active')">Access Service</a>
          </div>
          <div class="action-card">
            <div>
              <strong style="display: block; font-size: 15px;">Safety Audit & Boiler Inspection Log</strong>
              <span style="font-size: 13px; color: #64748B;">Upload pressure vessel testing certificates and occupational health records</span>
            </div>
            <a class="btn-action" href="javascript:alert('Demo Action: Compliance Logs Opened')">View Filings</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Root route
app.get('/', (req, res) => {
  const sessionId = req.cookies.fac_session;
  if (sessionId && sessions.has(sessionId)) {
    return res.redirect('/app');
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>WB Directorate of Factories</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #F4F6FA; padding: 60px 20px; display: flex; justify-content: center; }
      .card { background: white; border: 1px solid #D9DFEA; border-radius: 12px; padding: 40px; max-width: 520px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      h1 { color: #14306B; margin-top: 0; font-size: 22px; }
      p { color: #475467; font-size: 14px; line-height: 1.6; }
      a { display: inline-block; margin-top: 20px; background: #14306B; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; }
    </style>
    </head>
    <body>
      <div class="card">
        <h1>WB Directorate of Factories</h1>
        <p>This service accepts Single Sign-On (SSO) handoff from the unified dashboard.</p>
        <p>Please launch this portal from the Unified Portal Dashboard to authenticate.</p>
        <a href="${DASHBOARD_URL}">Launch via Unified Portal Dashboard</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/logout', (req, res) => {
  res.clearCookie('fac_session');
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🏭 Mock Factory Portal running on http://localhost:${PORT}`);
});
