import { JournalWorkspace } from '../journal-workspace'
import { buildCalendarMonthView } from '../calendar-month'
import { EntryEditPanel } from '../entry-edit-panel'
import { resolveEntriesSelection } from '../../lib/entries-selection'
import {
  buildEntriesHref,
  buildTodayEntriesHref,
  buildTodayNewEntryHref,
  formatMonthKey,
  parseDateKey,
  shiftMonth,
} from '../../lib/entries-navigation'
import { uiText } from '../../lib/i18n'
import type { JournalConfig } from '../../lib/journal-config'
import type { JournalEntryRow, JournalUserRow } from '../../types/journal'

type EntryEditPageProps = {
  currentUser: JournalUserRow
  entries: JournalEntryRow[]
  entry: JournalEntryRow
  body: string
  tagsText: string
  aiTagCandidates: string[]
  journalConfig: JournalConfig
}

export const EntryEditPage = ({ currentUser, entries, entry, body, tagsText, aiTagCandidates, journalConfig }: EntryEditPageProps) => {
  const text = uiText.ja
  const entryDate = parseDateKey(entry.journal_date) ?? new Date()
  const selection = resolveEntriesSelection(entries, {
    month: formatMonthKey(entryDate),
    date: entry.journal_date,
    entry: entry.id,
  })
  const previousMonthDate = shiftMonth(selection.monthDate, -1)
  const nextMonthDate = shiftMonth(selection.monthDate, 1)

  const calendarView = buildCalendarMonthView(
    selection.monthDate,
    selection.monthEntries.map((current) => current.journal_date),
    selection.selectedDateKey,
    {
      todayHref: buildTodayEntriesHref(),
      previousMonthHref: buildEntriesHref({ monthKey: formatMonthKey(previousMonthDate) }),
      nextMonthHref: buildEntriesHref({ monthKey: formatMonthKey(nextMonthDate) }),
      dayHref: (dateKey) => buildEntriesHref({ monthKey: selection.monthKey, dateKey }),
    }
  )

  return (
    <JournalWorkspace
      calendarView={calendarView}
      currentUser={currentUser}
      dayEntries={selection.dayEntries}
      selectedDateLabel={selection.selectedDateKey}
      selectedEntry={entry}
      dayEntryHref={(current) =>
        buildEntriesHref({
          monthKey: selection.monthKey,
          dateKey: current.journal_date,
          entryId: current.id,
        })
      }
      newEntryHref={buildTodayNewEntryHref()}
      detailPane={
        <EntryEditPanel
          entry={entry}
          body={body}
          tagsText={tagsText}
          aiTagCandidates={aiTagCandidates}
          updateHref={`/entries/${entry.id}`}
          acceptAiSummaryHref={`/entries/${entry.id}/accept-ai-summary`}
          cancelHref={buildEntriesHref({
            monthKey: selection.monthKey,
            dateKey: entry.journal_date,
            entryId: entry.id,
          })}
        />
      }
      menuItems={[
        { label: text.nav.entries, href: '/entries' },
        { label: text.nav.search, href: '/search' },
      ]}
      journalConfig={journalConfig}
    />
  )
}
