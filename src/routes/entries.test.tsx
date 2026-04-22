import app from '../app'
import { describe, expect, it } from 'vitest'
import { createEntryRow, createUserRow, createMockEnv, requestApp } from '../test-support'

const accessHeaders = {
  'cf-access-authenticated-user-email': 'tester@example.com',
  'cf-access-authenticated-user-id': 'access-subject-1',
  'cf-access-authenticated-user-name': 'Tester',
  'cf-access-authenticated-user-avatar': 'https://example.com/avatar.png',
}

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
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-1.md',
            body: 'Morning body',
          },
          {
            key: 'entries/entry-2.md',
            body: 'Selected entry body from R2',
          },
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
    expect(body).toContain('Selected entry body from R2')
    expect(body).toContain('Summary one')
    expect(body).toContain('Summary two')
    expect(body).not.toContain('Different day')
    expect(body).not.toContain('Hidden')
    expect(body).toContain('href="/entries?month=2026-04&amp;date=2026-04-22&amp;entry=entry-1"')
  })

  it('renders the create entry form without losing the selected day state', async () => {
    const { response, body } = await requestApp('/entries/new?month=2026-04&date=2026-04-22', {
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
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('Create a new entry')
    expect(body).toContain('journal draft')
    expect(body).toContain('name="journal_date"')
    expect(body).toContain('value="2026-04-22"')
    expect(body).toContain('Selected day')
    expect(body).toContain('Morning entry')
    expect(body).toContain('Summary one')
    expect(body).toContain('ring-1 ring-cyan-400/40')
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

  it('creates an entry in R2 and D1 then redirects to the created entry', async () => {
    const form = new URLSearchParams({
      journal_date: '2026-04-22',
      title: 'New entry',
      summary: 'Created via form',
      body: '# New entry\n\nHello journal.',
    })

    const env = await createMockEnv()
    const response = await app.request(
      '/entries',
      {
        method: 'POST',
        headers: {
          ...accessHeaders,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: form,
      },
      env
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      `/entries?month=2026-04&date=2026-04-22&entry=${env.DB.state.entries[0].id}`
    )
    expect(env.DB.state.users).toHaveLength(1)
    expect(env.DB.state.entries).toHaveLength(1)
    expect(env.DB.state.entries[0]).toMatchObject({
      user_id: env.DB.state.users[0].id,
      journal_date: '2026-04-22',
      title: 'New entry',
      summary: 'Created via form',
      body_key: `entries/2026/04/22/${env.DB.state.entries[0].id}.md`,
      status: 'private',
    })
    expect(env.JOURNAL_BUCKET.state.writes).toHaveLength(1)
    expect(env.JOURNAL_BUCKET.state.objects.size).toBe(1)
    const bodyObject = await env.JOURNAL_BUCKET.get(env.DB.state.entries[0].body_key)
    expect(await bodyObject!.text()).toBe('# New entry\n\nHello journal.')

    const followResponse = await app.request(
      `/entries?month=2026-04&date=2026-04-22&entry=${env.DB.state.entries[0].id}`,
      {
        headers: accessHeaders,
      },
      env
    )
    const followBody = await followResponse.text()

    expect(followResponse.status).toBe(200)
    expect(followBody).toContain('Selected article')
    expect(followBody).toContain('New entry')
    expect(followBody).toContain('Hello journal.')
  })
})
