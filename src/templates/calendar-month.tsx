import { createWorkspaceLinkAttrs } from '../lib/htmx'

type CalendarMonthCell = {
  dateKey: string | null
  href: string
  dayLabel: string
  inMonth: boolean
  hasEntry: boolean
  isSelected: boolean
  isToday: boolean
}

export type CalendarMonthView = {
  monthLabel: string
  weekdayLabels: string[]
  todayHref: string
  previousMonthHref: string
  nextMonthHref: string
  cells: CalendarMonthCell[]
}

type CalendarMonthProps = {
  view: CalendarMonthView
}

const createDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const buildCalendarMonthView = (
  monthDate: Date,
  journalDateKeys: string[],
  selectedDateKey: string | null,
  links: {
    todayHref: string
    previousMonthHref: string
    nextMonthHref: string
    dayHref: (dateKey: string) => string
  }
): CalendarMonthView => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const startOffset = firstDayOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startOffset)
  const todayKey = createDateKey(new Date())
  const journalDateSet = new Set(journalDateKeys)

  const cells: CalendarMonthCell[] = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    const inMonth = date.getMonth() === month
    const dateKey = createDateKey(date)

    return {
      dateKey,
      href: links.dayHref(dateKey),
      dayLabel: `${date.getDate()}`,
      inMonth,
      hasEntry: journalDateSet.has(dateKey),
      isSelected: selectedDateKey === dateKey,
      isToday: todayKey === dateKey,
    }
  })

  return {
    monthLabel: new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(firstDayOfMonth),
    weekdayLabels: ['日', '月', '火', '水', '木', '金', '土'],
    todayHref: links.todayHref,
    previousMonthHref: links.previousMonthHref,
    nextMonthHref: links.nextMonthHref,
    cells,
  }
}

export const CalendarMonth = ({ view }: CalendarMonthProps) => {
  return (
    <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-4 shadow-[0_18px_60px_-35px_rgba(2,6,23,0.9)] backdrop-blur">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Calendar</p>
          <h2 class="mt-1 text-lg font-semibold text-slate-100">{view.monthLabel}</h2>
        </div>
        <div class="flex items-center gap-2">
          <a
            {...createWorkspaceLinkAttrs(view.todayHref)}
            class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:text-white"
          >
            Today
          </a>
          <a
            {...createWorkspaceLinkAttrs(view.previousMonthHref)}
            class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
          >
            Prev
          </a>
          <a
            {...createWorkspaceLinkAttrs(view.nextMonthHref)}
            class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
          >
            Next
          </a>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {view.weekdayLabels.map((weekday) => (
          <div>{weekday}</div>
        ))}
      </div>

      <div class="mt-2 grid grid-cols-7 gap-1">
        {view.cells.map((cell) => (
          <a
            {...createWorkspaceLinkAttrs(cell.href)}
            class={[
              'flex aspect-square items-center justify-center rounded-2xl border text-sm transition',
              'focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-0',
              cell.inMonth
                ? 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-400/35 hover:bg-cyan-400/10'
                : 'border-white/5 bg-slate-950/40 text-slate-600',
              cell.hasEntry ? 'ring-1 ring-cyan-400/40' : '',
              cell.isSelected ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-50' : '',
              cell.isToday ? 'shadow-[0_0_0_1px_rgba(56,189,248,0.45)]' : '',
            ].join(' ')}
            data-date={cell.dateKey}
          >
            <span class="relative">
              {cell.dayLabel}
              {cell.hasEntry ? <span class="absolute -right-2 -top-1 h-1.5 w-1.5 rounded-full bg-cyan-300" /> : null}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
