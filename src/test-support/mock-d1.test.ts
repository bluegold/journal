import { describe, expect, it } from 'vitest'
import { createEntryRow, createTagRow, createUserRow } from './fixtures'
import { createMockD1 } from './mock-d1'

describe('mock D1 database', () => {
  it('stores users, entries, updates them, and deletes them through query-shaped statements', async () => {
    const db = createMockD1({
      initialUsers: [createUserRow()],
    })

    await db
      .prepare(
        'INSERT INTO users (id, access_subject, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        'user-2',
        'access-subject-2',
        'writer@example.com',
        'Writer',
        'https://example.com/writer.png',
        '2026-04-22T00:00:00.000Z',
        '2026-04-22T00:00:00.000Z'
      )
      .run()

    const insertedUser = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind('user-2').first<{
      id: string
      access_subject: string
      email: string
      name: string
      avatar_url: string | null
    }>()

    expect(insertedUser).toEqual({
      id: 'user-2',
      access_subject: 'access-subject-2',
      email: 'writer@example.com',
      name: 'Writer',
      avatar_url: 'https://example.com/writer.png',
      created_at: '2026-04-22T00:00:00.000Z',
      updated_at: '2026-04-22T00:00:00.000Z',
    })

    await db
      .prepare(
        'INSERT INTO entries (id, user_id, journal_date, title, summary, ai_summary, body_key, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        'entry-1',
        'user-2',
        '2026-04-22',
        'First entry',
        'summary',
        'ai summary',
        'entries/entry-1.md',
        'private',
        '2026-04-22T00:00:00.000Z',
        '2026-04-22T00:00:00.000Z',
        null
      )
      .run()

    await db
      .prepare('UPDATE entries SET summary = ?, ai_summary = ?, body_key = ?, status = ?, updated_at = ? WHERE id = ?')
      .bind('updated summary', 'updated ai', 'entries/entry-1-v2.md', 'public', '2026-04-22T01:00:00.000Z', 'entry-1')
      .run()

    const updated = await db.prepare('SELECT * FROM entries WHERE id = ? LIMIT 1').bind('entry-1').first<{
      id: string
      summary: string | null
      ai_summary: string | null
      body_key: string
      status: string
      updated_at: string
    }>()

    expect(updated).toMatchObject({
      id: 'entry-1',
      user_id: 'user-2',
      summary: 'updated summary',
      ai_summary: 'updated ai',
      body_key: 'entries/entry-1-v2.md',
      status: 'public',
      updated_at: '2026-04-22T01:00:00.000Z',
    })

    await db
      .prepare('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ?')
      .bind('2026-04-22T02:00:00.000Z', '2026-04-22T02:00:00.000Z', 'entry-1')
      .run()

    const deleted = await db.prepare('SELECT * FROM entries WHERE id = ? LIMIT 1').bind('entry-1').first<{
      deleted_at: string | null
      updated_at: string
    }>()

    expect(deleted).toMatchObject({
      deleted_at: '2026-04-22T02:00:00.000Z',
      updated_at: '2026-04-22T02:00:00.000Z',
    })

    await db.prepare('DELETE FROM entries WHERE id = ?').bind('entry-1').run()
    expect(await db.prepare('SELECT * FROM entries WHERE id = ? LIMIT 1').bind('entry-1').first()).toBeNull()
    expect(db.state.entries).toHaveLength(0)
    expect(db.state.queries.at(-1)?.sql).toBe('SELECT * FROM entries WHERE id = ? LIMIT 1')

    const allUsers = await db.prepare('SELECT * FROM users').all<{
      id: string
      email: string
    }>()

    expect(allUsers.results.map((user) => user.id)).toEqual(['user-2', 'user-1'])

    await db.prepare('UPDATE imaginary SET value = ? WHERE id = ?').bind('value', 'id').run()
  })

  it('updates users, deduplicates by access subject and email, and auto-generates ids', async () => {
    const db = createMockD1({
      initialUsers: [createUserRow()],
    })

    await db
      .prepare(
        'INSERT INTO users (id, access_subject, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        null,
        'access-subject-2',
        'writer@example.com',
        'Writer',
        'https://example.com/writer.png',
        '2026-04-22T00:00:00.000Z',
        '2026-04-22T00:00:00.000Z'
      )
      .run()

    await db
      .prepare(
        'INSERT INTO users (id, access_subject, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        null,
        'access-subject-2',
        'writer@example.com',
        'Writer duplicate',
        'https://example.com/writer-2.png',
        '2026-04-22T00:10:00.000Z',
        '2026-04-22T00:10:00.000Z'
      )
      .run()

    await db
      .prepare('UPDATE users SET access_subject = ?, email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?')
      .bind(
        'access-subject-2-updated',
        'writer-updated@example.com',
        'Writer Updated',
        null,
        '2026-04-22T01:00:00.000Z',
        'user-2'
      )
      .run()

    await db
      .prepare('INSERT INTO users (id, access_subject, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(
        null,
        'access-subject-3',
        'second@example.com',
        'Second',
        null,
        '2026-04-22T02:00:00.000Z',
        '2026-04-22T02:00:00.000Z'
      )
      .run()

    const inserted = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind('user-2').first<{
      id: string
      access_subject: string
      email: string
      name: string
      avatar_url: string | null
    }>()

    const updated = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind('user-2').first<{
      id: string
      access_subject: string
      email: string
      name: string
      avatar_url: string | null
      updated_at: string
    }>()

    const missing = await db.prepare('SELECT * FROM unknown_table WHERE id = ? LIMIT 1').bind('whatever').first()
    const missingRows = await db.prepare('SELECT * FROM unknown_table').all()

    expect(inserted).toMatchObject({
      id: 'user-2',
      access_subject: 'access-subject-2-updated',
      email: 'writer-updated@example.com',
      name: 'Writer Updated',
      avatar_url: null,
    })
    expect(updated).toMatchObject({
      id: 'user-2',
      access_subject: 'access-subject-2-updated',
      email: 'writer-updated@example.com',
      name: 'Writer Updated',
      avatar_url: null,
      updated_at: '2026-04-22T01:00:00.000Z',
    })
    expect(db.state.users).toHaveLength(3)
    expect(db.state.users[2]).toMatchObject({
      id: 'user-3',
      access_subject: 'access-subject-3',
      email: 'second@example.com',
    })
    expect(missing).toBeNull()
    expect(missingRows.results).toEqual([])
  })

  it('deduplicates tags, links entries, and exposes lookup queries', async () => {
    const db = createMockD1({
      initialUsers: [createUserRow()],
      initialEntries: [
        createEntryRow({
          id: 'entry-2',
          user_id: 'user-1',
          title: 'Taggable',
          created_at: '2026-04-22T01:00:00.000Z',
        }),
      ],
    })

    await db
      .prepare('INSERT INTO tags (user_id, name, created_at) VALUES (?, ?, ?)')
      .bind('user-1', 'journal', '2026-04-22T01:00:00.000Z')
      .run()
    await db
      .prepare('INSERT INTO tags (user_id, name, created_at) VALUES (?, ?, ?)')
      .bind('user-1', 'journal', '2026-04-22T01:05:00.000Z')
      .run()
    await db
      .prepare('INSERT INTO tags (user_id, name, created_at) VALUES (?, ?, ?)')
      .bind('user-1', 'cloudflare', '2026-04-22T01:10:00.000Z')
      .run()

    const tagById = await db.prepare('SELECT * FROM tags WHERE id = ? LIMIT 1').bind(2).first<{
      id: number
      user_id: string
      name: string
      created_at: string | null
    }>()
    const tagByName = await db.prepare('SELECT * FROM tags WHERE name = ? LIMIT 1').bind('journal').first<{
      id: number
      user_id: string
      name: string
    }>()

    expect(tagById).toEqual({
      id: 2,
      user_id: 'user-1',
      name: 'cloudflare',
      created_at: '2026-04-22T01:10:00.000Z',
    })
    expect(tagByName).toEqual({
      id: 1,
      user_id: 'user-1',
      name: 'journal',
      created_at: '2026-04-22T01:00:00.000Z',
    })
    expect(db.state.tags[0]).toEqual({
      id: 1,
      user_id: 'user-1',
      name: 'journal',
      created_at: '2026-04-22T01:00:00.000Z',
    })

    const allTags = await db.prepare('SELECT * FROM tags').all<{
      id: number
      user_id: string
      name: string
      created_at: string | null
    }>()

    expect(allTags.results.map((tag) => tag.name)).toEqual(['cloudflare', 'journal'])

    await db
      .prepare('INSERT INTO entry_tags (entry_id, tag_id, created_at) VALUES (?, ?, ?)')
      .bind('entry-2', 1, '2026-04-22T01:15:00.000Z')
      .run()

    const entryTags = await db.prepare('SELECT * FROM entry_tags').all<{
      entry_id: string
      tag_id: number
      created_at: string | null
    }>()

    expect(entryTags.results).toEqual([
      {
        entry_id: 'entry-2',
        tag_id: 1,
        created_at: '2026-04-22T01:15:00.000Z',
      },
    ])
  })

  it('filters entries by user id in list queries', async () => {
    const db = createMockD1({
      initialUsers: [createUserRow(), createUserRow({ id: 'user-2', access_subject: 'access-subject-2', email: 'other@example.com' })],
      initialEntries: [
        createEntryRow({ id: 'entry-1', user_id: 'user-1', title: 'Mine', created_at: '2026-04-22T03:00:00.000Z' }),
        createEntryRow({ id: 'entry-2', user_id: 'user-2', title: 'Theirs', created_at: '2026-04-22T04:00:00.000Z' }),
      ],
    })

    const rows = await db
      .prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC')
      .bind('user-1')
      .all<{
        id: string
        user_id: string
      }>()

    expect(rows.results).toEqual([
      {
        id: 'entry-1',
        user_id: 'user-1',
        journal_date: '2026-04-22',
        title: 'Mine',
        summary: 'summary',
        ai_summary: 'ai summary',
        body_key: 'entries/entry-1.md',
        status: 'private',
        created_at: '2026-04-22T03:00:00.000Z',
        updated_at: '2026-04-22T00:00:00.000Z',
        deleted_at: null,
      },
    ])
  })

  it('tracks AI tag candidates and sorts list queries by created_at descending', async () => {
    const db = createMockD1({
      initialUsers: [createUserRow()],
      initialEntries: [
        createEntryRow({ id: 'entry-3', user_id: 'user-1', created_at: '2026-04-22T03:00:00.000Z', title: 'Later' }),
        createEntryRow({ id: 'entry-4', user_id: 'user-1', created_at: '2026-04-22T02:00:00.000Z', title: 'Earlier' }),
      ],
    })

    await db
      .prepare('INSERT INTO entry_ai_tag_candidates (entry_id, tag_name, created_at) VALUES (?, ?, ?)')
      .bind('entry-3', 'ideas', '2026-04-22T03:10:00.000Z')
      .run()
    await db
      .prepare('INSERT INTO entry_ai_tag_candidates (entry_id, tag_name, created_at) VALUES (?, ?, ?)')
      .bind('entry-3', 'ideas', '2026-04-22T03:20:00.000Z')
      .run()
    await db
      .prepare('INSERT INTO entry_ai_tag_candidates (entry_id, tag_name, created_at) VALUES (?, ?, ?)')
      .bind('entry-3', 'planning', '2026-04-22T03:30:00.000Z')
      .run()

    const candidate = await db
      .prepare('SELECT * FROM entry_ai_tag_candidates WHERE entry_id = ? LIMIT 1')
      .bind('entry-3')
      .first<{
        id: number
        entry_id: string
        tag_name: string
        created_at: string
      }>()

    const candidates = await db.prepare('SELECT * FROM entry_ai_tag_candidates').all<{
      id: number
      entry_id: string
      tag_name: string
      created_at: string
    }>()
    const entries = await db.prepare('SELECT * FROM entries').all<{
      id: string
      created_at: string
    }>()

    expect(candidate).toEqual({
      id: 1,
      entry_id: 'entry-3',
      tag_name: 'ideas',
      created_at: '2026-04-22T03:10:00.000Z',
    })
    expect(candidates.results).toEqual([
      {
        id: 2,
        entry_id: 'entry-3',
        tag_name: 'planning',
        created_at: '2026-04-22T03:30:00.000Z',
      },
      {
        id: 1,
        entry_id: 'entry-3',
        tag_name: 'ideas',
        created_at: '2026-04-22T03:10:00.000Z',
      },
    ])

    await db.prepare('DELETE FROM entry_ai_tag_candidates WHERE entry_id = ? AND tag_name = ?').bind('entry-3', 'ideas').run()

    const remainingCandidates = await db.prepare('SELECT * FROM entry_ai_tag_candidates').all<{
      id: number
      entry_id: string
      tag_name: string
      created_at: string
    }>()

    expect(remainingCandidates.results).toEqual([
      {
        id: 2,
        entry_id: 'entry-3',
        tag_name: 'planning',
        created_at: '2026-04-22T03:30:00.000Z',
      },
    ])
    expect(entries.results.map((entry) => entry.id)).toEqual(['entry-3', 'entry-4'])

    await db.prepare('DELETE FROM entry_ai_tag_candidates WHERE entry_id = ?').bind('entry-3').run()

    const clearedCandidates = await db.prepare('SELECT * FROM entry_ai_tag_candidates').all<{
      id: number
      entry_id: string
      tag_name: string
      created_at: string
    }>()

    expect(clearedCandidates.results).toEqual([])
  })

  it('clones initial state so tests can mutate their fixtures safely', async () => {
    const initialEntries = [createEntryRow({ id: 'entry-5', user_id: 'user-1', title: 'Original' })]
    const db = createMockD1({ initialEntries })

    initialEntries[0].title = 'Mutated'

    const row = await db.prepare('SELECT * FROM entries WHERE id = ? LIMIT 1').bind('entry-5').first<{
      title: string
    }>()

    expect(row?.title).toBe('Original')
  })
})
