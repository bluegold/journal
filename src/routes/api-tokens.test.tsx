import { describe, expect, it } from 'vitest'
import { createApiTokenRow, createUserRow, requestApp } from '../test-support'
import { uiText } from '../lib/i18n'

describe('api token routes', () => {
  const text = uiText.ja

  it('renders the token management page from the settings route', async () => {
    const { response, body } = await requestApp('/settings/api-tokens', {
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow()],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain(text.apiTokens.title)
    expect(body).toContain(text.apiTokens.createAction)
    expect(body).toContain('codex-dev')
    expect(body).toContain('jrnl_deadbeefcafe00')
    expect(body).toContain(text.apiTokens.neverUsed)
  })

  it('creates a named token and shows the plaintext only in the create response', async () => {
    const { response, body, env } = await requestApp('/settings/api-tokens', {
      init: {
        method: 'POST',
        body: new URLSearchParams({ name: 'codex-dev' }),
      },
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(201)
    expect(body).toContain(text.apiTokens.created.replace('{{name}}', 'codex-dev'))
    expect(body).toMatch(/jrnl_[0-9a-f]{48}/)
    expect(env.DB.state.apiTokens).toHaveLength(1)
    expect(env.DB.state.apiTokens[0]?.name).toBe('codex-dev')
    expect(env.DB.state.apiTokens[0]?.token_hash).not.toContain('jrnl_')
  })

  it('rejects empty token names', async () => {
    const { response, body, env } = await requestApp('/settings/api-tokens', {
      init: {
        method: 'POST',
        body: new URLSearchParams({ name: '   ' }),
      },
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(400)
    expect(body).toContain(text.apiTokens.errors.nameRequired)
    expect(env.DB.state.apiTokens).toHaveLength(0)
  })

  it('deletes an owned token and redirects back to the management page', async () => {
    const { response, env } = await requestApp('/settings/api-tokens/token-1/delete', {
      init: {
        method: 'POST',
      },
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow()],
      },
    })

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe('/settings/api-tokens')
    expect(env.DB.state.apiTokens).toHaveLength(0)
  })

  it('returns 404 when deleting another user token', async () => {
    const { response, env, body } = await requestApp('/settings/api-tokens/token-2/delete', {
      init: {
        method: 'POST',
      },
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [
          createApiTokenRow({
            id: 'token-2',
            user_id: 'user-2',
          }),
        ],
      },
    })

    expect(response.status).toBe(404)
    expect(body).toContain('API token not found.')
    expect(env.DB.state.apiTokens).toHaveLength(1)
  })
})
