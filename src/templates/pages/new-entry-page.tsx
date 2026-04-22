import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import { EntryComposePanel } from '../entry-compose-panel'
import { JournalContentPane } from '../journal-content-pane'
import { resolveEntriesSelection } from '../../lib/entries-selection'
import {
  buildEntriesHref,
  buildNewEntryHref,
  buildTodayEntriesHref,
  buildTodayNewEntryHref,
  formatDateKey,
  formatMonthKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import type { JournalEntryRow, JournalUserRow } from '../../types/journal'

type NewEntryPageProps = {
  currentUser: JournalUserRow
  entries: JournalEntryRow[]
  query?: {
    month?: string | null
    date?: string | null
  }
}

export const NewEntryPage = ({ currentUser, entries, query }: NewEntryPageProps) => {
  const selection = resolveEntriesSelection(entries, query)
  const previousMonthDate = shiftMonth(selection.monthDate, -1)
  const nextMonthDate = shiftMonth(selection.monthDate, 1)

  const calendarView = buildCalendarMonthView(
    selection.monthDate,
    selection.monthEntries.map((entry) => entry.journal_date),
    selection.selectedDateKey,
    {
      todayHref: buildTodayEntriesHref(),
      previousMonthHref: buildEntriesHref({ monthKey: formatMonthKey(previousMonthDate) }),
      nextMonthHref: buildEntriesHref({ monthKey: formatMonthKey(nextMonthDate) }),
      dayHref: (dateKey) => buildNewEntryHref({ monthKey: selection.monthKey, dateKey }),
    }
  )

  return (
    <JournalWorkspace
      calendarView={calendarView}
      currentUser={currentUser}
      composeHref={buildTodayNewEntryHref()}
      dayEntries={selection.dayEntries}
      selectedDateLabel={selection.selectedDateKey}
      selectedEntry={null}
      dayEntryHref={() => buildNewEntryHref({ monthKey: selection.monthKey, dateKey: selection.selectedDateKey })}
      newEntryHref={buildNewEntryHref({ monthKey: selection.monthKey, dateKey: selection.selectedDateKey })}
      detailPane={
        <EntryComposePanel
          journalDate={selection.selectedDateKey ?? formatDateKey(selection.monthDate)}
          title=""
          summary=""
          body={`# ${selection.selectedDateKey ?? formatDateKey(selection.monthDate)}\n\n`}
        />
      }
      menuItems={[
        { label: 'Entries', href: '/entries' },
        { label: 'Search', href: '/entries' },
      ]}
    />
  )
}

export const NewEntryContentPane = ({ journalDate }: { journalDate: string }) => {
  return (
    <JournalContentPane
      detailPane={
        <EntryComposePanel
          journalDate={journalDate}
          title=""
          summary=""
          body={`# ${journalDate}\n\n`}
        />
      }
    />
  )
}
