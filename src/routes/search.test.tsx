import { describe, expect, it } from 'vitest'
import { createEntryRow, requestApp } from '../test-support'

describe('search route', () => {
  it('filters entries by title and summary', async () => {
    const { response, body } = await requestApp('/search?q=apple', {
      db: {
        initialEntries: [
          createEntryRow({
            title: 'Apple notes',
            summary: 'Daily work log',
            ai_summary: null,
            created_at: '2026-04-22T08:00:00.000Z',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
          createEntryRow({
            id: 'entry-2',
            journal_date: '2026-04-21',
            title: 'Banana notes',
            summary: 'Weekend thoughts',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-21T08:00:00.000Z',
            updated_at: '2026-04-21T08:00:00.000Z',
            deleted_at: null,
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('search: apple')
    expect(body).toContain('Apple notes')
    expect(body).toContain('Daily work log')
    expect(body).not.toContain('Banana notes')
  })
})
