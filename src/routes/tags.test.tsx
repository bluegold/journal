import app from '../app'
import { describe, expect, it } from 'vitest'
import { createEntryRow, createEntryTagRow, createMockEnv, createTagRow, createUserRow } from '../test-support'

const accessHeaders = {
  'cf-access-authenticated-user-email': 'tester@example.com',
  'cf-access-authenticated-user-id': 'access-subject-1',
  'cf-access-authenticated-user-name': 'Tester',
}

describe('tags route', () => {
  it('returns tag stats with usage counts and includes unused tags', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialTags: [
          createTagRow({ id: 1, name: 'ideas' }),
          createTagRow({ id: 2, name: 'work' }),
          createTagRow({ id: 3, name: 'travel' }),
        ],
        initialEntries: [
          createEntryRow({ id: 'entry-1', user_id: 'user-1', title: 'One' }),
          createEntryRow({ id: 'entry-2', user_id: 'user-1', title: 'Two' }),
          createEntryRow({
            id: 'entry-3',
            user_id: 'user-1',
            title: 'Deleted',
            deleted_at: '2026-04-23T00:00:00.000Z',
          }),
        ],
        initialEntryTags: [
          createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 }),
          createEntryTagRow({ entry_id: 'entry-2', tag_id: 1 }),
          createEntryTagRow({ entry_id: 'entry-1', tag_id: 2 }),
          createEntryTagRow({ entry_id: 'entry-3', tag_id: 3 }),
        ],
      },
    })

    const response = await app.request(
      '/tags',
      {
        headers: accessHeaders,
      },
      env
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')

    const body = await response.json<{
      tags: Array<{ id: number; name: string; usage_count: number; weight: number }>
    }>()

    expect(body.tags).toEqual([
      { id: 1, name: 'ideas', usage_count: 2, weight: 2 },
      { id: 2, name: 'work', usage_count: 1, weight: 1 },
      { id: 3, name: 'travel', usage_count: 0, weight: 0 },
    ])
  })

  it('returns autocomplete suggestions for the current draft input', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialTags: [
          createTagRow({ id: 1, name: 'ideas' }),
          createTagRow({ id: 2, name: 'work' }),
          createTagRow({ id: 3, name: 'travel' }),
        ],
        initialEntries: [createEntryRow({ id: 'entry-1', user_id: 'user-1', title: 'One' })],
        initialEntryTags: [
          createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 }),
          createEntryTagRow({ entry_id: 'entry-1', tag_id: 2 }),
        ],
      },
    })

    const response = await app.request(
      '/tags/autocomplete?tags_field_id=entry-compose-tags&tags_form_id=entry-compose-form&tags=work,%20i',
      {
        headers: accessHeaders,
      },
      env
    )

    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).toContain('id="entry-compose-tags-suggestions"')
    expect(body).toContain('Matches for &quot;i&quot;')
    expect(body).toContain('ideas')
    expect(body).not.toContain('work')
    expect(body).toContain('hx-include="#entry-compose-form"')
  })

  it('returns a field replacement when a suggestion is selected', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialTags: [
          createTagRow({ id: 1, name: 'ideas' }),
          createTagRow({ id: 2, name: 'work' }),
          createTagRow({ id: 3, name: 'travel' }),
        ],
        initialEntries: [createEntryRow({ id: 'entry-1', user_id: 'user-1', title: 'One' })],
        initialEntryTags: [createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 })],
      },
    })

    const response = await app.request(
      '/tags/autocomplete?tags_field_id=entry-edit-tags&tags_form_id=entry-edit-form&tags=work,%20i&selected_tag=ideas',
      {
        headers: accessHeaders,
      },
      env
    )

    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).toContain('id="entry-edit-tags-field"')
    expect(body).toContain('work, ideas, ')
    expect(body).toContain('data-focus-end="true"')
    expect(body).toContain('id="entry-edit-tags-suggestions"')
    expect(body).toContain('Popular tags')
    expect(body).toContain('hx-include="#entry-edit-form"')
  })
})
