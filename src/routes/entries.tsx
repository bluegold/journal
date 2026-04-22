import { Hono } from 'hono'
import { generateUuidv7 } from '../lib/uuidv7'
import { isHtmxRequest } from '../lib/htmx'
import {
  buildEntriesHref,
  formatDateKey,
  formatMonthKey,
  parseDateKey,
} from '../lib/entries-navigation'
import { buildEntryBodyKey } from '../lib/entry-body-key'
import { loadEntryBody } from '../lib/entry-body'
import { resolveEntriesSelection } from '../lib/entries-selection'
import { EntriesPage } from '../templates/pages/entries-page'
import { NewEntryPage } from '../templates/pages/new-entry-page'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'
import type { JournalEntryRow } from '../types/journal'

export const entriesRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

const parseJournalDate = (value: string | null | undefined): Date => {
  return parseDateKey(value) ?? new Date()
}

const normalizeBody = (title: string, body: string): string => {
  if (body.trim().length > 0) {
    return body
  }

  const fallbackTitle = title.trim().length > 0 ? title.trim() : 'Untitled'
  return `# ${fallbackTitle}\n`
}

entriesRoutes.get('/entries', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC'
  )
    .bind(c.var.currentUser.id)
    .all<JournalEntryRow>()
  const selection = resolveEntriesSelection(rows.results, {
    month: c.req.query('month'),
    date: c.req.query('date'),
    entry: c.req.query('entry'),
  })
  const selectedEntryBody = selection.selectedEntry
    ? await loadEntryBody(c.env.JOURNAL_BUCKET, selection.selectedEntry.body_key)
    : null
  const page = (
    <EntriesPage
      currentUser={c.var.currentUser}
      entries={rows.results}
      selectedEntryBody={selectedEntryBody}
      query={{
        month: c.req.query('month'),
        date: c.req.query('date'),
        entry: c.req.query('entry'),
      }}
    />
  )

  if (isHtmxRequest(c.req.raw)) {
    return c.html(page)
  }

  return c.render(page)
})

entriesRoutes.get('/entries/new', async (c) => {
  const page = (
    <NewEntryPage
      currentUser={c.var.currentUser}
      query={{
        month: c.req.query('month'),
        date: c.req.query('date'),
      }}
    />
  )

  if (isHtmxRequest(c.req.raw)) {
    return c.html(page)
  }

  return c.render(page)
})

entriesRoutes.post('/entries', async (c) => {
  const form = await c.req.parseBody()
  const journalDate = parseJournalDate(typeof form.journal_date === 'string' ? form.journal_date : c.req.query('date'))
  const title = typeof form.title === 'string' ? form.title.trim() : ''
  const summaryValue = typeof form.summary === 'string' ? form.summary.trim() : ''
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

  const href = buildEntriesHref({
    monthKey: formatMonthKey(journalDate),
    dateKey: formatDateKey(journalDate),
    entryId,
  })
  const response = c.redirect(href, 303)
  response.headers.set('HX-Redirect', href)
  return response
})
