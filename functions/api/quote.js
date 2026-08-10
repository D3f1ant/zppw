export async function onRequestPost(context) {
  const { request, env } = context;

  // Rate limit (simple IP-based, Cloudflare will do heavier lifting too)
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateKey = `rate:${ip}`;
  // (You can expand this with Durable Objects later if volume spikes)

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  // Honeypot
  if (body.website || body.url || body.company) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 }); // silent drop
  }

  // Server-side validation
  const name = (body.name || "").trim().slice(0, 100);
  const phone = (body.phone || "").trim().slice(0, 30);
  const email = (body.email || "").trim().slice(0, 120);
  const service = (body.service || "").trim().slice(0, 80);
  const details = (body.details || "").trim().slice(0, 2000);

  if (!name || name.length < 2 || !phone || phone.length < 7) {
    return new Response(JSON.stringify({ error: "Name and phone required" }), { status: 400 });
  }

  // Turnstile verification (add your secret later)
  // const turnstile = body["cf-turnstile-response"];
  // if (!turnstile) return new Response(..., 403);
  // verify against Cloudflare...

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO leads (id, created_at, name, phone, email, service, details, status, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?, ?)`
    ).bind(id, now, name, phone, email || null, service || null, details || null, ip, request.headers.get("User-Agent") || null).run();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }

  // Optional: send email notification via Cloudflare Email or Resend/Mailgun secrets
  // await sendNotification(env, { name, phone, email, service, details });

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
