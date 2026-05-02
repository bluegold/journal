import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import { EntryDetailPanel } from '../entry-detail-panel'
import {
  buildEntriesHref,
  buildNewEntryHref,
  buildTodayEntriesHref,
  formatDateKey,
  formatMonthKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import type { JournalUserRow } from '../../types/journal'

type HomePageProps = {
  currentUser: JournalUserRow
}

export const HomePage = ({ currentUser }: HomePageProps) => {
  const monthDate = new Date()
  const monthKey = formatMonthKey(monthDate)
  const previousMonthDate = shiftMonth(monthDate, -1)
  const nextMonthDate = shiftMonth(monthDate, 1)
  const calendarView = buildCalendarMonthView(monthDate, [], null, {
    todayHref: buildTodayEntriesHref(monthDate),
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
      dayEntryHref={() => '/entries'}
      newEntryHref={buildNewEntryHref({ monthKey: formatMonthKey(monthDate), dateKey: formatDateKey(monthDate) })}
      detailPane={<EntryDetailPanel entry={null} renderedBodyHtml={null} entryTags={[]} />}
      menuItems={[
        { label: 'Entries', href: '/entries' },
        { label: 'Search', href: '/entries' },
      ]}
    />
  )
}
