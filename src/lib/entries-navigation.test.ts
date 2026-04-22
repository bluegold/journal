import { describe, expect, it } from 'vitest'
import {
  buildEntriesHref,
  formatDateKey,
  formatMonthKey,
  parseDateKey,
  parseMonthKey,
  shiftMonth,
} from './entries-navigation'

describe('entries navigation helpers', () => {
  it('formats and parses date keys', () => {
    const date = new Date(2026, 3, 22)

    expect(formatDateKey(date)).toBe('2026-04-22')
    expect(parseDateKey('2026-04-22')).toEqual(date)
    expect(parseDateKey('2026-13-22')).toBeNull()
  })

  it('formats and parses month keys', () => {
    const date = new Date(2026, 3, 1)

    expect(formatMonthKey(date)).toBe('2026-04')
    expect(parseMonthKey('2026-04')).toEqual(date)
    expect(parseMonthKey('2026-00')).toBeNull()
  })

  it('shifts months and builds query hrefs', () => {
    expect(shiftMonth(new Date(2026, 3, 1), 1)).toEqual(new Date(2026, 4, 1))
    expect(buildEntriesHref({ monthKey: '2026-04', dateKey: '2026-04-22', entryId: 'entry-1' })).toBe(
      '/entries?month=2026-04&date=2026-04-22&entry=entry-1'
    )
    expect(buildEntriesHref({})).toBe('/entries')
  })
})
