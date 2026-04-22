import { describe, expect, it } from 'vitest'
import { createEntryRow, createUserRow, requestApp } from '../test-support'

describe('entries route', () => {
  it('shows the selected day and entry list from query params', async () => {
    const { response, body } = await requestApp('/entries?month=2026-04&date=2026-04-22&entry=entry-2', {
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            title: 'Morning entry',
            summary: 'Summary one',
            ai_summary: null,
            created_at: '2026-04-22T08:00:00.000Z',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Evening entry',
            summary: 'Summary two',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
          createEntryRow({
            id: 'entry-3',
            user_id: 'user-1',
            journal_date: '2026-04-21',
            title: 'Different day',
            summary: 'Hidden',
            ai_summary: null,
            body_key: 'entries/entry-3.md',
            created_at: '2026-04-21T08:00:00.000Z',
            updated_at: '2026-04-21T08:00:00.000Z',
            deleted_at: '2026-04-21T09:00:00.000Z',
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('Journal')
    expect(body).toContain('Tester')
    expect(body).toContain('Calendar')
    expect(body).toContain('Selected day')
    expect(body).toContain('2026-04-22')
    expect(body).toContain('Article detail and editor')
    expect(body).toContain('Edit the selected entry')
    expect(body).toContain('Morning entry')
    expect(body).toContain('Evening entry')
    expect(body).toContain('Summary one')
    expect(body).toContain('Summary two')
    expect(body).not.toContain('Different day')
    expect(body).not.toContain('Hidden')
    expect(body).toContain('href="/entries?month=2026-04&amp;date=2026-04-22&amp;entry=entry-1"')
  })

  it('returns a partial workspace for htmx requests', async () => {
    const { response, body } = await requestApp('/entries?month=2026-04&date=2026-04-22', {
      init: {
        headers: {
          'HX-Request': 'true',
        },
      },
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            title: 'Partial entry',
            summary: 'Summary one',
            ai_summary: null,
            created_at: '2026-04-22T08:00:00.000Z',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('id="journal-workspace"')
    expect(body).not.toContain('<!DOCTYPE html>')
    expect(body).toContain('Partial entry')
  })
})
