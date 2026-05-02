import type { Child } from 'hono/jsx'
import { CalendarMonth } from './calendar-month'
import { EntryCard } from './entry-card'
import { JournalHeader } from './journal-header'
import { JournalContentPane } from './journal-content-pane'
import type { CalendarMonthView } from './calendar-month'
import type { JournalEntryRow, JournalUserRow } from '../types/journal'

type JournalWorkspaceProps = {
  currentUser: JournalUserRow
  calendarView: CalendarMonthView
  dayEntries: JournalEntryRow[]
  selectedDateLabel: string | null
  selectedEntry: JournalEntryRow | null
  dayEntryHref: (entry: JournalEntryRow) => string
  newEntryHref: string
  detailPane: Child
  menuItems: Array<{
    label: string
    href: string
  }>
}

export const JournalWorkspace = ({
  currentUser,
  calendarView,
  dayEntries,
  selectedDateLabel,
  selectedEntry,
  dayEntryHref,
  newEntryHref,
  detailPane,
  menuItems,
}: JournalWorkspaceProps) => {
  const selectedDateKey = selectedDateLabel?.trim() ?? null

  return (
    <div id="journal-workspace" class="min-h-screen">
      <JournalHeader currentUser={currentUser} menuItems={menuItems} />

      <main class="mx-auto w-full max-w-[1680px] px-3 py-3 sm:px-4 lg:px-5">
        <div class="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside class="space-y-3 lg:sticky lg:top-[64px] lg:h-[calc(100vh-76px)] lg:overflow-y-auto lg:pr-1">
            <CalendarMonth view={calendarView} />

            <section class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3 shadow-[0_18px_48px_-36px_rgba(2,6,23,0.95)]">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Selected day</p>
                  <h2 class="mt-1 text-sm font-semibold text-slate-100">
                    {selectedDateKey || 'No date selected'}
                  </h2>
                </div>
                {selectedDateKey ? (
                  <a
                    href={newEntryHref}
                    hx-get={newEntryHref}
                    hx-target="#journal-content"
                    hx-swap="outerHTML"
                    hx-push-url="true"
                    class="rounded-full border border-cyan-300/50 bg-cyan-300/15 px-3 py-1 text-xs font-medium text-cyan-50 transition hover:border-cyan-200/70 hover:bg-cyan-300/25"
                  >
                    + New
                  </a>
                ) : null}
              </div>

              <div class="mt-3 space-y-2">
                {dayEntries.length > 0 ? (
                  dayEntries.map((entry) => (
                    <EntryCard
                      entry={entry}
                      active={selectedEntry?.id === entry.id}
                      href={entry === selectedEntry ? undefined : dayEntryHref(entry)}
                    />
                  ))
                ) : (
                  <div class="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
                    No journal entries for this day.
                  </div>
                )}
              </div>
            </section>
          </aside>

          <JournalContentPane detailPane={detailPane} />
        </div>
      </main>
    </div>
  )
}
