const { session, tt, json } = require("./_lib");
module.exports = async (req, res) => {
  const s = session(req);
  if (!s) return json(res, 200, { connected: false });
  try {
    const user = await tt("/user/info/?fields=open_id,avatar_url,display_name", s.access_token);
    const creator = await tt("/post/publish/creator_info/query/", s.access_token, {});
    json(res, 200, { connected: true, user: user.user, creator });
  } catch (e) { json(res, 200, { connected: false, error: e.message }); }
};
