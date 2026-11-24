const crypto = require("crypto");
const TT = "https://open.tiktokapis.com/v2";
const REDIRECT_URI = "https://rafhalico.github.io/hacesiglos/callback.html";
const SCOPES = "user.info.basic,video.upload,video.publish";

function key() {
  return crypto.createHash("sha256").update(process.env.COOKIE_KEY || "").digest();
}
function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64url");
}
function open(str) {
  try {
    const b = Buffer.from(str, "base64url");
    const d = crypto.createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"));
  } catch { return null; }
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function setCookie(res, name, value, maxAge) {
  const prev = res.getHeader("Set-Cookie") || [];
  res.setHeader("Set-Cookie", [...[].concat(prev),
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`]);
}
function session(req) {
  const s = open(cookies(req).tt_session || "");
  return s && s.access_token ? s : null;
}
async function tt(path, token, body) {
  const r = await fetch(`${TT}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j.error && j.error.code && j.error.code !== "ok")) {
    const e = new Error((j.error && j.error.message) || `TikTok HTTP ${r.status}`);
    e.detail = j.error; throw e;
  }
  return j.data;
}
function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}
module.exports = { TT, REDIRECT_URI, SCOPES, seal, open, cookies, setCookie, session, tt, json };
