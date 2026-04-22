import { describe, expect, it } from 'vitest'
import app from '../app'
import { createMockEnv } from '../test-support'

describe('entries route', () => {
  it('lists visible entries from D1', async () => {
    const env = await createMockEnv({
      db: {
        initialEntries: [
          {
            id: 'entry-1',
            journal_date: '2026-04-22',
            title: 'First entry',
            summary: 'Summary one',
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
            title: 'Deleted entry',
            summary: 'Hidden',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            status: 'private',
            created_at: '2026-04-21T08:00:00.000Z',
            updated_at: '2026-04-21T08:00:00.000Z',
            deleted_at: '2026-04-21T09:00:00.000Z',
          },
        ],
      },
    })

    const res = await app.request('/entries', {}, env)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('Entries')
    expect(body).toContain('hx-get="/search"')
    expect(body).toContain('First entry')
    expect(body).toContain('Summary one')
    expect(body).not.toContain('Deleted entry')
    expect(body).not.toContain('Hidden')
  })
})
