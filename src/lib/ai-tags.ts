import type { Bindings } from '../types/bindings'
import type { JournalEntryAiTagCandidateRow, JournalEntryRow } from '../types/journal'
import { AI_TAGS_SYSTEM_PROMPT } from './ai-prompts.generated'
import { loadEntryTagNames, replaceEntryTags } from './entry-tags'
import { normalizeTagName, parseTagList } from './tags'
import { stripFencedCodeBlocks } from './ai-text'

const AI_TAGS_MODEL = '@cf/meta/llama-3.2-3b-instruct'
const MAX_INPUT_CHARS = 12_000
const MAX_OUTPUT_TOKENS = 160
const MAX_SUGGESTED_TAGS = 5

const buildTagPromptPreview = (
  entry: Pick<JournalEntryRow, 'title' | 'journal_date'>,
  approvedTagNames: string[]
): string => {
  const parts: string[] = []
  const title = entry.title.trim()

  if (title.length > 0) {
    parts.push(`タイトル: ${title}`)
  }

  if (entry.journal_date.trim().length > 0) {
    parts.push(`日付: ${entry.journal_date}`)
  }

  if (approvedTagNames.length > 0) {
    parts.push(`既存の承認済みタグ: ${approvedTagNames.join(', ')}`)
  }

  return parts.join('\n\n')
}

const buildTagMessages = (
  entry: Pick<JournalEntryRow, 'title' | 'journal_date'>,
  body: string,
  approvedTagNames: string[]
): Array<{ role: 'system' | 'user'; content: string }> => {
  const preview = buildTagPromptPreview(entry, approvedTagNames)
  const bodyWithoutCodeBlocks = stripFencedCodeBlocks(body)
  const userContent = [preview, '本文:', bodyWithoutCodeBlocks]
    .filter((part) => part.length > 0)
    .join('\n\n')
    .slice(0, MAX_INPUT_CHARS)

  return [
    {
      role: 'system',
      content: AI_TAGS_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: userContent,
    },
  ]
}

const parseTagNamesFromText = (text: string): string[] => {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return []
  }

  const unwrapped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const attempts = [unwrapped, trimmed]

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as unknown
      if (Array.isArray(parsed)) {
        return parseTagList(parsed.map((item) => String(item)).join('\n'))
      }

      if (parsed && typeof parsed === 'object' && 'tags' in parsed) {
        const tags = (parsed as { tags?: unknown }).tags
        if (Array.isArray(tags)) {
          return parseTagList(tags.map((item) => String(item)).join('\n'))
        }
      }
    } catch {
      // fall through to plain-text parsing
    }
  }

  return parseTagList(unwrapped)
}

const extractTagNames = (result: unknown): string[] => {
  if (result && typeof result === 'object' && 'tags' in result) {
    const tags = (result as { tags?: unknown }).tags
    if (Array.isArray(tags)) {
      return parseTagList(tags.map((tag) => String(tag)).join('\n'))
    }
  }

  if (typeof result === 'string') {
    return parseTagNamesFromText(result)
  }

  if (result && typeof result === 'object' && 'response' in result) {
    const response = (result as { response?: unknown }).response
    if (typeof response === 'string') {
      return parseTagNamesFromText(response)
    }
  }

  return []
}

const dedupeTagNames = (tagNames: string[]): string[] => {
  const seen = new Set<string>()
  const nextTagNames: string[] = []

  for (const rawTagName of tagNames) {
    const normalizedTagName = normalizeTagName(rawTagName)
    if (!normalizedTagName || seen.has(normalizedTagName)) {
      continue
    }

    seen.add(normalizedTagName)
    nextTagNames.push(normalizedTagName)
  }

  return nextTagNames.slice(0, MAX_SUGGESTED_TAGS)
}

export const loadEntryAiTagCandidateNames = async (db: D1Database, entryId: string): Promise<string[]> => {
  const rows = await db
    .prepare('SELECT * FROM entry_ai_tag_candidates WHERE entry_id = ? ORDER BY id ASC')
    .bind(entryId)
    .all<JournalEntryAiTagCandidateRow>()
  return rows.results.map((candidate) => candidate.tag_name)
}

export const recommendAiTagCandidatesForEntry = async (options: {
  env: Pick<Bindings, 'AI' | 'DB'>
  entry: Pick<JournalEntryRow, 'id' | 'user_id' | 'title' | 'journal_date' | 'body_key' | 'updated_at'>
  body: string
}): Promise<string[]> => {
  const bodyWithoutCodeBlocks = stripFencedCodeBlocks(options.body)
  if (bodyWithoutCodeBlocks.length === 0) {
    console.log('AI tag job skipped: entry body only contains code blocks', {
      entryId: options.entry.id,
    })
    return []
  }

  const approvedTagNames = await loadEntryTagNames(options.env.DB, options.entry.user_id, options.entry.id)

  console.log('AI tag job running model', {
    entryId: options.entry.id,
    model: AI_TAGS_MODEL,
    systemPrompt: AI_TAGS_SYSTEM_PROMPT,
    prompt: buildTagPromptPreview(options.entry, approvedTagNames),
    bodyLength: options.body.length,
    bodyTrimmedLength: options.body.trim().length,
    bodyWithoutCodeBlocksLength: bodyWithoutCodeBlocks.length,
    inputLength: buildTagMessages(options.entry, options.body, approvedTagNames).at(1)?.content.length ?? 0,
  })

  const generated = await options.env.AI.run(AI_TAGS_MODEL, {
    messages: buildTagMessages(options.entry, options.body, approvedTagNames),
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.2,
  })

  console.log('AI tag job raw response', {
    entryId: options.entry.id,
    response: generated,
  })

  const nextTagNames = dedupeTagNames(extractTagNames(generated)).filter(
    (tagName) => !approvedTagNames.includes(tagName)
  )

  await options.env.DB.prepare('DELETE FROM entry_ai_tag_candidates WHERE entry_id = ?')
    .bind(options.entry.id)
    .run()

  if (nextTagNames.length === 0) {
    console.log('AI tag job skipped: model returned no tags', {
      entryId: options.entry.id,
    })
    return []
  }

  const generatedAt = new Date().toISOString()
  for (const tagName of nextTagNames) {
    await options.env.DB.prepare('INSERT INTO entry_ai_tag_candidates (entry_id, tag_name, created_at) VALUES (?, ?, ?)')
      .bind(options.entry.id, tagName, generatedAt)
      .run()
  }

  console.log('AI tag job stored candidates', {
    entryId: options.entry.id,
    generatedAt,
    count: nextTagNames.length,
  })

  return nextTagNames
}

export const acceptAiTagCandidate = async (options: {
  db: D1Database
  userId: string
  entryId: string
  tagName: string
  timestamp: string
}): Promise<boolean> => {
  const normalizedTagName = normalizeTagName(options.tagName)
  if (!normalizedTagName) {
    return false
  }

  const currentTags = await loadEntryTagNames(options.db, options.userId, options.entryId)
  const currentCandidates = await loadEntryAiTagCandidateNames(options.db, options.entryId)
  if (!currentCandidates.includes(normalizedTagName)) {
    return false
  }

  const nextTagText = [...currentTags, normalizedTagName].join(', ')

  await replaceEntryTags({
    db: options.db,
    userId: options.userId,
    entryId: options.entryId,
    tagText: nextTagText,
    timestamp: options.timestamp,
  })

  await options.db
    .prepare('DELETE FROM entry_ai_tag_candidates WHERE entry_id = ? AND tag_name = ?')
    .bind(options.entryId, normalizedTagName)
    .run()

  return true
}

export const discardAiTagCandidate = async (options: {
  db: D1Database
  entryId: string
  tagName: string
}): Promise<boolean> => {
  const normalizedTagName = normalizeTagName(options.tagName)
  if (!normalizedTagName) {
    return false
  }

  await options.db
    .prepare('DELETE FROM entry_ai_tag_candidates WHERE entry_id = ? AND tag_name = ?')
    .bind(options.entryId, normalizedTagName)
    .run()

  return true
}

export const discardAllAiTagCandidates = async (options: {
  db: D1Database
  entryId: string
}): Promise<void> => {
  await options.db.prepare('DELETE FROM entry_ai_tag_candidates WHERE entry_id = ?').bind(options.entryId).run()
}
