import { describe, expect, it } from 'vitest'
import app from './index'

describe('journal app shell', () => {
  it('renders the landing page', async () => {
    const res = await app.request('/')
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('<html lang="ja">')
    expect(body).toContain('Journal')
    expect(body).toContain('/entries')
    expect(body).toContain('Bootstrap 完了。')
  })

  it('renders the entries page with the htmx search form', async () => {
    const res = await app.request('/entries')
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('hx-get="/search"')
    expect(body).toContain('hx-target="#search-results"')
    expect(body).toContain('placeholder="title / tags / summary"')
  })

  it('returns a fragment for search queries', async () => {
    const res = await app.request('/search?q=tag')
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('search: tag')
    expect(body).not.toContain('<html')
  })
})
