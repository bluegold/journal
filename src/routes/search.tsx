import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables, JournalEntryRow, JournalEntryTagRow, JournalTagRow } from '../types/journal'
import { isHtmxRequest } from '../lib/htmx'
import { searchEntries } from '../lib/search'
import { SearchContentPane, SearchPage } from '../templates/pages/search-page'
import { buildTagStats } from '../lib/tag-stats'
import { buildCalendarMonthView } from '../templates/calendar-month'
import {
  formatDateKey,
  formatMonthKey,
  parseDateKey,
  parseMonthKey,
  shiftMonth,
} from '../lib/entries-navigation'

export const searchRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

searchRoutes.get('/search', async (c) => {
  const q = c.req.query('q') ?? ''
  const tag = c.req.query('tag') ?? ''
  const month = c.req.query('month') ?? ''
  const date = c.req.query('date') ?? ''
  const buildSearchHref = (options: { q?: string; tag?: string; month?: string; date?: string }): string => {
    const params = new URLSearchParams()
    const qValue = options.q?.trim() ?? ''
    const tagValue = options.tag?.trim() ?? ''
    const monthValue = options.month?.trim() ?? ''
    const dateValue = options.date?.trim() ?? ''

    if (qValue.length > 0) {
      params.set('q', qValue)
    }

    if (tagValue.length > 0) {
      params.set('tag', tagValue)
    }

    if (monthValue.length > 0) {
      params.set('month', monthValue)
    }

    if (dateValue.length > 0) {
      params.set('date', dateValue)
    }

    const serialized = params.toString()
    return serialized.length > 0 ? `/search?${serialized}` : '/search'
  }

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
    month,
    date,
  })
  const tagStats = buildTagStats(tagRows.results, entryTagRows.results, entryRows.results, c.var.currentUser.id)
  const monthDate = parseMonthKey(month) ?? parseDateKey(date) ?? new Date()
  const monthKey = formatMonthKey(monthDate)
  const previousMonthDate = shiftMonth(monthDate, -1)
  const nextMonthDate = shiftMonth(monthDate, 1)
  const selectedDateKey = date.startsWith(monthKey) ? date : null
  const calendarView = buildCalendarMonthView(
    monthDate,
    entryRows.results.map((entry) => entry.journal_date),
    selectedDateKey,
    {
      todayHref: buildSearchHref({ q, tag, month: formatMonthKey(monthDate), date: formatDateKey(monthDate) }),
      previousMonthHref: buildSearchHref({ q, tag, month: formatMonthKey(previousMonthDate) }),
      nextMonthHref: buildSearchHref({ q, tag, month: formatMonthKey(nextMonthDate) }),
      dayHref: (dateKey) => buildSearchHref({ q, tag, month: monthKey, date: dateKey }),
    }
  )

  const page = (
    <SearchPage
      currentUser={c.var.currentUser}
      query={q}
      tag={tag}
      month={month}
      date={date}
      results={results}
      tagStats={tagStats}
      calendarView={calendarView}
    />
  )

  if (isHtmxRequest(c.req.raw)) {
    return c.html(
      <SearchContentPane
        currentUser={c.var.currentUser}
        query={q}
        tag={tag}
        month={month}
        date={date}
        results={results}
        tagStats={tagStats}
        calendarView={calendarView}
      />
    )
  }

  return c.render(page)
})
