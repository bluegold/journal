import { describe, expect, it } from 'vitest'
import { requestApp } from '../test-support'

describe('home route', () => {
  it('renders the landing page', async () => {
    const { response, body } = await requestApp('/')

    expect(response.status).toBe(200)
    expect(body).toContain('<html lang="ja">')
    expect(body).toContain('Journal')
    expect(body).toContain('/entries')
    expect(body).toContain('Bootstrap 完了。')
  })
})
