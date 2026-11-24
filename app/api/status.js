const { session, tt, json } = require("./_lib");
module.exports = async (req, res) => {
  const s = session(req);
  if (!s) return json(res, 401, { error: "No conectado" });
  const id = new URL(req.url, "https://x").searchParams.get("publish_id");
  try { json(res, 200, await tt("/post/publish/status/fetch/", s.access_token, { publish_id: id })); }
  catch (e) { json(res, 500, { error: e.message }); }
};
