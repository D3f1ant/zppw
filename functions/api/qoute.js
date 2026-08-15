const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });

const cleanText = (value, maxLength) => {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

const isValidEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

const isAllowedOrigin = (request, allowedOrigin) => {
  const origin = request.headers.get("Origin");

  if (!origin) return true;
  if (!allowedOrigin) return true;

  return origin === allowedOrigin;
};

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    console.error("Missing D1 binding: DB");
    return json({ ok: false, error: "Form service is not configured yet." }, 503);
  }

  if (!isAllowedOrigin(request, env.ALLOWED_ORIGIN)) {
    return json({ ok: false, error: "Request origin is not allowed." }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "Unsupported request format." }, 415);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request data." }, 400);
  }

  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "Invalid request data." }, 400);
  }

  /*
    Honeypot:
    Human visitors never see or fill this field.
    Bots that populate it receive a neutral response and no data is stored.
  */
  if (cleanText(body.website, 200)) {
    return json({ ok: true }, 200);
  }

  const name = cleanText(body.name, 80);
  const phone = cleanText(body.phone, 25);
  const email = cleanText(body.email, 120).toLowerCase();
  const service = cleanText(body.service, 80);
  const details = cleanText(body.details, 1200);

  if (name.length < 2) {
    return json({ ok: false, error: "Please enter a valid name." }, 400);
  }

  if (!isValidPhone(phone)) {
    return json({ ok: false, error: "Please enter a valid phone number." }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  if (!service) {
    return json({ ok: false, error: "Please select a service." }, 400);
  }

  if (details.length > 0 && details.length < 5) {
    return json({ ok: false, error: "Please provide a little more project detail." }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await env.DB
      .prepare(`
        INSERT INTO leads (
          id,
          created_at,
          name,
          phone,
          email,
          service,
          details,
          status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'New', '')
      `)
      .bind(
        id,
        createdAt,
        name,
        phone,
        email || null,
        service,
        details || null
      )
      .run();
  } catch (error) {
    console.error("D1 lead insert failed:", error);
    return json(
      {
        ok: false,
        error: "We could not save your request. Please call (435) 525-0736."
      },
      500
    );
  }

  return json({ ok: true, id }, 201);
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Allow": "POST, OPTIONS",
      "Cache-Control": "no-store"
    }
  });
}
