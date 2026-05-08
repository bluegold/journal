import { describe, expect, it } from 'vitest'
import { createEntryRow, createEntryTagRow, createMockD1, createTagRow } from '../test-support'
import { loadSearchEntryMatches } from './search'

describe('loadSearchEntryMatches', () => {
  it('matches title and approved summary but not ai summary', async () => {
    const db = createMockD1({
      initialEntries: [
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
    })

    const results = await loadSearchEntryMatches(db, 'user-1', {
      query: 'insight',
    })

    expect(results.map((result) => result.entry.id)).toEqual(['entry-1'])
  })

  it('filters by approved tag names', async () => {
    const db = createMockD1({
      initialEntries: [
        createEntryRow({ id: 'entry-1', title: 'Work log' }),
        createEntryRow({ id: 'entry-2', title: 'Personal note', journal_date: '2026-04-21', body_key: 'entries/entry-2.md' }),
      ],
      initialTags: [
        createTagRow({ id: 1, name: 'work' }),
        createTagRow({ id: 2, name: 'personal' }),
      ],
      initialEntryTags: [
        createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 }),
        createEntryTagRow({ entry_id: 'entry-2', tag_id: 2 }),
      ],
    })

    const results = await loadSearchEntryMatches(db, 'user-1', {
      query: '',
      tag: ' Work ',
    })

    expect(results.map((result) => result.entry.id)).toEqual(['entry-1'])
    expect(results[0]?.tagNames).toEqual(['work'])
  })
})
