import { describe, expect, it } from 'vitest'
import { createEntryRow, createUserRow, createMockEnv } from '../test-support'
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
        summary: 'Short release summary',
      },
    })

    await processAiSummaryQueueMessage(env, {
      type: 'summarize_entry',
      entryId: 'entry-1',
      entryUpdatedAt: '2026-04-22T08:00:00.000Z',
      requestedAt: '2026-04-22T08:01:00.000Z',
    })

    expect(env.AI.state.calls).toHaveLength(1)
    expect(env.AI.state.calls[0]).toMatchObject({
      model: '@cf/facebook/bart-large-cnn',
      inputs: {
        max_length: 120,
      },
    })
    expect(String(env.AI.state.calls[0].inputs.input_text)).toContain('Entry title: Daily notes')
    expect(String(env.AI.state.calls[0].inputs.input_text)).not.toContain('Title: Daily notes')
    expect(String(env.AI.state.calls[0].inputs.input_text)).toContain('calendar search update')
    expect(env.DB.state.entries[0]).toMatchObject({
      ai_summary: 'Short release summary',
      ai_summary_model: '@cf/facebook/bart-large-cnn',
    })
    expect(env.DB.state.entries[0].ai_summary_generated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    )
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
