const crypto = require("crypto");
const { REDIRECT_URI, SCOPES, setCookie } = require("./_lib");
module.exports = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  setCookie(res, "tt_state", state, 600);
  const q = new URLSearchParams({ client_key: process.env.TT_CLIENT_KEY || "", scope: SCOPES,
    response_type: "code", redirect_uri: REDIRECT_URI, state });
  res.statusCode = 302;
  res.setHeader("Location", `https://www.tiktok.com/v2/auth/authorize/?${q}`);
  res.end();
};
