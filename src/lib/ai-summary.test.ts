import { describe, expect, it } from 'vitest'
import { createEntryRow, createUserRow, createMockEnv } from '../test-support'
import { loadEntryAiTagCandidateNames } from './ai-tags'
import { processAiSummaryQueueMessage } from './ai-summary'

describe('ai summary queue processing', () => {
  it('summarizes a matching entry and stores generation metadata', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            title: 'Daily notes',
            summary: 'Visible summary',
            ai_summary: null,
            ai_summary_model: null,
            ai_summary_generated_at: null,
            body_key: 'entries/entry-1.md',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-1.md',
            body: '# Daily notes\n\nWe shipped the calendar search update and cleaned up the editor.',
          },
        ],
      },
      ai: {
        summary: '以下は、日記本文の要約です。\n\nShort release summary',
      },
    })

    await processAiSummaryQueueMessage(env, {
      type: 'summarize_entry',
      entryId: 'entry-1',
      entryUpdatedAt: '2026-04-22T08:00:00.000Z',
      requestedAt: '2026-04-22T08:01:00.000Z',
    })

    expect(env.AI.state.calls).toHaveLength(2)
    expect(env.AI.state.calls[0]).toMatchObject({
      model: '@cf/meta/llama-3.2-3b-instruct',
      inputs: {
        max_tokens: 240,
        temperature: 0.2,
      },
    })
    expect(env.AI.state.calls[0].inputs).toMatchObject({
      messages: [
        {
          role: 'system',
          content: expect.stringContaining('本文と同じ言語'),
        },
        {
          role: 'user',
          content: expect.stringContaining('タイトル: Daily notes'),
        },
      ],
    })
    const messages = env.AI.state.calls[0].inputs.messages as Array<{ role: string; content: string }>
    expect(String(messages[1].content)).toContain('calendar search update')
    expect(String(messages[1].content)).not.toContain('```')
    expect(env.AI.state.calls[1]).toMatchObject({
      model: '@cf/meta/llama-3.2-3b-instruct',
      inputs: {
        max_tokens: 160,
        temperature: 0.2,
      },
    })
    expect(env.AI.state.calls[1].inputs).toMatchObject({
      messages: [
        {
          role: 'system',
          content: expect.stringContaining('JSON のみ'),
        },
        {
          role: 'user',
          content: expect.stringContaining('タイトル: Daily notes'),
        },
      ],
    })
    expect(env.DB.state.entries[0]).toMatchObject({
      ai_summary: 'Short release summary',
      ai_summary_model: '@cf/meta/llama-3.2-3b-instruct',
    })
    expect(env.DB.state.entries[0].ai_summary_generated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    )
  })

  it('continues to tag recommendations when summary generation fails', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            title: 'Daily notes',
            summary: 'Visible summary',
            ai_summary: null,
            ai_summary_model: null,
            ai_summary_generated_at: null,
            body_key: 'entries/entry-1.md',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-1.md',
            body: '# Daily notes\n\nWe shipped the calendar search update and cleaned up the editor.',
          },
        ],
      },
      ai: {
        summaryError: 'session expired',
        tags: ['planning'],
      },
    })

    await processAiSummaryQueueMessage(env, {
      type: 'summarize_entry',
      entryId: 'entry-1',
      entryUpdatedAt: '2026-04-22T08:00:00.000Z',
      requestedAt: '2026-04-22T08:01:00.000Z',
    })

    expect(env.AI.state.calls).toHaveLength(2)
    expect(env.DB.state.entries[0].ai_summary).toBeNull()
    expect(await loadEntryAiTagCandidateNames(env.DB, 'entry-1')).toEqual(['planning'])
  })

  it('skips entries whose body only contains fenced code blocks', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            title: 'Diagram notes',
            ai_summary: null,
            ai_summary_model: null,
            ai_summary_generated_at: null,
            body_key: 'entries/entry-1.md',
            updated_at: '2026-04-22T08:00:00.000Z',
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-1.md',
            body: '```mermaid\ngraph TD;\n    A --> B;\n```',
          },
        ],
      },
    })

    await processAiSummaryQueueMessage(env, {
      type: 'summarize_entry',
      entryId: 'entry-1',
      entryUpdatedAt: '2026-04-22T08:00:00.000Z',
      requestedAt: '2026-04-22T08:01:00.000Z',
    })

    expect(env.AI.state.calls).toHaveLength(0)
    expect(env.DB.state.entries[0].ai_summary).toBeNull()
    expect(env.DB.state.entries[0].ai_summary_model).toBeNull()
    expect(env.DB.state.entries[0].ai_summary_generated_at).toBeNull()
  })

  it('skips stale queue messages when the entry has changed since enqueue', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            title: 'Daily notes',
            ai_summary: null,
            ai_summary_model: null,
            ai_summary_generated_at: null,
            body_key: 'entries/entry-1.md',
            updated_at: '2026-04-22T09:00:00.000Z',
          }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-1.md',
            body: '# Daily notes\n\nStale message should be ignored.',
          },
        ],
      },
    })

    await processAiSummaryQueueMessage(env, {
      type: 'summarize_entry',
      entryId: 'entry-1',
      entryUpdatedAt: '2026-04-22T08:00:00.000Z',
      requestedAt: '2026-04-22T08:01:00.000Z',
    })

    expect(env.AI.state.calls).toHaveLength(0)
    expect(env.DB.state.entries[0].ai_summary).toBeNull()
    expect(env.DB.state.entries[0].ai_summary_model).toBeNull()
    expect(env.DB.state.entries[0].ai_summary_generated_at).toBeNull()
  })
})
