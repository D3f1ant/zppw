export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const id = params.id;
  let body;
  try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  const status = body.status;
  const notes = body.notes;

  if (status) {
    await env.DB.prepare(`UPDATE leads SET status = ? WHERE id = ?`).bind(status, id).run();
  }
  if (typeof notes === "string") {
    await env.DB.prepare(`UPDATE leads SET notes = ? WHERE id = ?`).bind(notes.slice(0, 4000), id).run();
  }

  return new Response(JSON.stringify({ ok: true }));
}
