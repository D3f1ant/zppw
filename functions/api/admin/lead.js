export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = url.searchParams.get("status") || "";

  let query = `SELECT * FROM leads`;
  const params = [];
  const conditions = [];

  if (q) {
    conditions.push(`(lower(name) LIKE ? OR lower(phone) LIKE ? OR lower(email) LIKE ? OR lower(service) LIKE ? OR lower(details) LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (status) {
    conditions.push(`status = ?`);
    params.push(status);
  }

  if (conditions.length) query += ` WHERE ` + conditions.join(" AND ");
  query += ` ORDER BY created_at DESC LIMIT 200`;

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}
