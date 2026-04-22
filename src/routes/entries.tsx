import { Hono } from 'hono'
import { EntriesPage } from '../templates/pages/entries-page'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'
import type { JournalEntryRow } from '../types/journal'

export const entriesRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

entriesRoutes.get('/entries', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC'
  )
    .bind(c.var.currentUser.id)
    .all<JournalEntryRow>()
  return c.render(
    <EntriesPage
      currentUser={c.var.currentUser}
      entries={rows.results}
    />
  )
})
