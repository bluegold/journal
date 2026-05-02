import type { Hono } from 'hono'
import { isHtmxRequest } from '../lib/htmx'
import { buildEntriesHref, formatDateKey, formatMonthKey, parseDateKey } from '../lib/entries-navigation'
import { loadEntryBody } from '../lib/entry-body'
import { loadEntryTagNames } from '../lib/entry-tags'
import { renderMarkdown } from '../lib/render-markdown'
import { resolveEntriesSelection } from '../lib/entries-selection'
import { formatTagList } from '../lib/tags'
import { EntryEditContentPane } from '../templates/entry-edit-panel'
import { EntryEditPage } from '../templates/pages/entry-edit-page'
import { NewEntryContentPane, NewEntryPage } from '../templates/pages/new-entry-page'
import { EntriesPage } from '../templates/pages/entries-page'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'
import { findEntryById, loadUserEntries, parseJournalDate } from './entries.shared'

export const registerEntriesReadRoutes = (app: Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>) => {
  app.get('/entries', async (c) => {
    const entries = await loadUserEntries(c)
    const selection = resolveEntriesSelection(entries, {
      month: c.req.query('month'),
      date: c.req.query('date'),
      entry: c.req.query('entry'),
    })
    const selectedEntryBody = selection.selectedEntry
      ? await loadEntryBody(c.env.JOURNAL_BUCKET, selection.selectedEntry.body_key)
      : null
    const selectedEntryTagNames = selection.selectedEntry
      ? await loadEntryTagNames(c.env.DB, c.var.currentUser.id, selection.selectedEntry.id)
      : []
    const selectedEntryBodyHtml = selectedEntryBody ? await renderMarkdown(selectedEntryBody) : null
    const page = (
      <EntriesPage
        currentUser={c.var.currentUser}
        entries={entries}
        selectedEntryBodyHtml={selectedEntryBodyHtml}
        selectedEntryTagNames={selectedEntryTagNames}
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

  app.get('/entries/new', async (c) => {
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

  app.get('/entries/:id/edit', async (c) => {
    const entryId = c.req.param('id')
    const entries = await loadUserEntries(c)
    const entry = findEntryById(entries, entryId)

    if (!entry) {
      return c.text('Entry not found.', 404)
    }

    const body = (await loadEntryBody(c.env.JOURNAL_BUCKET, entry.body_key)) ?? ''
    const tagNames = await loadEntryTagNames(c.env.DB, c.var.currentUser.id, entry.id)

    if (isHtmxRequest(c.req.raw)) {
      return c.html(
        <EntryEditContentPane
          entry={entry}
          body={body}
          tagsText={formatTagList(tagNames)}
          updateHref={`/entries/${entry.id}`}
          acceptAiSummaryHref={`/entries/${entry.id}/accept-ai-summary`}
          cancelHref={buildEntriesHref({
            monthKey: formatMonthKey(parseDateKey(entry.journal_date) ?? new Date()),
            dateKey: entry.journal_date,
            entryId: entry.id,
          })}
        />
      )
    }

    return c.render(
      <EntryEditPage
        currentUser={c.var.currentUser}
        entries={entries}
        entry={entry}
        body={body}
        tagsText={formatTagList(tagNames)}
      />
    )
  })
}
