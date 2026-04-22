import { describe, expect, it } from 'vitest'
import { requestApp } from '../test-support'

describe('home route', () => {
  it('renders the landing page', async () => {
    const { response, body } = await requestApp('/')

    expect(response.status).toBe(200)
    expect(body).toContain('<html lang="ja"')
    expect(body).toContain('href="/favicon.png"')
    expect(body).toContain('src="/favicon.png"')
    expect(body).toContain('Private server-rendered journal')
    expect(body).toContain('Tester')
    expect(body).toContain('tester@example.com')
    expect(body).toContain('Calendar')
    expect(body).toContain('Content area')
    expect(body).toContain('Select a journal entry')
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
