const { app, shell, dialog } = require('electron');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

function generateVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

function exchangeCodeForToken(code, codeVerifier, clientId, redirectUri) {
  const postData = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.error) {
            reject(new Error(parsed.error_description || parsed.error || 'token_error'));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

module.exports.startGoogleAuthFlow = function (opts) {
  opts = opts || {};
  const clientId = opts.clientId || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const port = Number(opts.port || process.env.GOOGLE_OAUTH_PORT || 42813) || 42813;
  const redirectPath = opts.redirectPath || '/callback';

  if (!clientId) {
    try {
      dialog.showMessageBoxSync({
        type: 'error',
        message: 'مفتاح Google غير مُعد. أنشئ OAuth Client ID من نوع "Desktop" وأضف redirect: http://127.0.0.1:42813/callback'
      });
    } catch (e) { }
    return Promise.resolve({ success: false, error: 'no_client_id' });
  }

  const redirectUri = `http://127.0.0.1:${port}${redirectPath}`;
  const codeVerifier = generateVerifier();
  const codeChallenge = base64UrlEncode(sha256(Buffer.from(codeVerifier)));
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  }).toString();

  return new Promise((resolve, reject) => {
    let server = null;
    let timeoutId = null;

    const finish = (res) => {
      try { if (server) server.close(); } catch (_) { }
      if (timeoutId) clearTimeout(timeoutId);
      resolve(res);
    };

    try {
      server = http.createServer(async (req, res) => {
        try {
          const u = new URL(req.url, `http://127.0.0.1:${port}`);
          if (u.pathname !== redirectPath) {
            res.writeHead(404); res.end(); return;
          }
          const code = u.searchParams.get('code');
          const error = u.searchParams.get('error');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<div style="font-family: sans-serif; text-align:center; padding:40px;"><h3>تم إكمال تسجيل الدخول. يمكنك إغلاق هذه النافذة والعودة للتطبيق.</h3></div>');
          try { server.close(); } catch (_) { }
          if (error) { return reject(new Error(String(error))); }
          try {
            const tokenResp = await exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);
            try {
              const savePath = path.join(app.getPath('userData'), 'google-oauth.json');
              fs.writeFileSync(savePath, JSON.stringify(tokenResp, null, 2), 'utf8');
            } catch (_) { }
            try {
              if (opts.mainWindow && opts.mainWindow.webContents) {
                opts.mainWindow.webContents.send('google-oauth-success', tokenResp);
              }
            } catch (_) { }
            finish({ success: true, tokens: tokenResp });
          } catch (e) {
            reject(e);
          }
        } catch (e) {
          try { res.writeHead(500); res.end('error'); } catch (_) { }
          reject(e);
        }
      }).listen(port, '127.0.0.1', () => {
        try { shell.openExternal(authUrl).catch(() => { }); } catch (_) { }
      }).on('error', (err) => {
        reject(err);
      });

      timeoutId = setTimeout(() => {
        try { if (server) server.close(); } catch (_) { }
        reject(new Error('timeout'));
      }, 5 * 60 * 1000);
    } catch (e) {
      try { if (server) server.close(); } catch (_) { }
      reject(e);
    }
  });
};
