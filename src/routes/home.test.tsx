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
    expect(body).not.toContain('Guest')
    expect(body).not.toContain('Sign in')
    expect(body).toContain('Calendar')
    expect(body).toContain('Content area')
    expect(body).toContain('Select a journal entry')
  })
})
