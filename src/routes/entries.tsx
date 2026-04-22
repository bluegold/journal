import { Hono } from 'hono'
import { EntriesPage } from '../templates/pages/entries-page'
import type { Bindings } from '../types/bindings'
import type { JournalEntryRow } from '../types/journal'

export const entriesRoutes = new Hono<{ Bindings: Bindings }>()

entriesRoutes.get('/entries', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM entries ORDER BY journal_date DESC, created_at DESC'
  ).all<JournalEntryRow>()
  return c.render(<EntriesPage entries={rows.results} />)
})
