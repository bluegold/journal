import { Hono } from 'hono'
import type { Context } from 'hono'
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
import { renderMarkdown } from '../lib/render-markdown'
import { resolveEntriesSelection } from '../lib/entries-selection'
import { EntryEditContentPane } from '../templates/entry-edit-panel'
import { EntryEditPage } from '../templates/pages/entry-edit-page'
import { NewEntryContentPane } from '../templates/pages/new-entry-page'
import { EntriesPage } from '../templates/pages/entries-page'
import { NewEntryPage } from '../templates/pages/new-entry-page'
import { EntryPreviewOverlay, EntryPreviewSlot } from '../templates/entry-preview-panel'
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

type EntriesRouteContext = Context<{ Bindings: Bindings; Variables: JournalContextVariables }>

const loadUserEntries = async (c: EntriesRouteContext) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC'
  )
    .bind(c.var.currentUser.id)
    .all<JournalEntryRow>()

  return rows.results
}

const findEntryById = (entries: JournalEntryRow[], id: string): JournalEntryRow | null => {
  return entries.find((entry) => entry.id === id && entry.deleted_at == null) ?? null
}

entriesRoutes.get('/entries', async (c) => {
  const entries = await loadUserEntries(c)
  const selection = resolveEntriesSelection(entries, {
    month: c.req.query('month'),
    date: c.req.query('date'),
    entry: c.req.query('entry'),
  })
  const selectedEntryBody = selection.selectedEntry
    ? await loadEntryBody(c.env.JOURNAL_BUCKET, selection.selectedEntry.body_key)
    : null
  const selectedEntryBodyHtml = selectedEntryBody ? await renderMarkdown(selectedEntryBody) : null
  const page = (
    <EntriesPage
      currentUser={c.var.currentUser}
      entries={entries}
      selectedEntryBodyHtml={selectedEntryBodyHtml}
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
  if (isHtmxRequest(c.req.raw)) {
    const journalDate = parseJournalDate(c.req.query('date'))
    return c.html(<NewEntryContentPane journalDate={formatDateKey(journalDate)} />)
  }

  const rows = await loadUserEntries(c)
  const page = (
    <NewEntryPage
      currentUser={c.var.currentUser}
      entries={rows}
      query={{
        month: c.req.query('month'),
        date: c.req.query('date'),
      }}
    />
  )

  return c.render(page)
})

entriesRoutes.get('/entries/:id/edit', async (c) => {
  const entryId = c.req.param('id')
  const entries = await loadUserEntries(c)
  const entry = findEntryById(entries, entryId)

  if (!entry) {
    return c.text('Entry not found.', 404)
  }

  const body = (await loadEntryBody(c.env.JOURNAL_BUCKET, entry.body_key)) ?? ''

  if (isHtmxRequest(c.req.raw)) {
    return c.html(
      <EntryEditContentPane
        entry={entry}
        body={body}
        updateHref={`/entries/${entry.id}`}
        cancelHref={buildEntriesHref({
          monthKey: formatMonthKey(parseDateKey(entry.journal_date) ?? new Date()),
          dateKey: entry.journal_date,
          entryId: entry.id,
        })}
      />
    )
  }

  return c.render(
    <EntryEditPage currentUser={c.var.currentUser} entries={entries} entry={entry} body={body} />
  )
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

entriesRoutes.post('/entries/preview', async (c) => {
  const form = await c.req.parseBody()
  const title = typeof form.title === 'string' ? form.title.trim() : ''
  const body = normalizeBody(title, typeof form.body === 'string' ? form.body : '')
  const renderedBodyHtml = await renderMarkdown(body)

  return c.html(<EntryPreviewOverlay renderedBodyHtml={renderedBodyHtml} />)
})

entriesRoutes.get('/entries/preview/close', async (c) => {
  return c.html(<EntryPreviewSlot />)
})

entriesRoutes.post('/entries/:id', async (c) => {
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

entriesRoutes.post('/entries/:id/delete', async (c) => {
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
    monthKey: formatMonthKey(parseDateKey(currentEntry.journal_date) ?? new Date()),
    dateKey: currentEntry.journal_date,
  })
  const response = c.redirect(href, 303)
  response.headers.set('HX-Redirect', href)
  return response
})
