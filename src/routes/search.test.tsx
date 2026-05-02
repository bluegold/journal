import { describe, expect, it } from 'vitest'
import { createEntryRow, createEntryTagRow, createTagRow, createUserRow, requestApp } from '../test-support'

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
    expect(body).toContain('Find entries')
    expect(body).toContain('Calendar')
    expect(body).toContain('検索語:')
    expect(body).toContain('Apple notes')
    expect(body).toContain('2026-04-22')
    expect(body).toContain('Daily work log')
    expect(body).not.toContain('Banana notes')
  })

  it('ignores ai summary, deleted entries, and returns no matches for empty results', async () => {
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
    expect(body).toContain('一致する記事はありません。')
    expect(body).not.toContain('Plain note')
    expect(body).not.toContain('Deleted note')
    expect(body).not.toContain('Should stay hidden')
  })

  it('filters by approved tag name', async () => {
    const { response, body } = await requestApp('/search?tag=work', {
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({ id: 'entry-1', title: 'Work log' }),
          createEntryRow({ id: 'entry-2', title: 'Private note', journal_date: '2026-04-21', body_key: 'entries/entry-2.md' }),
        ],
        initialTags: [
          createTagRow({ id: 1, name: 'work' }),
          createTagRow({ id: 2, name: 'personal' }),
        ],
        initialEntryTags: [
          createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 }),
          createEntryTagRow({ entry_id: 'entry-2', tag_id: 2 }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('タグ:')
    expect(body).toContain('Work log')
    expect(body).not.toContain('Private note')
  })

  it('filters by calendar date', async () => {
    const { response, body } = await requestApp('/search?month=2026-04&date=2026-04-21', {
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            title: 'April twenty-first',
            journal_date: '2026-04-21',
            summary: 'Match this day',
            body_key: 'entries/entry-1.md',
          }),
          createEntryRow({
            id: 'entry-2',
            title: 'Another day',
            journal_date: '2026-04-22',
            summary: 'Should be filtered out',
            body_key: 'entries/entry-2.md',
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('April twenty-first')
    expect(body).toContain('2026-04-21')
    expect(body).not.toContain('Another day')
    expect(body).toContain('href="/search?month=2026-04&amp;date=2026-04-21"')
  })

  it('shows the empty state for blank queries with no entries', async () => {
    const { response, body } = await requestApp('/search?q=%20%20', {
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('Results')
    expect(body).toContain('一致する記事はありません。')
  })
})
