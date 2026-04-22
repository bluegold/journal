import type { Child } from 'hono/jsx'

type JournalContentPaneProps = {
  detailPane: Child
}

export const JournalContentPane = ({ detailPane }: JournalContentPaneProps) => {
  return (
    <section id="journal-content" class="min-w-0 space-y-4">
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
  )
}
