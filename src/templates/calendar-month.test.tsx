import { describe, expect, it } from 'vitest'
import { buildCalendarMonthView } from './calendar-month'
import {
  buildEntriesHref,
  buildMonthKeyFromDateKey,
  buildTodayEntriesHref,
  formatMonthKey,
  shiftMonth,
} from '../lib/entries-navigation'

describe('calendar month view', () => {
  it('marks journal dates and selected date in the generated grid', () => {
    const monthDate = new Date(2026, 3, 1)
    const view = buildCalendarMonthView(new Date(2026, 3, 1), ['2026-04-05', '2026-04-22'], '2026-04-22', {
      todayHref: buildTodayEntriesHref(monthDate),
      previousMonthHref: buildEntriesHref({ monthKey: formatMonthKey(shiftMonth(monthDate, -1)) }),
      nextMonthHref: buildEntriesHref({ monthKey: formatMonthKey(shiftMonth(monthDate, 1)) }),
      dayHref: (dateKey) => buildEntriesHref({ monthKey: buildMonthKeyFromDateKey(dateKey), dateKey }),
    })

    expect(view.monthLabel).toContain('2026年4月')
    expect(view.weekdayLabels).toEqual(['日', '月', '火', '水', '木', '金', '土'])
    expect(view.todayHref).toBe('/entries?month=2026-04&date=2026-04-01')
    expect(view.previousMonthHref).toBe('/entries?month=2026-03')
    expect(view.nextMonthHref).toBe('/entries?month=2026-05')
    expect(view.cells).toHaveLength(42)
    expect(view.cells.some((cell) => cell.dateKey === '2026-04-05' && cell.hasEntry)).toBe(true)
    expect(view.cells.some((cell) => cell.dateKey === '2026-04-22' && cell.isSelected)).toBe(true)
    expect(view.cells.some((cell) => cell.dateKey === '2026-04-22' && cell.inMonth)).toBe(true)
    expect(view.cells.find((cell) => cell.dateKey === '2026-04-22')?.href).toBe(
      '/entries?month=2026-04&date=2026-04-22'
    )
    expect(view.cells.find((cell) => cell.dateKey === '2026-03-29')?.href).toBe(
      '/entries?month=2026-03&date=2026-03-29'
    )
  })
})
