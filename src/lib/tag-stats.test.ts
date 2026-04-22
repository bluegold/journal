import { describe, expect, it } from 'vitest'
import { createEntryRow, createEntryTagRow, createTagRow } from '../test-support'
import { buildTagStats } from './tag-stats'

describe('buildTagStats', () => {
  it('returns all tags with usage counts and sorts by usage weight', () => {
    const stats = buildTagStats(
      [
        createTagRow({ id: 1, name: 'ideas' }),
        createTagRow({ id: 2, name: 'work' }),
        createTagRow({ id: 3, name: 'travel' }),
      ],
      [
        createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 }),
        createEntryTagRow({ entry_id: 'entry-2', tag_id: 1 }),
        createEntryTagRow({ entry_id: 'entry-1', tag_id: 2 }),
      ],
      [
        createEntryRow({ id: 'entry-1', user_id: 'user-1' }),
        createEntryRow({ id: 'entry-2', user_id: 'user-1' }),
        createEntryRow({ id: 'entry-3', user_id: 'user-1', deleted_at: '2026-04-23T00:00:00.000Z' }),
      ],
      'user-1'
    )

    expect(stats).toEqual([
      { id: 1, name: 'ideas', usage_count: 2, weight: 2 },
      { id: 2, name: 'work', usage_count: 1, weight: 1 },
      { id: 3, name: 'travel', usage_count: 0, weight: 0 },
    ])
  })
})
