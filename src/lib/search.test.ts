import { describe, expect, it } from 'vitest'
import { createEntryRow, createEntryTagRow, createTagRow } from '../test-support'
import { searchEntries } from './search'

describe('searchEntries', () => {
  it('matches title and approved summary but not ai summary', () => {
    const results = searchEntries({
      userId: 'user-1',
      query: 'insight',
      tag: '',
      entries: [
        createEntryRow({
          id: 'entry-1',
          title: 'Morning note',
          summary: 'Useful insight',
          ai_summary: null,
        }),
        createEntryRow({
          id: 'entry-2',
          title: 'Draft note',
          summary: 'No visible match',
          ai_summary: 'hidden ai insight',
        }),
      ],
      tags: [],
      entryTags: [],
    })

    expect(results.map((result) => result.entry.id)).toEqual(['entry-1'])
  })

  it('filters by normalized approved tag names', () => {
    const results = searchEntries({
      userId: 'user-1',
      query: '',
      tag: ' Work ',
      entries: [
        createEntryRow({ id: 'entry-1', title: 'Work log' }),
        createEntryRow({ id: 'entry-2', title: 'Personal note' }),
      ],
      tags: [
        createTagRow({ id: 1, name: 'work' }),
        createTagRow({ id: 2, name: 'personal' }),
      ],
      entryTags: [
        createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 }),
        createEntryTagRow({ entry_id: 'entry-2', tag_id: 2 }),
      ],
    })

    expect(results.map((result) => result.entry.id)).toEqual(['entry-1'])
    expect(results[0]?.tagNames).toEqual(['work'])
  })
})
