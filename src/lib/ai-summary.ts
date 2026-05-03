import type { Bindings } from '../types/bindings'
import type { JournalEntryRow } from '../types/journal'
import { loadEntryBody } from './entry-body'
import { AI_SUMMARY_SYSTEM_PROMPT } from './ai-prompts.generated'
import { stripFencedCodeBlocks } from './ai-text'
import { recommendAiTagCandidatesForEntry } from './ai-tags'

export type AiSummaryQueueMessage = {
  type: 'summarize_entry'
  entryId: string
  entryUpdatedAt: string
  requestedAt: string
}

const AI_SUMMARY_MODEL = '@cf/meta/llama-3.2-3b-instruct'
const MAX_INPUT_CHARS = 12_000
const MAX_OUTPUT_TOKENS = 240

const buildSummaryPromptPreview = (entry: Pick<JournalEntryRow, 'title' | 'journal_date'>): string => {
  const parts: string[] = []
  const title = entry.title.trim()

  if (title.length > 0) {
    parts.push(`タイトル: ${title}`)
  }

  if (entry.journal_date.trim().length > 0) {
    parts.push(`日付: ${entry.journal_date}`)
  }

  return parts.join('\n\n')
}

const buildSummaryMessages = (
  entry: Pick<JournalEntryRow, 'title' | 'journal_date'>,
  body: string
): Array<{ role: 'system' | 'user'; content: string }> => {
  const preview = buildSummaryPromptPreview(entry)
  const bodyWithoutCodeBlocks = stripFencedCodeBlocks(body)
  const userContent = [preview, '本文:', bodyWithoutCodeBlocks]
    .filter((part) => part.length > 0)
    .join('\n\n')
    .slice(0, MAX_INPUT_CHARS)

  return [
    {
      role: 'system',
      content: AI_SUMMARY_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: userContent,
    },
  ]
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

const normalizeSummary = (summary: string): string => {
  return summary
    .replace(/^(以下は.{0,40}?要約(?:です|になります)?[。:：\s]*)+/u, '')
    .replace(/^(Here is(?: a)? summary(?: of the journal entry)?[。:：\s]*)+/iu, '')
    .replace(/^(The following is(?: a)? summary(?: of the journal entry)?[。:：\s]*)+/iu, '')
    .trim()
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

export const enqueueAiSummary = async (
  queue: Queue,
  entryId: string,
  entryUpdatedAt: string,
  requestedAt?: string
): Promise<void> => {
  await queue.send(createAiSummaryQueueMessage(entryId, entryUpdatedAt, requestedAt)).catch((error: unknown) => {
    console.error('Failed to enqueue AI summary job', error)
    throw error
  })
}

export const processAiSummaryQueueMessage = async (
  env: Pick<Bindings, 'AI' | 'DB' | 'JOURNAL_BUCKET'>,
  message: AiSummaryQueueMessage
): Promise<void> => {
  console.log('AI entry enrichment job started', {
    entryId: message.entryId,
    entryUpdatedAt: message.entryUpdatedAt,
    requestedAt: message.requestedAt,
  })

  const currentEntry = await env.DB.prepare('SELECT * FROM entries WHERE id = ? LIMIT 1')
    .bind(message.entryId)
    .first<JournalEntryRow>()

  if (!currentEntry || currentEntry.deleted_at != null) {
    console.log('AI entry enrichment job skipped: entry missing or deleted', {
      entryId: message.entryId,
    })
    return
  }

  if (currentEntry.updated_at !== message.entryUpdatedAt) {
    console.log('AI entry enrichment job skipped: entry changed since enqueue', {
      entryId: message.entryId,
      currentUpdatedAt: currentEntry.updated_at,
      queuedUpdatedAt: message.entryUpdatedAt,
    })
    return
  }

  const body = await loadEntryBody(env.JOURNAL_BUCKET, currentEntry.body_key)
  if (!body || body.trim().length === 0) {
    console.log('AI entry enrichment job skipped: entry body missing', {
      entryId: message.entryId,
    })
    return
  }

  const bodyWithoutCodeBlocks = stripFencedCodeBlocks(body)
  if (bodyWithoutCodeBlocks.length === 0) {
    console.log('AI entry enrichment job skipped: entry body only contains code blocks', {
      entryId: message.entryId,
    })
    return
  }

  console.log('AI summary job running model', {
    entryId: message.entryId,
    model: AI_SUMMARY_MODEL,
    systemPrompt: AI_SUMMARY_SYSTEM_PROMPT,
    prompt: buildSummaryPromptPreview(currentEntry),
    bodyLength: body.length,
    bodyTrimmedLength: body.trim().length,
    bodyWithoutCodeBlocksLength: bodyWithoutCodeBlocks.length,
    inputLength: buildSummaryMessages(currentEntry, body).at(1)?.content.length ?? 0,
  })

  try {
    const generated = await env.AI.run(AI_SUMMARY_MODEL, {
      messages: buildSummaryMessages(currentEntry, body),
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
    })
    console.log('AI summary job raw response', {
      entryId: message.entryId,
      response: generated,
    })
    const aiSummary = normalizeSummary(extractSummary(generated))

    if (aiSummary.length === 0) {
      console.log('AI summary job skipped: model returned empty summary', {
        entryId: message.entryId,
      })
    } else {
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
  } catch (error) {
    console.error('AI summary job failed', {
      entryId: message.entryId,
      error,
    })
  }

  try {
    await recommendAiTagCandidatesForEntry({
      env,
      entry: currentEntry,
      body,
    })
  } catch (error) {
    console.error('AI tag job failed', {
      entryId: message.entryId,
      error,
    })
  }
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
