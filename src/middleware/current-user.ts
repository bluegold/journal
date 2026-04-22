import type { MiddlewareHandler } from 'hono'
import { readAccessIdentity, readDevAccessIdentity, upsertAccessUser } from '../auth/access'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'

export const currentUserMiddleware: MiddlewareHandler<{
  Bindings: Bindings
  Variables: JournalContextVariables
}> = async (c, next) => {
  const identity = readAccessIdentity(c.req.raw) ?? readDevAccessIdentity(c.env)

  if (!identity) {
    return c.text('Cloudflare Access authentication is required.', 401)
  }

  const currentUser = await upsertAccessUser(c.env.DB, identity)
  c.set('currentUser', currentUser)

  await next()
}
