import { describe, expect, it } from 'vitest'
import { createEntryRow, createEntryAiTagCandidateRow, createUserRow, createMockEnv } from '../test-support'
import {
  acceptAiTagCandidate,
  discardAllAiTagCandidates,
  discardAiTagCandidate,
  loadEntryAiTagCandidateNames,
  recommendAiTagCandidatesForEntry,
} from './ai-tags'

describe('ai tag recommendations', () => {
  it('stores recommended tags as entry candidates', async () => {
    const entry = createEntryRow({
      id: 'entry-1',
      title: 'Planning notes',
      ai_summary: null,
      body_key: 'entries/entry-1.md',
      updated_at: '2026-04-22T08:00:00.000Z',
    })
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [entry],
        initialTags: [
          {
            id: 1,
            user_id: 'user-1',
            name: 'planning',
            created_at: '2026-04-22T00:00:00.000Z',
          },
        ],
        initialEntryTags: [
          {
            entry_id: 'entry-1',
            tag_id: 1,
            created_at: '2026-04-22T00:00:00.000Z',
          },
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-1.md',
            body: '# Planning notes\n\nWe planned a UI refresh and clarified the queue worker.',
          },
        ],
      },
      ai: {
        tags: ['planning', 'ui', 'queue'],
      },
    })

    const tagNames = await recommendAiTagCandidatesForEntry({
      env,
      entry,
      body: '# Planning notes\n\nWe planned a UI refresh and clarified the queue worker.',
    })

    expect(env.AI.state.calls).toHaveLength(1)
    const messages = env.AI.state.calls[0].inputs.messages as Array<{ role: string; content: string }>
    expect(messages[0].content).toContain('JSON のみ')
    expect(tagNames).toEqual(['ui', 'queue'])
    expect(await loadEntryAiTagCandidateNames(env.DB, 'entry-1')).toEqual(['ui', 'queue'])
  })

  it('accepts a candidate tag into canonical tags', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            ai_summary: null,
            body_key: 'entries/entry-1.md',
          }),
        ],
        initialEntryAiTagCandidates: [
          createEntryAiTagCandidateRow({
            entry_id: 'entry-1',
            tag_name: 'ideas',
          }),
        ],
      },
    })

    const accepted = await acceptAiTagCandidate({
      db: env.DB,
      userId: 'user-1',
      entryId: 'entry-1',
      tagName: 'ideas',
      timestamp: '2026-04-22T09:00:00.000Z',
    })

    expect(accepted).toBe(true)
    expect(env.DB.state.entryAiTagCandidates).toEqual([])
    expect(env.DB.state.tags).toEqual([
      expect.objectContaining({
        name: 'ideas',
        user_id: 'user-1',
      }),
    ])
    expect(env.DB.state.entryTags).toEqual([
      expect.objectContaining({
        entry_id: 'entry-1',
      }),
    ])
  })

  it('can discard one or all candidate tags', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            ai_summary: null,
            body_key: 'entries/entry-1.md',
          }),
        ],
        initialEntryAiTagCandidates: [
          createEntryAiTagCandidateRow({
            entry_id: 'entry-1',
            tag_name: 'ideas',
          }),
          createEntryAiTagCandidateRow({
            id: 2,
            entry_id: 'entry-1',
            tag_name: 'planning',
            created_at: '2026-04-22T01:00:00.000Z',
          }),
        ],
      },
    })

    const discarded = await discardAiTagCandidate({
      db: env.DB,
      entryId: 'entry-1',
      tagName: 'ideas',
    })
    expect(discarded).toBe(true)
    expect(env.DB.state.entryAiTagCandidates.map((candidate) => candidate.tag_name)).toEqual(['planning'])

    await discardAllAiTagCandidates({
      db: env.DB,
      entryId: 'entry-1',
    })

    expect(env.DB.state.entryAiTagCandidates).toEqual([])
  })
})
