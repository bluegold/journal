import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables, JournalEntryRow, JournalEntryTagRow, JournalTagRow } from '../types/journal'
import { searchEntries } from '../lib/search'
import { SearchPage } from '../templates/pages/search-page'
import { buildTagStats } from '../lib/tag-stats'

export const searchRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

searchRoutes.get('/search', async (c) => {
  const q = c.req.query('q') ?? ''
  const tag = c.req.query('tag') ?? ''
  const [entryRows, tagRows, entryTagRows] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC')
      .bind(c.var.currentUser.id)
      .all<JournalEntryRow>(),
    c.env.DB.prepare('SELECT * FROM tags').all<JournalTagRow>(),
    c.env.DB.prepare('SELECT * FROM entry_tags').all<JournalEntryTagRow>(),
  ])
  const results = searchEntries({
    entries: entryRows.results,
    tags: tagRows.results,
    entryTags: entryTagRows.results,
    userId: c.var.currentUser.id,
    query: q,
    tag,
  })
  const tagStats = buildTagStats(tagRows.results, entryTagRows.results, entryRows.results, c.var.currentUser.id)

  return c.render(
    <SearchPage currentUser={c.var.currentUser} query={q} tag={tag} results={results} tagStats={tagStats} />
  )
})
