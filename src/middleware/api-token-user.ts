import type { MiddlewareHandler } from 'hono'
import { authenticateApiToken } from '../auth/api-token'
import type { Bindings } from '../types/bindings'
import type { JournalApiContextVariables } from '../types/journal'

export const apiTokenUserMiddleware: MiddlewareHandler<{
  Bindings: Bindings
  Variables: JournalApiContextVariables
}> = async (c, next) => {
  const auth = await authenticateApiToken(c.env.DB, c.req.raw)

  if (!auth) {
    return c.json(
      {
        error: {
          code: 'unauthorized',
          message: 'Valid API bearer token is required.',
        },
      },
      401
    )
  }

  c.set('currentUser', auth.user)
  c.set('currentApiToken', auth.apiToken)

  await next()
}
