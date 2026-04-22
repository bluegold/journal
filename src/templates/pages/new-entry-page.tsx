import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import { EntryComposePanel } from '../entry-compose-panel'
import {
  buildEntriesHref,
  buildNewEntryHref,
  buildTodayEntriesHref,
  formatDateKey,
  formatMonthKey,
  parseDateKey,
  parseMonthKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import type { JournalUserRow } from '../../types/journal'

type NewEntryPageProps = {
  currentUser: JournalUserRow
  query?: {
    month?: string | null
    date?: string | null
  }
}

const resolveMonthDate = (monthParam: string | null | undefined, dateParam: string | null | undefined): Date => {
  return parseMonthKey(monthParam) ?? parseDateKey(dateParam) ?? new Date()
}

const resolveDateKey = (queryDate: string | null | undefined, monthDate: Date): string => {
  return queryDate && parseDateKey(queryDate) ? queryDate : formatDateKey(monthDate)
}

export const NewEntryPage = ({ currentUser, query }: NewEntryPageProps) => {
  const monthDate = resolveMonthDate(query?.month, query?.date)
  const monthKey = formatMonthKey(monthDate)
  const selectedDateKey = resolveDateKey(query?.date, monthDate)
  const previousMonthDate = shiftMonth(monthDate, -1)
  const nextMonthDate = shiftMonth(monthDate, 1)

  const calendarView = buildCalendarMonthView(monthDate, [], selectedDateKey, {
    todayHref: buildTodayEntriesHref(),
    previousMonthHref: buildEntriesHref({ monthKey: formatMonthKey(previousMonthDate) }),
    nextMonthHref: buildEntriesHref({ monthKey: formatMonthKey(nextMonthDate) }),
    dayHref: (dateKey) => buildNewEntryHref({ monthKey, dateKey }),
  })

  return (
    <JournalWorkspace
      calendarView={calendarView}
      currentUser={currentUser}
      dayEntries={[]}
      selectedDateLabel={selectedDateKey}
      selectedEntry={null}
      dayEntryHref={() => buildNewEntryHref({ monthKey, dateKey: selectedDateKey })}
      newEntryHref={buildNewEntryHref({ monthKey, dateKey: selectedDateKey })}
      detailPane={
        <EntryComposePanel
          journalDate={selectedDateKey}
          title=""
          summary=""
          body={`# ${selectedDateKey}\n\n`}
        />
      }
      menuItems={[
        { label: 'Entries', href: '/entries' },
        { label: 'Search', href: '/entries' },
      ]}
    />
  )
}
