import { describe, expect, it } from 'vitest'
import app from '../app'
import { createMockEnv } from '../test-support'

describe('home route', () => {
  it('renders the landing page', async () => {
    const env = await createMockEnv()
    const res = await app.request('/', {}, env)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('<html lang="ja">')
    expect(body).toContain('Journal')
    expect(body).toContain('/entries')
    expect(body).toContain('Bootstrap 完了。')
  })
})
