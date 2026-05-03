import type { Hono } from 'hono'
import { buildEntriesHref, formatDateKey, formatMonthKey } from '../lib/entries-navigation'
import { buildEntryBodyKey } from '../lib/entry-body-key'
import { loadEntryBody } from '../lib/entry-body'
import { replaceEntryTags } from '../lib/entry-tags'
import { createAiSummaryQueueMessage, enqueueAiSummary, processAiSummaryQueueMessage } from '../lib/ai-summary'
import {
  acceptAiTagCandidate,
  discardAiTagCandidate,
  discardAllAiTagCandidates,
} from '../lib/ai-tags'
import { renderMarkdown } from '../lib/render-markdown'
import { EntryPreviewOverlay, EntryPreviewSlot } from '../templates/entry-preview-panel'
import { findEntryById, loadUserEntries, normalizeBody, parseJournalDate } from './entries.shared'
import { generateUuidv7 } from '../lib/uuidv7'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'

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

export const registerEntriesWriteRoutes = (app: Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>) => {
  app.post('/entries', async (c) => {
    const form = await c.req.parseBody()
    const journalDate = parseJournalDate(typeof form.journal_date === 'string' ? form.journal_date : c.req.query('date'))
    const title = typeof form.title === 'string' ? form.title.trim() : ''
    const summaryValue = typeof form.summary === 'string' ? form.summary.trim() : ''
    const tagsValue = typeof form.tags === 'string' ? form.tags : ''
    const bodyValue = typeof form.body === 'string' ? form.body : ''
    const body = normalizeBody(title, bodyValue)
    const entryId = generateUuidv7()
    const bodyKey = buildEntryBodyKey(journalDate, entryId)
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
          formatDateKey(journalDate),
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
      await replaceEntryTags({
        db: c.env.DB,
        userId: c.var.currentUser.id,
        entryId,
        tagText: tagsValue,
        timestamp,
      })
    } catch (error) {
      await c.env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(entryId).run()
      await c.env.JOURNAL_BUCKET.delete(bodyKey)
      throw error
    }

    const executionCtx = getExecutionCtx(c)

    if (executionCtx && isLocalRequest(c.req.url)) {
      executionCtx.waitUntil(
        processAiSummaryQueueMessage(c.env, createAiSummaryQueueMessage(entryId, timestamp, timestamp))
      )
    } else {
      await enqueueAiSummary(c.env.AI_QUEUE, entryId, timestamp, timestamp)
    }

    const href = buildEntriesHref({
      monthKey: formatMonthKey(journalDate),
      dateKey: formatDateKey(journalDate),
      entryId,
    })
    const response = c.redirect(href, 303)
    response.headers.set('HX-Redirect', href)
    return response
  })

  app.post('/entries/preview', async (c) => {
    const form = await c.req.parseBody()
    const title = typeof form.title === 'string' ? form.title.trim() : ''
    const body = normalizeBody(title, typeof form.body === 'string' ? form.body : '')
    const renderedBodyHtml = await renderMarkdown(body)

    return c.html(<EntryPreviewOverlay renderedBodyHtml={renderedBodyHtml} />)
  })

  app.get('/entries/preview/close', async (c) => {
    return c.html(<EntryPreviewSlot />)
  })

  app.post('/entries/:id', async (c) => {
    const entryId = c.req.param('id')
    const entries = await loadUserEntries(c)
    const currentEntry = findEntryById(entries, entryId)

    if (!currentEntry) {
      return c.text('Entry not found.', 404)
    }

    const form = await c.req.parseBody()
    const nextJournalDate = parseJournalDate(
      typeof form.journal_date === 'string' ? form.journal_date : currentEntry.journal_date
    )
    const previousBodyKey = currentEntry.body_key
    const nextTitle = typeof form.title === 'string' ? form.title.trim() : currentEntry.title
    const nextSummary = typeof form.summary === 'string' ? form.summary.trim() : currentEntry.summary ?? ''
    const tagsValue = typeof form.tags === 'string' ? form.tags : ''
    const nextBody = normalizeBody(nextTitle, typeof form.body === 'string' ? form.body : '')
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
          formatDateKey(nextJournalDate),
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
      await replaceEntryTags({
        db: c.env.DB,
        userId: c.var.currentUser.id,
        entryId: currentEntry.id,
        tagText: tagsValue,
        timestamp,
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
      if (nextBodyKey === previousBodyKey) {
        await c.env.JOURNAL_BUCKET.put(previousBodyKey, previousBody, {
          httpMetadata: {
            contentType: 'text/markdown; charset=utf-8',
          },
        })
      } else {
        await c.env.JOURNAL_BUCKET.put(previousBodyKey, previousBody, {
          httpMetadata: {
            contentType: 'text/markdown; charset=utf-8',
          },
        })
      }
      throw error
    }

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

    const href = buildEntriesHref({
      monthKey: formatMonthKey(nextJournalDate),
      dateKey: formatDateKey(nextJournalDate),
      entryId: currentEntry.id,
    })
    const response = c.redirect(href, 303)
    response.headers.set('HX-Redirect', href)
    return response
  })

  app.post('/entries/:id/accept-ai-summary', async (c) => {
    const entryId = c.req.param('id')
    const entries = await loadUserEntries(c)
    const currentEntry = findEntryById(entries, entryId)

    if (!currentEntry) {
      return c.text('Entry not found.', 404)
    }

    const aiSummary = currentEntry.ai_summary?.trim() ?? ''
    if (aiSummary.length === 0) {
      return c.text('AI summary is not available yet.', 400)
    }

    const timestamp = new Date().toISOString()

    await c.env.DB.prepare('UPDATE entries SET summary = ?, updated_at = ? WHERE id = ?')
      .bind(aiSummary, timestamp, currentEntry.id)
      .run()

    const href = buildEntriesHref({
      monthKey: formatMonthKey(parseJournalDate(currentEntry.journal_date)),
      dateKey: currentEntry.journal_date,
      entryId: currentEntry.id,
    })
    const response = c.redirect(href, 303)
    response.headers.set('HX-Redirect', href)
    return response
  })

  app.post('/entries/:id/ai-tags/:tagName/accept', async (c) => {
    const entryId = c.req.param('id')
    const tagName = c.req.param('tagName')
    const entries = await loadUserEntries(c)
    const currentEntry = findEntryById(entries, entryId)

    if (!currentEntry) {
      return c.text('Entry not found.', 404)
    }

    const timestamp = new Date().toISOString()
    const accepted = await acceptAiTagCandidate({
      db: c.env.DB,
      userId: c.var.currentUser.id,
      entryId: currentEntry.id,
      tagName,
      timestamp,
    })

    if (!accepted) {
      return c.text('AI tag candidate not found.', 404)
    }

    const href = `/entries/${currentEntry.id}/edit`
    const response = c.redirect(href, 303)
    response.headers.set('HX-Redirect', href)
    return response
  })

  app.post('/entries/:id/ai-tags/:tagName/discard', async (c) => {
    const entryId = c.req.param('id')
    const tagName = c.req.param('tagName')
    const entries = await loadUserEntries(c)
    const currentEntry = findEntryById(entries, entryId)

    if (!currentEntry) {
      return c.text('Entry not found.', 404)
    }

    const discarded = await discardAiTagCandidate({
      db: c.env.DB,
      entryId: currentEntry.id,
      tagName,
    })

    if (!discarded) {
      return c.text('AI tag candidate not found.', 404)
    }

    const href = `/entries/${currentEntry.id}/edit`
    const response = c.redirect(href, 303)
    response.headers.set('HX-Redirect', href)
    return response
  })

  app.post('/entries/:id/ai-tags/discard-all', async (c) => {
    const entryId = c.req.param('id')
    const entries = await loadUserEntries(c)
    const currentEntry = findEntryById(entries, entryId)

    if (!currentEntry) {
      return c.text('Entry not found.', 404)
    }

    await discardAllAiTagCandidates({
      db: c.env.DB,
      entryId: currentEntry.id,
    })

    const href = `/entries/${currentEntry.id}/edit`
    const response = c.redirect(href, 303)
    response.headers.set('HX-Redirect', href)
    return response
  })

  app.post('/entries/:id/delete', async (c) => {
    const entryId = c.req.param('id')
    const entries = await loadUserEntries(c)
    const currentEntry = findEntryById(entries, entryId)

    if (!currentEntry) {
      return c.text('Entry not found.', 404)
    }

    const timestamp = new Date().toISOString()

    await c.env.DB.prepare('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ?')
      .bind(timestamp, timestamp, currentEntry.id)
      .run()

    const href = buildEntriesHref({
      monthKey: formatMonthKey(parseJournalDate(currentEntry.journal_date)),
      dateKey: currentEntry.journal_date,
    })
    const response = c.redirect(href, 303)
    response.headers.set('HX-Redirect', href)
    return response
  })
}
