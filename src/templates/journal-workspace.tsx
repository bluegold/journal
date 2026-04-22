import { CalendarMonth, buildCalendarMonthView } from './calendar-month'
import { EntryCard } from './entry-card'
import { EntryDetailPanel } from './entry-detail-panel'
import { JournalHeader } from './journal-header'
import type { JournalEntryRow } from '../types/journal'

type JournalWorkspaceProps = {
  monthDate: Date
  journalEntries: JournalEntryRow[]
  selectedEntry: JournalEntryRow | null
  menuItems: Array<{
    label: string
    href: string
  }>
}

const normalizeDateKey = (date: string): string => {
  return date.trim()
}

export const JournalWorkspace = ({
  monthDate,
  journalEntries,
  selectedEntry,
  menuItems,
}: JournalWorkspaceProps) => {
  const journalDateKeys = journalEntries.map((entry) => normalizeDateKey(entry.journal_date))
  const selectedDateKey = selectedEntry ? normalizeDateKey(selectedEntry.journal_date) : null
  const calendarView = buildCalendarMonthView(monthDate, journalDateKeys, selectedDateKey)

  return (
    <div class="min-h-screen">
      <JournalHeader menuItems={menuItems} />

      <main class="mx-auto w-full max-w-[1600px] px-4 py-4 lg:px-6">
        <div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside class="space-y-4 lg:sticky lg:top-[76px] lg:h-[calc(100vh-92px)] lg:overflow-y-auto lg:pr-1">
            <CalendarMonth view={calendarView} />

            <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Selected day</p>
                  <h2 class="mt-1 text-lg font-semibold text-slate-100">
                    {selectedEntry ? selectedEntry.journal_date : 'No entry selected'}
                  </h2>
                </div>
                <a
                  href="/entries/new"
                  class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
                >
                  New entry
                </a>
              </div>

              <div class="mt-4 space-y-2">
                {journalEntries.length > 0 ? (
                  journalEntries.map((entry) => <EntryCard entry={entry} active={selectedEntry?.id === entry.id} />)
                ) : (
                  <div class="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    No journal entries yet for this month.
                  </div>
                )}
              </div>
            </section>
          </aside>

          <section class="min-w-0 space-y-4">
            <div class="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4">
              <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Workspace</p>
              <h1 class="mt-2 text-2xl font-semibold text-slate-50">Article detail and editor</h1>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                The left panel shows the calendar and journal list for the selected month. The right side keeps the
                selected article detail and edit surface visible at the same time.
              </p>
            </div>

            <EntryDetailPanel entry={selectedEntry} />
          </section>
        </div>
      </main>
    </div>
  )
}
