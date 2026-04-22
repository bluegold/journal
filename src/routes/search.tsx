import { Hono } from 'hono'
import { EntryCard } from '../templates/entry-card'
import type { Bindings } from '../types/bindings'
import type { JournalEntryRow } from '../types/journal'

const matchesQuery = (entry: JournalEntryRow, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery.length === 0) {
    return true
  }

  return [entry.title, entry.summary ?? '', entry.ai_summary ?? ''].some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  )
}

export const searchRoutes = new Hono<{ Bindings: Bindings }>()

searchRoutes.get('/search', async (c) => {
  const q = c.req.query('q') ?? ''
  const rows = await c.env.DB.prepare('SELECT * FROM entries ORDER BY journal_date DESC, created_at DESC').all<JournalEntryRow>()
  const results = rows.results.filter((entry) => entry.deleted_at == null && matchesQuery(entry, q))

  return c.html(
    <div class="space-y-3">
      <div class="text-sm opacity-70">search: {q}</div>
      {results.length > 0 ? (
        results.map((entry) => (
          <EntryCard entry={entry} />
        ))
      ) : (
        <p class="text-sm opacity-60">No matches.</p>
      )}
    </div>
  )
})
