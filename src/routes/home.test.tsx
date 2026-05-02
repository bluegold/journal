import { describe, expect, it } from 'vitest'
import { requestApp } from '../test-support'

describe('home route', () => {
  it('renders the landing page', async () => {
    const { response, body } = await requestApp('/')

    expect(response.status).toBe(200)
    expect(body).toContain('<html lang="ja"')
    expect(body).toContain('href="/favicon.png"')
    expect(body).toContain('src="/favicon.png"')
    expect(body).toContain('hx-target="#journal-workspace"')
    expect(body).toContain('htmx:afterSwap')
    expect(body).toContain('Tester')
    expect(body).toContain('Calendar')
    expect(body).toContain('Content area')
    expect(body).toContain('Select a journal entry')
  })

  it('falls back to the default avatar image when Access avatar is missing', async () => {
    const { response, body } = await requestApp('/', {
      init: {
        headers: {
          'cf-access-authenticated-user-avatar': '',
        },
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('src="/unknown_avatar.png"')
  })

  it('rejects requests without a Cloudflare Access email header', async () => {
    const { response, body } = await requestApp('/', {
      init: {
        headers: {
          'cf-access-authenticated-user-email': '',
        },
      },
    })

    expect(response.status).toBe(401)
    expect(body).toContain('Cloudflare Access authentication is required.')
  })
})
