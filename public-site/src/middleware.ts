import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const request = context.request
  const authHeader = request.headers.get('Authorization')
  const env = context.locals.runtime?.env ?? {}

  const JOURNAL_USER = env.JOURNAL_USER
  const JOURNAL_PASS = env.JOURNAL_PASS

  // Allow unauthenticated access when the credentials are not configured.
  if (!JOURNAL_USER || !JOURNAL_PASS) {
    return next()
  }

  if (!authHeader) {
    return new Response('Unauthorized: journal public site', {
      status: 401,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'WWW-Authenticate': 'Basic realm="Journal Public Site"',
      },
    })
  }

  const [scheme, encoded] = authHeader.split(' ')
  if (scheme !== 'Basic' || !encoded) {
    return new Response('Bad Request', { status: 400 })
  }

  try {
    const decoded = atob(encoded)
    const [username, password] = decoded.split(':')

    if (username === JOURNAL_USER && password === JOURNAL_PASS) {
      return next()
    }
  } catch (_error) {
    return new Response('Bad Request', { status: 400 })
  }

  return new Response('Invalid credentials', {
    status: 401,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'WWW-Authenticate': 'Basic realm="Journal Public Site"',
    },
  })
})
