export async function onRequest(context) {
  const { request, env } = context;
  const authHeader = request.headers.get("Authorization");

  const JOURNAL_USER = env.JOURNAL_USER;
  const JOURNAL_PASS = env.JOURNAL_PASS;

  // Skip auth if env vars are not set (for local development if needed, though usually handled by .dev.vars)
  if (!JOURNAL_USER || !JOURNAL_PASS) {
    return await context.next();
  }

  if (!authHeader) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Journal Public Site"',
      },
    });
  }

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const decoded = atob(encoded);
    const [username, password] = decoded.split(":");

    if (username === JOURNAL_USER && password === JOURNAL_PASS) {
      return await context.next();
    }
  } catch (e) {
    return new Response("Bad Request", { status: 400 });
  }

  return new Response("Invalid credentials", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Journal Public Site"',
    },
  });
}
