import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import {
  buildEntriesHref,
  buildTodayEntriesHref,
  formatMonthKey,
  parseDateKey,
  parseMonthKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import type { JournalEntryRow, JournalUserRow } from '../../types/journal'

type EntriesPageProps = {
  currentUser: JournalUserRow
  entries: JournalEntryRow[]
  query?: {
    month?: string | null
    date?: string | null
    entry?: string | null
  }
}

const parseJournalDate = (dateKey: string): Date => {
  const parsed = parseDateKey(dateKey)
  return parsed ?? new Date()
}

const getMonthDate = (monthParam: string | null | undefined, dateParam: string | null | undefined, entries: JournalEntryRow[]): Date => {
  return (
    parseMonthKey(monthParam) ??
    parseDateKey(dateParam) ??
    (entries[0] ? parseJournalDate(entries[0].journal_date) : new Date())
  )
}

export const EntriesPage = ({ currentUser, entries, query }: EntriesPageProps) => {
  const visibleEntries = entries.filter((entry) => entry.deleted_at == null)
  const monthDate = getMonthDate(query?.month, query?.date, visibleEntries)
  const monthKey = formatMonthKey(monthDate)
  const monthEntries = visibleEntries.filter((entry) => entry.journal_date.startsWith(monthKey))
  const selectedDateKey =
    query?.date && query.date.startsWith(`${monthKey}-`) ? query.date : monthEntries[0]?.journal_date ?? null

  const dayEntries = selectedDateKey
    ? monthEntries.filter((entry) => entry.journal_date === selectedDateKey)
    : []
  const selectedEntry = query?.entry
    ? dayEntries.find((entry) => entry.id === query.entry) ?? dayEntries[0] ?? null
    : dayEntries[0] ?? null

  const calendarView = buildCalendarMonthView(monthDate, monthEntries.map((entry) => entry.journal_date), selectedDateKey, {
    todayHref: buildTodayEntriesHref(),
    previousMonthHref: buildEntriesHref({ monthKey: formatMonthKey(shiftMonth(monthDate, -1)) }),
    nextMonthHref: buildEntriesHref({ monthKey: formatMonthKey(shiftMonth(monthDate, 1)) }),
    dayHref: (dateKey) => buildEntriesHref({ monthKey, dateKey }),
  })

  return (
    <JournalWorkspace
      calendarView={calendarView}
      currentUser={currentUser}
      dayEntries={dayEntries}
      selectedDateLabel={selectedDateKey}
      selectedEntry={selectedEntry}
      dayEntryHref={(entry) =>
        buildEntriesHref({
          monthKey,
          dateKey: entry.journal_date,
          entryId: entry.id,
        })
      }
      menuItems={[
        { label: 'Compose', href: '/entries/new' },
        { label: 'Search', href: '#search-results' },
      ]}
    />
  )
}
