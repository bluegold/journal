import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import { EntryDetailPanel } from '../entry-detail-panel'
import { resolveEntriesSelection } from '../../lib/entries-selection'
import {
  buildEntriesHref,
  buildTodayEntriesHref,
  buildNewEntryHref,
  formatMonthKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import type { JournalEntryRow, JournalUserRow } from '../../types/journal'

type EntriesPageProps = {
  currentUser: JournalUserRow
  entries: JournalEntryRow[]
  selectedEntryBody: string | null
  query?: {
    month?: string | null
    date?: string | null
    entry?: string | null
  }
}

export const EntriesPage = ({ currentUser, entries, selectedEntryBody, query }: EntriesPageProps) => {
  const selection = resolveEntriesSelection(entries, query)

  const calendarView = buildCalendarMonthView(
    selection.monthDate,
    selection.monthEntries.map((entry) => entry.journal_date),
    selection.selectedDateKey,
    {
      todayHref: buildTodayEntriesHref(),
      previousMonthHref: buildEntriesHref({ monthKey: formatMonthKey(shiftMonth(selection.monthDate, -1)) }),
      nextMonthHref: buildEntriesHref({ monthKey: formatMonthKey(shiftMonth(selection.monthDate, 1)) }),
      dayHref: (dateKey) => buildEntriesHref({ monthKey: selection.monthKey, dateKey }),
    }
  )

  return (
    <JournalWorkspace
      calendarView={calendarView}
      currentUser={currentUser}
      dayEntries={selection.dayEntries}
      selectedDateLabel={selection.selectedDateKey}
      selectedEntry={selection.selectedEntry}
      dayEntryHref={(entry) =>
        buildEntriesHref({
          monthKey: selection.monthKey,
          dateKey: entry.journal_date,
          entryId: entry.id,
        })
      }
      newEntryHref={buildNewEntryHref({ monthKey: selection.monthKey, dateKey: selection.selectedDateKey })}
      detailPane={<EntryDetailPanel entry={selection.selectedEntry} body={selectedEntryBody} />}
      menuItems={[
        { label: 'Compose', href: '/entries/new' },
        { label: 'Search', href: '#search-results' },
      ]}
    />
  )
}
