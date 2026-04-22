import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import type { JournalEntryRow } from '../types/journal'

const isVisibleEntry = (entry: JournalEntryRow): boolean => {
  return entry.deleted_at == null
}

const renderEntryCard = (entry: JournalEntryRow) => {
  return (
    <article class="card">
      <div class="card-body space-y-1">
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-lg font-medium">{entry.title || 'Untitled'}</h2>
          <span class="text-xs opacity-60">{entry.journal_date}</span>
        </div>
        {entry.summary ? <p class="text-sm opacity-80">{entry.summary}</p> : <p class="text-sm opacity-60">No summary</p>}
      </div>
    </article>
  )
}

export const entriesRoutes = new Hono<{ Bindings: Bindings }>()

entriesRoutes.get('/entries', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM entries ORDER BY journal_date DESC, created_at DESC'
  ).all<JournalEntryRow>()
  const entries = rows.results.filter(isVisibleEntry)

  return c.render(
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">Entries</h1>
        <a class="btn" href="/entries/new">
          New
        </a>
      </div>

      <form hx-get="/search" hx-target="#search-results" class="space-y-2">
        <input class="input w-full" type="search" name="q" placeholder="title / tags / summary" />
      </form>

      <div id="search-results" class="space-y-3">
        {entries.length > 0 ? (
          entries.map((entry) => <div key={entry.id}>{renderEntryCard(entry)}</div>)
        ) : (
          <p class="text-sm opacity-70">No entries yet.</p>
        )}
      </div>
    </div>
  )
})
