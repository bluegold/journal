import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import { EntryDetailPanel } from '../entry-detail-panel'
import {
  buildEntriesHref,
  buildNewEntryHref,
  buildTodayEntriesHref,
  formatMonthKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import { resolveEntriesSelection } from '../../lib/entries-selection'
import { uiText } from '../../lib/i18n'
import type { JournalConfig } from '../../lib/journal-config'
import type { JournalEntryRow, JournalUserRow } from '../../types/journal'

type HomePageProps = {
  currentUser: JournalUserRow
  entries: JournalEntryRow[]
  journalConfig: JournalConfig
}

export const HomePage = ({ currentUser, entries, journalConfig }: HomePageProps) => {
  const text = uiText.ja
  const selection = resolveEntriesSelection(entries, {})
  const monthDate = selection.monthDate
  const monthKey = selection.monthKey
  const previousMonthDate = shiftMonth(monthDate, -1)
  const nextMonthDate = shiftMonth(monthDate, 1)
  const calendarView = buildCalendarMonthView(monthDate, selection.monthEntries.map((entry) => entry.journal_date), selection.selectedDateKey, {
    todayHref: buildTodayEntriesHref(),
    previousMonthHref: buildEntriesHref({ monthKey: formatMonthKey(previousMonthDate) }),
    nextMonthHref: buildEntriesHref({ monthKey: formatMonthKey(nextMonthDate) }),
    dayHref: (dateKey) => buildEntriesHref({ monthKey, dateKey }),
  })

  return (
    <JournalWorkspace
      calendarView={calendarView}
      currentUser={currentUser}
      dayEntries={[]}
      selectedDateLabel={null}
      selectedEntry={null}
      dayEntryHref={(entry) =>
        buildEntriesHref({
          monthKey,
          dateKey: entry.journal_date,
          entryId: entry.id,
        })
      }
      newEntryHref={buildNewEntryHref({ monthKey: selection.monthKey, dateKey: selection.selectedDateKey })}
      detailPane={<EntryDetailPanel entry={null} renderedBodyHtml={null} entryTags={[]} />}
      menuItems={[
        { label: text.nav.entries, href: '/entries' },
        { label: text.nav.search, href: '/search' },
      ]}
      journalConfig={journalConfig}
    />
  )
}
