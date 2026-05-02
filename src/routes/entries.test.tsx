import app from '../app'
import { describe, expect, it, vi } from 'vitest'
import {
  createEntryRow,
  createEntryTagRow,
  createMockEnv,
  createTagRow,
  createUserRow,
  requestApp,
} from '../test-support'

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
        initialTags: [
          createTagRow({
            id: 1,
            name: 'travel',
          }),
        ],
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
        initialEntryTags: [
          createEntryTagRow({
            entry_id: 'entry-2',
            tag_id: 1,
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
    expect(body).toContain('2026-04-22')
    expect(body).toContain('Tags')
    expect(body).toContain('travel')
    expect(body).toContain('href="/search?tag=travel"')
    expect(body).toContain('Selected article')
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
    expect(body).toContain('Morning entry')
    expect(body).toContain('Summary one')
    expect(body).toContain('Cancel')
    expect(body).toContain('ring-1 ring-cyan-300/50')
  })

  it('renders the edit entry form for the selected entry', async () => {
    const { response, body } = await requestApp('/entries/entry-2/edit?month=2026-04&date=2026-04-22', {
      db: {
        initialUsers: [createUserRow()],
        initialTags: [
          createTagRow({
            id: 1,
            name: 'work',
          }),
          createTagRow({
            id: 2,
            name: 'ideas',
          }),
        ],
        initialEntries: [
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Editable entry',
            summary: 'Editable summary',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
        ],
        initialEntryTags: [
          createEntryTagRow({
            entry_id: 'entry-2',
            tag_id: 1,
          }),
          createEntryTagRow({
            entry_id: 'entry-2',
            tag_id: 2,
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-2.md',
            body: '# Editable entry\n\nOriginal body.',
          },
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('Edit the selected entry')
    expect(body).toContain('name="journal_date"')
    expect(body).toContain('value="2026-04-22"')
    expect(body).toContain('Editable entry')
    expect(body).toContain('Original body.')
    expect(body).toContain('name="tags"')
    expect(body).toContain('work, ideas')
    expect(body).toContain('Save changes')
    expect(body).toContain('Preview')
    expect(body).toContain('Cancel')
  })

  it('renders the edit entry fragment for htmx requests', async () => {
    const { response, body } = await requestApp('/entries/entry-2/edit?month=2026-04&date=2026-04-22', {
      init: {
        headers: {
          'HX-Request': 'true',
        },
      },
      db: {
        initialUsers: [createUserRow()],
        initialTags: [
          createTagRow({
            id: 1,
            name: 'work',
          }),
          createTagRow({
            id: 2,
            name: 'ideas',
          }),
        ],
        initialEntries: [
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Editable entry',
            summary: 'Editable summary',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
        ],
        initialEntryTags: [
          createEntryTagRow({
            entry_id: 'entry-2',
            tag_id: 1,
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-2.md',
            body: '# Editable entry\n\nOriginal body.',
          },
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('id="journal-content"')
    expect(body).toContain('Edit the selected entry')
    expect(body).toContain('Original body.')
    expect(body).toContain('Preview')
    expect(body).toContain('Cancel')
  })

  it('renders the edit entry form with an empty body when R2 has no content', async () => {
    const { response, body } = await requestApp('/entries/entry-2/edit?month=2026-04&date=2026-04-22', {
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Editable entry',
            summary: 'Editable summary',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('Edit the selected entry')
    expect(body).toContain('name="body"')
    expect(body).not.toContain('Original body.')
    expect(body).toContain('Preview')
  })

  it('returns 404 when editing, updating, or deleting a missing entry', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
      },
    })

    const editResponse = await app.request(
      '/entries/missing/edit',
      {
        headers: accessHeaders,
      },
      env
    )
    const updateResponse = await app.request(
      '/entries/missing',
      {
        method: 'POST',
        headers: {
          ...accessHeaders,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          title: 'Updated title',
        }),
      },
      env
    )
    const deleteResponse = await app.request(
      '/entries/missing/delete',
      {
        method: 'POST',
        headers: accessHeaders,
      },
      env
    )

    expect(editResponse.status).toBe(404)
    expect(await editResponse.text()).toBe('Entry not found.')
    expect(updateResponse.status).toBe(404)
    expect(await updateResponse.text()).toBe('Entry not found.')
    expect(deleteResponse.status).toBe(404)
    expect(await deleteResponse.text()).toBe('Entry not found.')
  })

  it('updates an entry, moves the R2 body key when the date changes, and redirects to the new day', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialTags: [
          createTagRow({
            id: 1,
            name: 'work',
          }),
          createTagRow({
            id: 2,
            name: 'ideas',
          }),
        ],
        initialEntries: [
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Editable entry',
            summary: 'Editable summary',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
        ],
        initialEntryTags: [
          createEntryTagRow({
            entry_id: 'entry-2',
            tag_id: 1,
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-2.md',
            body: '# Editable entry\n\nOriginal body.',
          },
        ],
      },
    })

    const form = new URLSearchParams({
      journal_date: '2026-04-23',
      title: 'Updated entry',
      summary: 'Updated summary',
      tags: 'Ideas, personal',
      body: '# Updated entry\n\nUpdated body.',
    })

    const response = await app.request(
      '/entries/entry-2',
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
    expect(response.headers.get('location')).toBe('/entries?month=2026-04&date=2026-04-23&entry=entry-2')
    expect(env.DB.state.entries[0]).toMatchObject({
      id: 'entry-2',
      journal_date: '2026-04-23',
      title: 'Updated entry',
      summary: 'Updated summary',
      body_key: 'entries/2026/04/23/entry-2.md',
    })
    expect(env.DB.state.tags.map((tag) => tag.name).sort()).toEqual(['ideas', 'personal', 'work'])
    expect(env.DB.state.entryTags.map((entryTag) => entryTag.tag_id).sort()).toEqual([2, 3])
    expect(await env.JOURNAL_BUCKET.get('entries/entry-2.md')).toBeNull()
    const movedBody = await env.JOURNAL_BUCKET.get('entries/2026/04/23/entry-2.md')
    expect(movedBody).not.toBeNull()
    if (!movedBody) {
      throw new Error('Expected moved body to exist')
    }
    expect(await movedBody.text()).toBe('# Updated entry\n\nUpdated body.')

    const followResponse = await app.request(
      '/entries?month=2026-04&date=2026-04-23&entry=entry-2',
      {
        headers: accessHeaders,
      },
      env
    )
    const followBody = await followResponse.text()

    expect(followResponse.status).toBe(200)
    expect(followBody).toContain('Updated entry')
    expect(followBody).toContain('Updated body.')
  })

  it('updates an entry without changing the day and keeps the current body key when body is omitted', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Original title',
            summary: null,
            ai_summary: null,
            body_key: 'entries/2026/04/22/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/2026/04/22/entry-2.md',
            body: '# Original title\n\nOriginal body.',
          },
        ],
      },
    })

    const form = new URLSearchParams({
      journal_date: '2026-04-22',
      title: '  ',
      summary: '  ',
    })

    const response = await app.request(
      '/entries/entry-2',
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
    expect(response.headers.get('location')).toBe('/entries?month=2026-04&date=2026-04-22&entry=entry-2')
    expect(env.DB.state.entries[0]).toMatchObject({
      id: 'entry-2',
      journal_date: '2026-04-22',
      title: '',
      summary: null,
      body_key: 'entries/2026/04/22/entry-2.md',
    })
    const keptBody = await env.JOURNAL_BUCKET.get('entries/2026/04/22/entry-2.md')
    expect(keptBody).not.toBeNull()
    if (!keptBody) {
      throw new Error('Expected kept body to exist')
    }
    expect(await keptBody.text()).toBe('# Untitled\n')
  })

  it('soft deletes an entry and removes it from the selected day list', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Entry to delete',
            summary: 'Delete me',
            ai_summary: null,
            body_key: 'entries/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-2.md',
            body: '# Entry to delete\n\nPlease delete.',
          },
        ],
      },
    })

    const response = await app.request(
      '/entries/entry-2/delete',
      {
        method: 'POST',
        headers: accessHeaders,
      },
      env
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/entries?month=2026-04&date=2026-04-22')
    expect(env.DB.state.entries[0]).toMatchObject({
      id: 'entry-2',
      deleted_at: expect.any(String),
    })

    const followResponse = await app.request(
      '/entries?month=2026-04&date=2026-04-22',
      {
        headers: accessHeaders,
      },
      env
    )
    const followBody = await followResponse.text()

    expect(followResponse.status).toBe(200)
    expect(followBody).toContain('No journal entries for this day.')
    expect(followBody).not.toContain('Entry to delete')
  })

  it('returns a fragment for new entry htmx requests with an invalid date fallback', async () => {
    const { response, body } = await requestApp('/entries/new?date=not-a-date', {
      init: {
        headers: {
          'HX-Request': 'true',
        },
      },
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('id="journal-content"')
    expect(body).toContain('Create a new entry')
    expect(body).toContain('name="journal_date"')
    expect(body).toContain('value="')
  })

  it('creates an entry with fallback body and summary fields', async () => {
    const env = await createMockEnv()
    const response = await app.request(
      '/entries?date=2026-04-22',
      {
        method: 'POST',
        headers: {
          ...accessHeaders,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          journal_date: 'not-a-real-date',
          title: '   ',
          summary: '   ',
          tags: 'Ideas, Work, ideas',
        }),
      },
      env
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toMatch(
      /^\/entries\?month=\d{4}-\d{2}&date=\d{4}-\d{2}-\d{2}&entry=[0-9a-f-]{36}$/
    )
    expect(env.DB.state.users).toHaveLength(1)
    expect(env.DB.state.entries).toHaveLength(1)
    expect(env.DB.state.entries[0]).toMatchObject({
      user_id: env.DB.state.users[0].id,
      title: '',
      summary: null,
      status: 'private',
    })
    expect(env.DB.state.tags.map((tag) => tag.name)).toEqual(['ideas', 'work'])
    expect(env.DB.state.entryTags).toHaveLength(2)
    const bodyObject = await env.JOURNAL_BUCKET.get(env.DB.state.entries[0].body_key)
    expect(bodyObject).not.toBeNull()
    if (!bodyObject) {
      throw new Error('Expected entry body to exist')
    }
    expect(await bodyObject.text()).toBe('# Untitled\n')
    expect(env.DB.state.entries[0].journal_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('renders a markdown preview fragment from the current form body', async () => {
    const { response, body } = await requestApp('/entries/preview', {
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          title: 'Preview title',
          body: '# Preview title\n\nHello preview.',
        }),
      },
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('id="entry-preview-overlay"')
    expect(body).toContain('fixed inset-0')
    expect(body).toContain('Rendered markdown')
    expect(body).toContain('<h1>Preview title</h1>')
    expect(body).toContain('Hello preview.')
  })

  it('renders a fallback preview when the body is empty', async () => {
    const { response, body } = await requestApp('/entries/preview', {
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          title: '   ',
          body: '   ',
        }),
      },
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('id="entry-preview-overlay"')
    expect(body).toContain('<h1>Untitled</h1>')
    expect(body).toContain('Close')
  })

  it('closes the preview overlay back to a hidden slot', async () => {
    const { response, body } = await requestApp('/entries/preview/close', {
      init: {
        headers: {
          'HX-Request': 'true',
        },
      },
      db: {
        initialUsers: [createUserRow()],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('id="entry-preview-overlay"')
    expect(body).toContain('hidden')
  })

  it('rolls back the body write when creating an entry fails after persisting to R2', async () => {
    const env = await createMockEnv()
    const originalPrepare = env.DB.prepare.bind(env.DB)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    env.DB.prepare = ((sql: string) => {
      const statement = originalPrepare(sql)

      if (!sql.includes('INSERT INTO entries')) {
        return statement
      }

      const failingStatement = {
        bind() {
          return failingStatement
        },
        async run() {
          throw new Error('forced insert failure')
        },
        async all<T>() {
          return statement.all<T>()
        },
        async first<T>() {
          return statement.first<T>()
        },
      }

      return failingStatement as never
    }) as typeof env.DB.prepare

    try {
      const response = await app.request(
        '/entries',
        {
          method: 'POST',
          headers: {
            ...accessHeaders,
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            journal_date: '2026-04-22',
            title: 'Broken entry',
            body: '# Broken entry\n\nThis should roll back.',
          }),
        },
        env
      )

      expect(response.status).toBe(500)
      expect(env.JOURNAL_BUCKET.state.writes).toHaveLength(1)
      expect(env.JOURNAL_BUCKET.state.deletes).toHaveLength(1)
      const writtenKey = env.JOURNAL_BUCKET.state.writes[0]?.key
      expect(writtenKey).toBeDefined()
      if (!writtenKey) {
        throw new Error('Expected a written key')
      }
      expect(await env.JOURNAL_BUCKET.get(writtenKey)).toBeNull()
      expect(env.DB.state.entries).toHaveLength(0)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('restores the previous body when an update fails without changing the day', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-2',
            user_id: 'user-1',
            journal_date: '2026-04-22',
            title: 'Original title',
            summary: null,
            ai_summary: null,
            body_key: 'entries/2026/04/22/entry-2.md',
            created_at: '2026-04-22T18:00:00.000Z',
            updated_at: '2026-04-22T18:00:00.000Z',
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/2026/04/22/entry-2.md',
            body: '# Original title\n\nOriginal body.',
          },
        ],
      },
    })
    const originalPrepare = env.DB.prepare.bind(env.DB)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    env.DB.prepare = ((sql: string) => {
      const statement = originalPrepare(sql)

      if (!sql.includes('UPDATE entries SET journal_date = ?, title = ?, summary = ?, body_key = ?, updated_at = ? WHERE id = ?')) {
        return statement
      }

      const failingStatement = {
        bind() {
          return failingStatement
        },
        async run() {
          throw new Error('forced update failure')
        },
        async all<T>() {
          return statement.all<T>()
        },
        async first<T>() {
          return statement.first<T>()
        },
      }

      return failingStatement as never
    }) as typeof env.DB.prepare

    try {
      const response = await app.request(
        '/entries/entry-2',
        {
          method: 'POST',
          headers: {
            ...accessHeaders,
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            journal_date: '2026-04-22',
            title: 'Updated title',
            body: '# Updated title\n\nUpdated body.',
          }),
        },
        env
      )

      expect(response.status).toBe(500)
      expect(env.JOURNAL_BUCKET.state.writes).toHaveLength(2)
      expect(env.JOURNAL_BUCKET.state.deletes).toEqual(['entries/2026/04/22/entry-2.md'])
      const restored = await env.JOURNAL_BUCKET.get('entries/2026/04/22/entry-2.md')
      expect(restored).not.toBeNull()
      if (!restored) {
        throw new Error('Expected restored body to exist')
      }
      expect(await restored.text()).toBe('# Original title\n\nOriginal body.')
      expect(env.DB.state.entries[0]).toMatchObject({
        id: 'entry-2',
        title: 'Original title',
        body_key: 'entries/2026/04/22/entry-2.md',
      })
    } finally {
      consoleErrorSpy.mockRestore()
    }
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
    expect(bodyObject).not.toBeNull()
    if (!bodyObject) {
      throw new Error('Expected created entry body to exist')
    }
    expect(await bodyObject.text()).toBe('# New entry\n\nHello journal.')

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
