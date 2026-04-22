import { describe, expect, it } from 'vitest'
import { buildCalendarMonthView } from './calendar-month'

describe('calendar month view', () => {
  it('marks journal dates and selected date in the generated grid', () => {
    const view = buildCalendarMonthView(new Date(2026, 3, 1), ['2026-04-05', '2026-04-22'], '2026-04-22')

    expect(view.monthLabel).toContain('2026年4月')
    expect(view.weekdayLabels).toEqual(['日', '月', '火', '水', '木', '金', '土'])
    expect(view.cells).toHaveLength(42)
    expect(view.cells.some((cell) => cell.dateKey === '2026-04-05' && cell.hasEntry)).toBe(true)
    expect(view.cells.some((cell) => cell.dateKey === '2026-04-22' && cell.isSelected)).toBe(true)
    expect(view.cells.some((cell) => cell.dateKey === '2026-04-22' && cell.inMonth)).toBe(true)
  })
})
