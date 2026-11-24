const { TT, REDIRECT_URI, cookies, setCookie, seal } = require("./_lib");
module.exports = async (req, res) => {
  const u = new URL(req.url, "https://x");
  const code = u.searchParams.get("code"), state = u.searchParams.get("state");
  const back = (msg) => { res.statusCode = 302; res.setHeader("Location", `/?error=${encodeURIComponent(msg)}`); res.end(); };
  if (u.searchParams.get("error")) return back(u.searchParams.get("error_description") || u.searchParams.get("error"));
  if (!code || !state || state !== cookies(req).tt_state) return back("Sesión caducada, vuelve a conectar.");
  const r = await fetch(`${TT}/oauth/token/`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: process.env.TT_CLIENT_KEY, client_secret: process.env.TT_CLIENT_SECRET,
      code, grant_type: "authorization_code", redirect_uri: REDIRECT_URI }),
  });
  const t = await r.json().catch(() => ({}));
  if (!t.access_token) return back(t.error_description || t.error || "No se pudo conectar con TikTok.");
  setCookie(res, "tt_state", "", 0);
  setCookie(res, "tt_session", seal({ access_token: t.access_token, open_id: t.open_id }), t.expires_in || 86400);
  res.statusCode = 302; res.setHeader("Location", "/"); res.end();
};
