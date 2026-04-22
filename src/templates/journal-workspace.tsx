import type { Child } from 'hono/jsx'
import { CalendarMonth } from './calendar-month'
import { EntryCard } from './entry-card'
import { JournalHeader } from './journal-header'
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

      <main class="mx-auto w-full max-w-[1600px] px-4 py-4 lg:px-6">
        <div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside class="space-y-4 lg:sticky lg:top-[76px] lg:h-[calc(100vh-92px)] lg:overflow-y-auto lg:pr-1">
            <CalendarMonth view={calendarView} />

            <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Selected day</p>
                  <h2 class="mt-1 text-lg font-semibold text-slate-100">
                    {selectedDateKey || 'No entry selected'}
                  </h2>
                </div>
                <a
                  href={newEntryHref}
                  hx-get={newEntryHref}
                  hx-target="#journal-workspace"
                  hx-swap="outerHTML"
                  hx-push-url="true"
                  class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
                >
                  New entry
                </a>
              </div>

              <div class="mt-4 space-y-2">
                {dayEntries.length > 0 ? (
                  dayEntries.map((entry) => (
                    <EntryCard
                      entry={entry}
                      active={selectedEntry?.id === entry.id}
                      href={entry === selectedEntry ? undefined : dayEntryHref(entry)}
                    />
                  ))
                ) : (
                  <div class="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    No journal entries for this day.
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

            {detailPane}
          </section>
        </div>
      </main>
    </div>
  )
}
