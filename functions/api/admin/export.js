export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(`SELECT * FROM leads ORDER BY created_at DESC`).all();

  const header = ["id","created_at","name","phone","email","service","details","status","notes"];
  const rows = results.map(r => header.map(h => `"${(r[h] || "").toString().replace(/"/g, '""')}"`).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="zion-leads-${new Date().toISOString().slice(0,10)}.csv"`
    }
  });
}
