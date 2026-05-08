import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'
import { isHtmxRequest } from '../lib/htmx'
import { loadSearchEntryMatches } from '../lib/search'
import { SearchContentPane, SearchPage } from '../templates/pages/search-page'
import { loadTagStats } from '../lib/tag-stats'
import { buildCalendarMonthView } from '../templates/calendar-month'
import {
  formatDateKey,
  formatMonthKey,
  parseDateKey,
  parseMonthKey,
  buildMonthKeyFromDateKey,
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

  const [results, tagStats, journalDateRows] = await Promise.all([
    loadSearchEntryMatches(c.env.DB, c.var.currentUser.id, { query: q, tag, month, date }),
    loadTagStats(c.env.DB, c.var.currentUser.id),
    c.env.DB.prepare('SELECT journal_date FROM entries WHERE user_id = ? AND deleted_at IS NULL ORDER BY journal_date DESC')
      .bind(c.var.currentUser.id)
      .all<{ journal_date: string }>(),
  ])
  const monthDate = parseMonthKey(month) ?? parseDateKey(date) ?? new Date()
  const monthKey = formatMonthKey(monthDate)
  const previousMonthDate = shiftMonth(monthDate, -1)
  const nextMonthDate = shiftMonth(monthDate, 1)
  const selectedDateKey = date.startsWith(monthKey) ? date : null
  const calendarView = buildCalendarMonthView(
    monthDate,
    journalDateRows.results.map((entry) => entry.journal_date),
    selectedDateKey,
    {
      todayHref: buildSearchHref({ q, tag, month: formatMonthKey(monthDate), date: formatDateKey(monthDate) }),
      previousMonthHref: buildSearchHref({ q, tag, month: formatMonthKey(previousMonthDate) }),
      nextMonthHref: buildSearchHref({ q, tag, month: formatMonthKey(nextMonthDate) }),
      dayHref: (dateKey) => buildSearchHref({ q, tag, month: buildMonthKeyFromDateKey(dateKey), date: dateKey }),
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
      journalConfig={c.var.journalConfig}
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
        journalConfig={c.var.journalConfig}
      />
    )
  }

  return c.render(page)
})
