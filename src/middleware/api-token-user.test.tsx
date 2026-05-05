import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { hashApiToken } from '../auth/api-token'
import { apiTokenUserMiddleware } from './api-token-user'
import { createApiTokenRow, createMockEnv, createUserRow } from '../test-support'
import type { Bindings } from '../types/bindings'
import type { JournalApiContextVariables } from '../types/journal'

describe('api token user middleware', () => {
  const app = new Hono<{ Bindings: Bindings; Variables: JournalApiContextVariables }>()
  app.use('*', apiTokenUserMiddleware)
  app.get('/api/probe', (c) => {
    return c.json({
      userId: c.var.currentUser.id,
      tokenId: c.var.currentApiToken.id,
    })
  })

  it('rejects requests without a valid bearer token', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
      },
    })

    const response = await app.request('/api/probe', {}, env)
    const body = await response.json<{ error: { code: string; message: string } }>()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Valid API bearer token is required.',
      },
    })
  })

  it('sets currentUser and currentApiToken for a valid token', async () => {
    const plaintextToken = 'jrnl_probe'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [
          createApiTokenRow({
            token_hash: await hashApiToken(plaintextToken),
            last_used_at: null,
          }),
        ],
      },
    })

    const response = await app.request(
      '/api/probe',
      {
        headers: {
          authorization: `Bearer ${plaintextToken}`,
        },
      },
      env
    )
    const body = await response.json<{ userId: string; tokenId: string }>()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      userId: 'user-1',
      tokenId: 'token-1',
    })
    expect(env.DB.state.apiTokens[0]?.last_used_at).toMatch(/T/)
  })
})
