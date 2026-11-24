const { session, tt, json } = require("./_lib");
const VIDEOS = require("../public/videos.json");
module.exports = async (req, res) => {
  const s = session(req);
  if (!s) return json(res, 401, { error: "No conectado" });
  if (req.method !== "POST") return json(res, 405, { error: "POST" });
  let b = req.body;
  if (typeof b === "string") b = JSON.parse(b);
  const v = VIDEOS.find((x) => x.id === b.video);
  if (!v) return json(res, 400, { error: "Vídeo desconocido" });
  if (!b.privacy_level) return json(res, 400, { error: "Elige quién puede verlo" });
  try {
    const creator = await tt("/post/publish/creator_info/query/", s.access_token, {});
    if (!creator.privacy_level_options.includes(b.privacy_level)) return json(res, 400, { error: "Privacidad no permitida" });
    const file = Buffer.from(await (await fetch(v.url)).arrayBuffer());
    const init = await tt("/post/publish/video/init/", s.access_token, {
      post_info: { title: String(b.caption || "").slice(0, 2200), privacy_level: b.privacy_level,
        disable_comment: !b.allow_comment, disable_duet: !b.allow_duet, disable_stitch: !b.allow_stitch,
        brand_content_toggle: !!b.brand_content, brand_organic_toggle: !!b.brand_organic, is_aigc: true },
      source_info: { source: "FILE_UPLOAD", video_size: file.length, chunk_size: file.length, total_chunk_count: 1 },
    });
    const up = await fetch(init.upload_url, { method: "PUT", body: file, headers: {
      "Content-Type": "video/mp4", "Content-Length": String(file.length),
      "Content-Range": `bytes 0-${file.length - 1}/${file.length}` } });
    if (!up.ok) throw new Error(`Subida falló (${up.status})`);
    json(res, 200, { publish_id: init.publish_id });
  } catch (e) { json(res, 500, { error: e.message }); }
};
