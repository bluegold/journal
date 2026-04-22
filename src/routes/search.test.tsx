import { describe, expect, it } from 'vitest'
import app from '../app'
import { createMockEnv } from '../test-support'

describe('search route', () => {
  it('filters entries by title and summary', async () => {
    const env = await createMockEnv({
      db: {
        initialEntries: [
          {
            id: 'entry-1',
            journal_date: '2026-04-22',
            title: 'Apple notes',
            summary: 'Daily work log',
            ai_summary: null,
            body_key: 'entries/entry-1.md',
            status: 'private',
            created_at: '2026-04-22T08:00:00.000Z',
            updated_at: '2026-04-22T08:00:00.000Z',
            deleted_at: null,
          },
          {
            id: 'entry-2',
            journal_date: '2026-04-21',
            title: 'Banana notes',
            summary: 'Weekend thoughts',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            status: 'private',
            created_at: '2026-04-21T08:00:00.000Z',
            updated_at: '2026-04-21T08:00:00.000Z',
            deleted_at: null,
          },
        ],
      },
    })

    const res = await app.request('/search?q=apple', {}, env)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('search: apple')
    expect(body).toContain('Apple notes')
    expect(body).toContain('Daily work log')
    expect(body).not.toContain('Banana notes')
  })
})
