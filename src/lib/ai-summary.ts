import type { Bindings } from '../types/bindings'
import type { JournalEntryRow } from '../types/journal'
import { loadEntryBody } from './entry-body'

export type AiSummaryQueueMessage = {
  type: 'summarize_entry'
  entryId: string
  entryUpdatedAt: string
  requestedAt: string
}

const AI_SUMMARY_MODEL = '@cf/facebook/bart-large-cnn'
const MAX_INPUT_CHARS = 12_000

const buildSummaryInput = (entry: Pick<JournalEntryRow, 'title' | 'journal_date'>, body: string): string => {
  const parts: string[] = [
    'Summarize the journal entry in 1-2 short sentences.',
    'Return plain text only.',
    'Do not repeat labels like Title or Date.',
    'Focus on the main content.',
    '',
  ]
  const title = entry.title.trim()

  if (title.length > 0) {
    parts.push(`Entry title: ${title}`)
  }

  if (entry.journal_date.trim().length > 0) {
    parts.push(`Entry date: ${entry.journal_date}`)
  }

  parts.push('')
  parts.push('Entry body:')
  parts.push(body.trim())

  return parts.join('\n\n').slice(0, MAX_INPUT_CHARS)
}

const extractSummary = (result: unknown): string => {
  if (typeof result === 'string') {
    return result.trim()
  }

  if (result && typeof result === 'object' && 'summary' in result) {
    const summary = (result as { summary?: unknown }).summary
    if (typeof summary === 'string') {
      return summary.trim()
    }
  }

  if (result && typeof result === 'object' && 'response' in result) {
    const response = (result as { response?: unknown }).response
    if (typeof response === 'string') {
      return response.trim()
    }
  }

  return ''
}

export const createAiSummaryQueueMessage = (
  entryId: string,
  entryUpdatedAt: string,
  requestedAt: string = new Date().toISOString()
): AiSummaryQueueMessage => {
  return {
    type: 'summarize_entry',
    entryId,
    entryUpdatedAt,
    requestedAt,
  }
}

export const enqueueAiSummary = (queue: Queue, entryId: string, entryUpdatedAt: string, requestedAt?: string): void => {
  void queue.send(createAiSummaryQueueMessage(entryId, entryUpdatedAt, requestedAt)).catch((error: unknown) => {
    console.error('Failed to enqueue AI summary job', error)
  })
}

export const processAiSummaryQueueMessage = async (
  env: Pick<Bindings, 'AI' | 'DB' | 'JOURNAL_BUCKET'>,
  message: AiSummaryQueueMessage
): Promise<void> => {
  console.log('AI summary job started', {
    entryId: message.entryId,
    entryUpdatedAt: message.entryUpdatedAt,
    requestedAt: message.requestedAt,
  })

  const currentEntry = await env.DB.prepare('SELECT * FROM entries WHERE id = ? LIMIT 1')
    .bind(message.entryId)
    .first<JournalEntryRow>()

  if (!currentEntry || currentEntry.deleted_at != null) {
    console.log('AI summary job skipped: entry missing or deleted', {
      entryId: message.entryId,
    })
    return
  }

  if (currentEntry.updated_at !== message.entryUpdatedAt) {
    console.log('AI summary job skipped: entry changed since enqueue', {
      entryId: message.entryId,
      currentUpdatedAt: currentEntry.updated_at,
      queuedUpdatedAt: message.entryUpdatedAt,
    })
    return
  }

  const body = await loadEntryBody(env.JOURNAL_BUCKET, currentEntry.body_key)
  if (!body || body.trim().length === 0) {
    console.log('AI summary job skipped: entry body missing', {
      entryId: message.entryId,
    })
    return
  }

  console.log('AI summary job running model', {
    entryId: message.entryId,
    model: AI_SUMMARY_MODEL,
  })

  const generated = await env.AI.run(AI_SUMMARY_MODEL, {
    input_text: buildSummaryInput(currentEntry, body),
    max_length: 120,
  })
  const aiSummary = extractSummary(generated)

  if (aiSummary.length === 0) {
    console.log('AI summary job skipped: model returned empty summary', {
      entryId: message.entryId,
    })
    return
  }

  const generatedAt = new Date().toISOString()

  const updateStatement = env.DB.prepare(
    'UPDATE entries SET ai_summary = ?, ai_summary_model = ?, ai_summary_generated_at = ? WHERE id = ? AND updated_at = ?'
  )
    .bind(aiSummary, AI_SUMMARY_MODEL, generatedAt, currentEntry.id, message.entryUpdatedAt)

  await updateStatement.run()

  console.log('AI summary job stored summary', {
    entryId: message.entryId,
    generatedAt,
  })
}

export const handleAiSummaryQueueBatch = async (
  batch: MessageBatch<AiSummaryQueueMessage>,
  env: Pick<Bindings, 'AI' | 'DB' | 'JOURNAL_BUCKET'>,
  _ctx: ExecutionContext
): Promise<void> => {
  for (const message of batch.messages) {
    if (message.body.type !== 'summarize_entry') {
      continue
    }

    await processAiSummaryQueueMessage(env, message.body)
  }
}
