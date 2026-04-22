import { describe, expect, it } from 'vitest'
import {
  createEntryAiTagCandidateRow,
  createEntryRow,
  createEntryTagRow,
  createTagRow,
} from './fixtures'

describe('test fixtures', () => {
  it('builds journal row fixtures with stable defaults and overrides', () => {
    expect(createEntryRow()).toEqual({
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

    expect(createTagRow({ id: 7, name: 'cloudflare' })).toEqual({
      id: 7,
      name: 'cloudflare',
      created_at: '2026-04-22T00:00:00.000Z',
    })

    expect(createEntryTagRow({ entry_id: 'entry-9', tag_id: 5 })).toEqual({
      entry_id: 'entry-9',
      tag_id: 5,
      created_at: '2026-04-22T00:00:00.000Z',
    })

    expect(createEntryAiTagCandidateRow({ id: 8, tag_name: 'planning' })).toEqual({
      id: 8,
      entry_id: 'entry-1',
      tag_name: 'planning',
      created_at: '2026-04-22T00:00:00.000Z',
    })
  })
})
