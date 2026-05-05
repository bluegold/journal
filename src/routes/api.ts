import { Hono } from 'hono'
import { buildEntryBodyKey } from '../lib/entry-body-key'
import { formatDateKey } from '../lib/entries-navigation'
import { createAiSummaryQueueMessage, enqueueAiSummary, processAiSummaryQueueMessage } from '../lib/ai-summary'
import {
  acceptAiTagCandidate,
  discardAiTagCandidate,
  discardAllAiTagCandidates,
  loadEntryAiTagCandidateNames,
} from '../lib/ai-tags'
import { loadEntryBody } from '../lib/entry-body'
import { loadEntryTagNames, replaceEntryTags } from '../lib/entry-tags'
import { searchEntries } from '../lib/search'
import { generateUuidv7 } from '../lib/uuidv7'
import type { Bindings } from '../types/bindings'
import type {
  JournalApiContextVariables,
  JournalEntryRow,
  JournalEntryTagRow,
  JournalTagRow,
} from '../types/journal'
import { normalizeBody, parseJournalDate } from './entries.shared'

const isLocalRequest = (url: string): boolean => {
  const host = new URL(url).hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

const getExecutionCtx = (c: { executionCtx?: ExecutionContext }): ExecutionContext | undefined => {
  try {
    return c.executionCtx
  } catch {
    return undefined
  }
}

type CreateEntryPayload = {
  journalDate?: string
  title?: string
  summary?: string
  body?: string
  tags?: string[] | string
}

type UpdateEntryPayload = {
  journalDate?: string
  title?: string
  summary?: string | null
  body?: string
  tags?: string[] | string
}

type ApiEntrySummary = {
  id: string
  journalDate: string
  title: string
  summary: string | null
  aiSummary: string | null
  tags: string[]
  status: string
  createdAt: string
  updatedAt: string
}

type ApiErrorCode =
  | 'invalid_json'
  | 'entry_not_found'
  | 'ai_summary_unavailable'
  | 'ai_tag_candidate_not_found'

const normalizeTagsInput = (value: CreateEntryPayload['tags']): string => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return typeof value === 'string' ? value : ''
}

const parseCreateEntryPayload = async (request: Request): Promise<CreateEntryPayload | null> => {
  try {
    return (await request.json()) as CreateEntryPayload
  } catch {
    return null
  }
}

const parseUpdateEntryPayload = async (request: Request): Promise<UpdateEntryPayload | null> => {
  try {
    return (await request.json()) as UpdateEntryPayload
  } catch {
    return null
  }
}

const loadApiEntryRows = async (db: D1Database, userId: string): Promise<JournalEntryRow[]> => {
  const rows = await db
    .prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC')
    .bind(userId)
    .all<JournalEntryRow>()

  return rows.results
}

const findApiEntryById = (entries: JournalEntryRow[], entryId: string): JournalEntryRow | null => {
  return entries.find((entry) => entry.id === entryId && entry.deleted_at == null) ?? null
}

const loadApiSearchRows = async (
  db: D1Database
): Promise<{ tags: JournalTagRow[]; entryTags: JournalEntryTagRow[] }> => {
  const [tagRows, entryTagRows] = await Promise.all([
    db.prepare('SELECT * FROM tags').all<JournalTagRow>(),
    db.prepare('SELECT * FROM entry_tags').all<JournalEntryTagRow>(),
  ])

  return {
    tags: tagRows.results,
    entryTags: entryTagRows.results,
  }
}

const buildApiEntrySummary = async (
  db: D1Database,
  userId: string,
  entry: JournalEntryRow
): Promise<ApiEntrySummary> => {
  return {
    id: entry.id,
    journalDate: entry.journal_date,
    title: entry.title,
    summary: entry.summary,
    aiSummary: entry.ai_summary,
    tags: await loadEntryTagNames(db, userId, entry.id),
    status: entry.status,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }
}

const apiError = (code: ApiErrorCode, message: string) => ({
  error: {
    code,
    message,
  },
})

export const apiRoutes = new Hono<{ Bindings: Bindings; Variables: JournalApiContextVariables }>()

apiRoutes.get('/ping', (c) => {
  return c.json({
    ok: true,
    user: {
      id: c.var.currentUser.id,
      email: c.var.currentUser.email,
      name: c.var.currentUser.name,
    },
    token: {
      id: c.var.currentApiToken.id,
      name: c.var.currentApiToken.name,
    },
  })
})

apiRoutes.get('/entries', async (c) => {
  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const { tags, entryTags } = await loadApiSearchRows(c.env.DB)
  const results = searchEntries({
    entries,
    tags,
    entryTags,
    userId: c.var.currentUser.id,
    query: c.req.query('q') ?? '',
    tag: c.req.query('tag') ?? '',
    month: c.req.query('month'),
    date: c.req.query('date'),
  })

  const items = await Promise.all(results.map((result) => buildApiEntrySummary(c.env.DB, c.var.currentUser.id, result.entry)))
  return c.json({ items })
})

apiRoutes.get('/entries/:id', async (c) => {
  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const entry = findApiEntryById(entries, c.req.param('id'))

  if (!entry) {
    return c.json(apiError('entry_not_found', 'Entry not found.'), 404)
  }

  const [body, tags, aiTagCandidates] = await Promise.all([
    loadEntryBody(c.env.JOURNAL_BUCKET, entry.body_key),
    loadEntryTagNames(c.env.DB, c.var.currentUser.id, entry.id),
    loadEntryAiTagCandidateNames(c.env.DB, entry.id),
  ])

  return c.json({
    id: entry.id,
    journalDate: entry.journal_date,
    title: entry.title,
    summary: entry.summary,
    aiSummary: entry.ai_summary,
    aiSummaryModel: entry.ai_summary_model,
    aiSummaryGeneratedAt: entry.ai_summary_generated_at,
    tags,
    aiTagCandidates,
    body: body ?? '',
    status: entry.status,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  })
})

apiRoutes.post('/entries', async (c) => {
  const payload = await parseCreateEntryPayload(c.req.raw)
  if (!payload) {
    return c.json(apiError('invalid_json', 'A valid JSON body is required.'), 400)
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const summaryValue = typeof payload.summary === 'string' ? payload.summary.trim() : ''
  const bodyValue = typeof payload.body === 'string' ? payload.body : ''
  const tagsValue = normalizeTagsInput(payload.tags)
  const journalDate = parseJournalDate(payload.journalDate)
  const body = normalizeBody(title, bodyValue)
  const entryId = generateUuidv7()
  const bodyKey = buildEntryBodyKey(journalDate, entryId)
  const journalDateKey = formatDateKey(journalDate)
  const timestamp = new Date().toISOString()

  await c.env.JOURNAL_BUCKET.put(bodyKey, body, {
    httpMetadata: {
      contentType: 'text/markdown; charset=utf-8',
    },
  })

  try {
    await c.env.DB.prepare(
      'INSERT INTO entries (id, user_id, journal_date, title, summary, ai_summary, body_key, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
        .bind(
          entryId,
          c.var.currentUser.id,
          journalDateKey,
          title,
        summaryValue.length > 0 ? summaryValue : null,
        null,
        bodyKey,
        'private',
        timestamp,
        timestamp,
        null
      )
      .run()
  } catch (error) {
    await c.env.JOURNAL_BUCKET.delete(bodyKey)
    throw error
  }

  try {
    const normalizedTags = await replaceEntryTags({
      db: c.env.DB,
      userId: c.var.currentUser.id,
      entryId,
      tagText: tagsValue,
      timestamp,
    })

    const executionCtx = getExecutionCtx(c)
    if (executionCtx && isLocalRequest(c.req.url)) {
      executionCtx.waitUntil(
        processAiSummaryQueueMessage(c.env, createAiSummaryQueueMessage(entryId, timestamp, timestamp))
      )
    } else {
      await enqueueAiSummary(c.env.AI_QUEUE, entryId, timestamp, timestamp)
    }

    return c.json(
      {
        id: entryId,
        journalDate: journalDateKey,
        title,
        summary: summaryValue.length > 0 ? summaryValue : null,
        tags: [...normalizedTags].sort((a, b) => a.localeCompare(b)),
        bodyKey,
        status: 'private',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      201
    )
  } catch (error) {
    await c.env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(entryId).run()
    await c.env.JOURNAL_BUCKET.delete(bodyKey)
    throw error
  }
})

apiRoutes.patch('/entries/:id', async (c) => {
  const payload = await parseUpdateEntryPayload(c.req.raw)
  if (!payload) {
    return c.json(apiError('invalid_json', 'A valid JSON body is required.'), 400)
  }

  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const currentEntry = findApiEntryById(entries, c.req.param('id'))
  if (!currentEntry) {
    return c.json(apiError('entry_not_found', 'Entry not found.'), 404)
  }

  const nextJournalDate = parseJournalDate(payload.journalDate ?? currentEntry.journal_date)
  const nextJournalDateKey = formatDateKey(nextJournalDate)
  const previousBodyKey = currentEntry.body_key
  const nextTitle = typeof payload.title === 'string' ? payload.title.trim() : currentEntry.title
  const nextSummary =
    payload.summary === null
      ? ''
      : typeof payload.summary === 'string'
        ? payload.summary.trim()
        : (currentEntry.summary ?? '')
  const nextTagsValue = payload.tags !== undefined
    ? normalizeTagsInput(payload.tags)
    : (await loadEntryTagNames(c.env.DB, c.var.currentUser.id, currentEntry.id)).join(', ')
  const nextBody = normalizeBody(
    nextTitle,
    typeof payload.body === 'string'
      ? payload.body
      : ((await loadEntryBody(c.env.JOURNAL_BUCKET, previousBodyKey)) ?? '')
  )
  const nextBodyKey = buildEntryBodyKey(nextJournalDate, currentEntry.id)
  const timestamp = new Date().toISOString()
  const previousBody = (await loadEntryBody(c.env.JOURNAL_BUCKET, previousBodyKey)) ?? nextBody

  await c.env.JOURNAL_BUCKET.put(nextBodyKey, nextBody, {
    httpMetadata: {
      contentType: 'text/markdown; charset=utf-8',
    },
  })

  try {
    await c.env.DB.prepare(
      'UPDATE entries SET journal_date = ?, title = ?, summary = ?, body_key = ?, updated_at = ? WHERE id = ?'
    )
      .bind(
        nextJournalDateKey,
        nextTitle,
        nextSummary.length > 0 ? nextSummary : null,
        nextBodyKey,
        timestamp,
        currentEntry.id
      )
      .run()
  } catch (error) {
    await c.env.JOURNAL_BUCKET.delete(nextBodyKey)
    if (nextBodyKey === previousBodyKey) {
      await c.env.JOURNAL_BUCKET.put(previousBodyKey, previousBody, {
        httpMetadata: {
          contentType: 'text/markdown; charset=utf-8',
        },
      })
    }
    throw error
  }

  try {
    const normalizedTags = await replaceEntryTags({
      db: c.env.DB,
      userId: c.var.currentUser.id,
      entryId: currentEntry.id,
      tagText: nextTagsValue,
      timestamp,
    })

    const executionCtx = getExecutionCtx(c)
    if (executionCtx && isLocalRequest(c.req.url)) {
      executionCtx.waitUntil(
        processAiSummaryQueueMessage(c.env, createAiSummaryQueueMessage(currentEntry.id, timestamp, timestamp))
      )
    } else {
      await enqueueAiSummary(c.env.AI_QUEUE, currentEntry.id, timestamp, timestamp)
    }

    if (nextBodyKey !== previousBodyKey) {
      await c.env.JOURNAL_BUCKET.delete(previousBodyKey)
    }

    return c.json({
      id: currentEntry.id,
      journalDate: nextJournalDateKey,
      title: nextTitle,
      summary: nextSummary.length > 0 ? nextSummary : null,
      tags: [...normalizedTags].sort((a, b) => a.localeCompare(b)),
      bodyKey: nextBodyKey,
      status: currentEntry.status,
      createdAt: currentEntry.created_at,
      updatedAt: timestamp,
    })
  } catch (error) {
    await c.env.DB.prepare(
      'UPDATE entries SET journal_date = ?, title = ?, summary = ?, body_key = ?, updated_at = ? WHERE id = ?'
    )
      .bind(
        currentEntry.journal_date,
        currentEntry.title,
        currentEntry.summary,
        currentEntry.body_key,
        currentEntry.updated_at,
        currentEntry.id
      )
      .run()

    await c.env.JOURNAL_BUCKET.delete(nextBodyKey)
    await c.env.JOURNAL_BUCKET.put(previousBodyKey, previousBody, {
      httpMetadata: {
        contentType: 'text/markdown; charset=utf-8',
      },
    })
    throw error
  }
})

apiRoutes.post('/entries/:id/accept-ai-summary', async (c) => {
  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const entry = findApiEntryById(entries, c.req.param('id'))

  if (!entry) {
    return c.json(apiError('entry_not_found', 'Entry not found.'), 404)
  }

  const aiSummary = entry.ai_summary?.trim() ?? ''
  if (aiSummary.length === 0) {
    return c.json(apiError('ai_summary_unavailable', 'AI summary is not available yet.'), 400)
  }

  const timestamp = new Date().toISOString()
  await c.env.DB.prepare('UPDATE entries SET summary = ?, updated_at = ? WHERE id = ?')
    .bind(aiSummary, timestamp, entry.id)
    .run()

  return c.json({
    id: entry.id,
    summary: aiSummary,
    updatedAt: timestamp,
  })
})

apiRoutes.post('/entries/:id/ai-tags/:tagName/accept', async (c) => {
  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const entry = findApiEntryById(entries, c.req.param('id'))

  if (!entry) {
    return c.json(apiError('entry_not_found', 'Entry not found.'), 404)
  }

  const timestamp = new Date().toISOString()
  const accepted = await acceptAiTagCandidate({
    db: c.env.DB,
    userId: c.var.currentUser.id,
    entryId: entry.id,
    tagName: c.req.param('tagName'),
    timestamp,
  })

  if (!accepted) {
    return c.json(apiError('ai_tag_candidate_not_found', 'AI tag candidate not found.'), 404)
  }

  return c.json({
    id: entry.id,
    tags: await loadEntryTagNames(c.env.DB, c.var.currentUser.id, entry.id),
    aiTagCandidates: await loadEntryAiTagCandidateNames(c.env.DB, entry.id),
  })
})

apiRoutes.post('/entries/:id/ai-tags/:tagName/discard', async (c) => {
  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const entry = findApiEntryById(entries, c.req.param('id'))

  if (!entry) {
    return c.json(apiError('entry_not_found', 'Entry not found.'), 404)
  }

  const discarded = await discardAiTagCandidate({
    db: c.env.DB,
    entryId: entry.id,
    tagName: c.req.param('tagName'),
  })

  if (!discarded) {
    return c.json(apiError('ai_tag_candidate_not_found', 'AI tag candidate not found.'), 404)
  }

  return c.json({
    id: entry.id,
    aiTagCandidates: await loadEntryAiTagCandidateNames(c.env.DB, entry.id),
  })
})

apiRoutes.post('/entries/:id/ai-tags/discard-all', async (c) => {
  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const entry = findApiEntryById(entries, c.req.param('id'))

  if (!entry) {
    return c.json(apiError('entry_not_found', 'Entry not found.'), 404)
  }

  await discardAllAiTagCandidates({
    db: c.env.DB,
    entryId: entry.id,
  })

  return c.json({
    id: entry.id,
    aiTagCandidates: [],
  })
})

apiRoutes.delete('/entries/:id', async (c) => {
  const entries = await loadApiEntryRows(c.env.DB, c.var.currentUser.id)
  const entry = findApiEntryById(entries, c.req.param('id'))

  if (!entry) {
    return c.json(apiError('entry_not_found', 'Entry not found.'), 404)
  }

  const timestamp = new Date().toISOString()
  await c.env.DB.prepare('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ?')
    .bind(timestamp, timestamp, entry.id)
    .run()

  return c.json({
    id: entry.id,
    deletedAt: timestamp,
    updatedAt: timestamp,
  })
})
