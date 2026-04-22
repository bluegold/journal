import { describe, expect, it } from 'vitest'
import { createMockD1, createEntryRow, createEntryTagRow, createTagRow } from '../test-support'
import { loadEntryTagNames, replaceEntryTags } from './entry-tags'

describe('entry tag helpers', () => {
  it('creates tags, links entries, and loads entry tag names', async () => {
    const db = createMockD1({
      initialEntries: [createEntryRow()],
      initialTags: [createTagRow()],
      initialEntryTags: [createEntryTagRow()],
    })

    const tagNames = await replaceEntryTags({
      db,
      userId: 'user-1',
      entryId: 'entry-1',
      tagText: 'Ideas, Work, ideas',
      timestamp: '2026-04-22T00:00:00.000Z',
    })

    expect(tagNames).toEqual(['ideas', 'work'])
    expect(db.state.tags.map((tag) => tag.name).sort()).toEqual(['ideas', 'journal', 'work'])
    expect(db.state.entryTags).toEqual([
      {
        entry_id: 'entry-1',
        tag_id: 2,
        created_at: '2026-04-22T00:00:00.000Z',
      },
      {
        entry_id: 'entry-1',
        tag_id: 3,
        created_at: '2026-04-22T00:00:00.000Z',
      },
    ])

    const loadedTagNames = await loadEntryTagNames(db, 'user-1', 'entry-1')
    expect(loadedTagNames).toEqual(['ideas', 'work'])
  })

  it('restores entry tags and removes newly created tags when linking fails', async () => {
    const db = createMockD1({
      initialEntries: [createEntryRow()],
      initialTags: [createTagRow()],
      initialEntryTags: [createEntryTagRow()],
    })
    const originalPrepare = db.prepare.bind(db)
    let entryTagInsertCount = 0

    db.prepare = ((sql: string) => {
      const statement = originalPrepare(sql)

      if (!sql.startsWith('INSERT INTO entry_tags')) {
        return statement
      }

      return {
        bind(...params: unknown[]) {
          const bound = statement.bind(...params)
          return {
            async run() {
              entryTagInsertCount += 1
              if (entryTagInsertCount === 2) {
                throw new Error('forced tag link failure')
              }

              return bound.run()
            },
            async all<T>() {
              return bound.all<T>()
            },
            async first<T>() {
              return bound.first<T>()
            },
          }
        },
        async run() {
          return statement.run()
        },
        async all<T>() {
          return statement.all<T>()
        },
        async first<T>() {
          return statement.first<T>()
        },
      } as never
    }) as typeof db.prepare

    await expect(
      replaceEntryTags({
        db,
        userId: 'user-1',
        entryId: 'entry-1',
        tagText: 'Ideas, Work',
        timestamp: '2026-04-22T00:00:00.000Z',
      })
    ).rejects.toThrow('forced tag link failure')

    expect(db.state.tags.map((tag) => tag.name)).toEqual(['journal'])
    expect(db.state.entryTags).toEqual([
      {
        entry_id: 'entry-1',
        tag_id: 1,
        created_at: '2026-04-22T00:00:00.000Z',
      },
    ])
  })
})
