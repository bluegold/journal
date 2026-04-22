import { describe, expect, it } from 'vitest'
import { createMockD1 } from './mock-d1'

describe('mock D1 database', () => {
  it('stores entries and resolves them through select queries', async () => {
    const db = createMockD1()

    await db
      .prepare(
        'INSERT INTO entries (id, journal_date, title, summary, ai_summary, body_key, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        'entry-1',
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

    const row = await db
      .prepare('SELECT * FROM entries WHERE id = ? LIMIT 1')
      .bind('entry-1')
      .first<{
        id: string
        title: string
        body_key: string
      }>()

    expect(row).toEqual({
      id: 'entry-1',
      journal_date: '2026-04-22',
      title: 'First entry',
      summary: 'summary',
      ai_summary: 'ai summary',
      body_key: 'entries/entry-1.md',
      status: 'private',
      created_at: '2026-04-22T00:00:00.000Z',
      updated_at: '2026-04-22T00:00:00.000Z',
      deleted_at: null,
    })
    expect(db.state.queries.at(-1)?.sql).toBe('SELECT * FROM entries WHERE id = ? LIMIT 1')
  })

  it('deduplicates tags by name and links entries to tags', async () => {
    const db = createMockD1({
      initialEntries: [
        {
          id: 'entry-2',
          journal_date: '2026-04-22',
          title: 'Taggable',
          summary: null,
          ai_summary: null,
          body_key: 'entries/entry-2.md',
          status: 'private',
          created_at: '2026-04-22T01:00:00.000Z',
          updated_at: '2026-04-22T01:00:00.000Z',
          deleted_at: null,
        },
      ],
    })

    await db.prepare('INSERT INTO tags (name, created_at) VALUES (?, ?)').bind('journal', '2026-04-22T01:00:00.000Z').run()
    await db.prepare('INSERT INTO tags (name, created_at) VALUES (?, ?)').bind('journal', '2026-04-22T01:05:00.000Z').run()

    const tag = await db.prepare('SELECT * FROM tags WHERE name = ? LIMIT 1').bind('journal').first<{
      id: number
      name: string
    }>()

    expect(tag).toEqual({
      id: 1,
      name: 'journal',
      created_at: '2026-04-22T01:00:00.000Z',
    })

    await db
      .prepare('INSERT INTO entry_tags (entry_id, tag_id, created_at) VALUES (?, ?, ?)')
      .bind('entry-2', 1, '2026-04-22T01:10:00.000Z')
      .run()

    const entryTags = await db.prepare('SELECT * FROM entry_tags').all<{
      entry_id: string
      tag_id: number
    }>()

    expect(entryTags.results).toEqual([
      {
        entry_id: 'entry-2',
        tag_id: 1,
        created_at: '2026-04-22T01:10:00.000Z',
      },
    ])
  })
})
