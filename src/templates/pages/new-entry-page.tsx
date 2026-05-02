import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import { EntryComposeContentPane, EntryComposePanel } from '../entry-compose-panel'
import { resolveEntriesSelection } from '../../lib/entries-selection'
import {
  buildEntriesHref,
  buildNewEntryHref,
  buildTodayEntriesHref,
  formatDateKey,
  formatMonthKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import { uiText } from '../../lib/i18n'
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
  const text = uiText.ja
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
          tagsText=""
          body={`# ${selection.selectedDateKey ?? formatDateKey(selection.monthDate)}\n\n`}
          cancelHref={buildEntriesHref({
            monthKey: selection.monthKey,
            dateKey: selection.selectedDateKey,
          })}
        />
      }
      menuItems={[
        { label: text.nav.entries, href: '/entries' },
        { label: text.nav.search, href: '/search' },
      ]}
    />
  )
}

export const NewEntryContentPane = ({ journalDate }: { journalDate: string }) => {
  return (
    <EntryComposeContentPane
      journalDate={journalDate}
      title=""
      summary=""
      tagsText=""
      body={`# ${journalDate}\n\n`}
      cancelHref={buildEntriesHref({
        monthKey: journalDate.slice(0, 7),
        dateKey: journalDate,
      })}
    />
  )
}
