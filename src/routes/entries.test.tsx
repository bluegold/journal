import { describe, expect, it } from 'vitest'
import { createEntryRow, requestApp } from '../test-support'

describe('entries route', () => {
  it('lists visible entries from D1', async () => {
    const { response, body } = await requestApp('/entries', {
      db: {
        initialEntries: [
          createEntryRow({
            title: 'First entry',
            summary: 'Summary one',
            ai_summary: null,
            created_at: '2026-04-22T08:00:00.000Z',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
          createEntryRow({
            id: 'entry-2',
            journal_date: '2026-04-21',
            title: 'Deleted entry',
            summary: 'Hidden',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-21T08:00:00.000Z',
            updated_at: '2026-04-21T08:00:00.000Z',
            deleted_at: '2026-04-21T09:00:00.000Z',
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('Entries')
    expect(body).toContain('hx-get="/search"')
    expect(body).toContain('First entry')
    expect(body).toContain('Summary one')
    expect(body).not.toContain('Deleted entry')
    expect(body).not.toContain('Hidden')
  })
})
