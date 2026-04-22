import { describe, expect, it } from 'vitest'
import { createEntryRow, createUserRow, requestApp } from '../test-support'

describe('search route', () => {
  it('filters entries by title and summary', async () => {
    const { response, body } = await requestApp('/search?q=apple', {
      db: {
        initialUsers: [createUserRow()],
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
            user_id: 'user-1',
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

  it('matches ai summary, ignores deleted entries, and returns no matches for empty results', async () => {
    const { response, body } = await requestApp('/search?q=insight', {
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            title: 'Plain note',
            summary: 'No match here',
            ai_summary: 'AI generated insight',
            created_at: '2026-04-22T08:00:00.000Z',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-21',
            title: 'Deleted note',
            summary: 'Should stay hidden',
            ai_summary: 'also ai',
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-21T08:00:00.000Z',
            updated_at: '2026-04-21T08:00:00.000Z',
            deleted_at: '2026-04-21T09:00:00.000Z',
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('search: insight')
    expect(body).toContain('Plain note')
    expect(body).not.toContain('Deleted note')
    expect(body).not.toContain('Should stay hidden')
    expect(body).not.toContain('No matches.')
  })

  it('shows the empty state for blank queries with no entries', async () => {
    const { response, body } = await requestApp('/search?q=%20%20', {
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('search:   ')
    expect(body).toContain('No matches.')
  })
})
