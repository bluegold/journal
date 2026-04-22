import { describe, expect, it, vi } from 'vitest'
import { createEntryRow } from '../test-support'
import { resolveEntriesSelection } from './entries-selection'

describe('resolveEntriesSelection', () => {
  it('selects the first visible day entry when entry is omitted', () => {
    const entries = [
      createEntryRow({
        id: 'entry-1',
        journal_date: '2026-04-22',
        title: 'Morning',
      }),
      createEntryRow({
        id: 'entry-2',
        journal_date: '2026-04-22',
        title: 'Afternoon',
        created_at: '2026-04-22T12:00:00.000Z',
        updated_at: '2026-04-22T12:00:00.000Z',
      }),
      createEntryRow({
        id: 'entry-3',
        journal_date: '2026-04-21',
        title: 'Hidden',
        deleted_at: '2026-04-21T10:00:00.000Z',
      }),
    ]

    const selection = resolveEntriesSelection(entries, {
      month: '2026-04',
      date: '2026-04-22',
    })

    expect(selection.visibleEntries).toHaveLength(2)
    expect(selection.monthKey).toBe('2026-04')
    expect(selection.selectedDateKey).toBe('2026-04-22')
    expect(selection.dayEntries).toHaveLength(2)
    expect(selection.dayEntries.map((entry) => entry.id)).toEqual(['entry-1', 'entry-2'])
    expect(selection.selectedEntry?.id).toBe('entry-1')
  })

  it('selects the requested entry when entry is provided', () => {
    const entries = [
      createEntryRow({
        id: 'entry-1',
        journal_date: '2026-04-22',
        title: 'Morning',
      }),
      createEntryRow({
        id: 'entry-2',
        journal_date: '2026-04-22',
        title: 'Afternoon',
        created_at: '2026-04-22T12:00:00.000Z',
        updated_at: '2026-04-22T12:00:00.000Z',
      }),
    ]

    const selection = resolveEntriesSelection(entries, {
      month: '2026-04',
      date: '2026-04-22',
      entry: 'entry-2',
    })

    expect(selection.dayEntries.map((entry) => entry.id)).toEqual(['entry-1', 'entry-2'])
    expect(selection.selectedEntry?.id).toBe('entry-2')
  })

  it('falls back to the first visible entry when month and date are invalid', () => {
    const entries = [
      createEntryRow({
        id: 'entry-1',
        journal_date: '2026-04-22',
        title: 'April entry',
      }),
      createEntryRow({
        id: 'entry-2',
        journal_date: '2026-05-02',
        title: 'May entry',
        created_at: '2026-05-02T12:00:00.000Z',
        updated_at: '2026-05-02T12:00:00.000Z',
      }),
    ]

    const selection = resolveEntriesSelection(entries, {
      month: 'invalid-month',
      date: 'invalid-date',
      entry: 'missing',
    })

    expect(selection.monthKey).toBe('2026-04')
    expect(selection.selectedDateKey).toBe('2026-04-22')
    expect(selection.dayEntries.map((entry) => entry.id)).toEqual(['entry-1'])
    expect(selection.selectedEntry?.id).toBe('entry-1')
  })

  it('falls back to the current date when the first visible entry has an invalid date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T09:00:00.000Z'))

    try {
      const entries = [
        createEntryRow({
          id: 'entry-1',
          journal_date: 'not-a-date',
          title: 'Broken date',
        }),
      ]

      const selection = resolveEntriesSelection(entries, {
        month: 'invalid-month',
        date: 'invalid-date',
      })

      expect(selection.monthKey).toBe('2026-04')
      expect(selection.monthEntries).toEqual([])
      expect(selection.selectedDateKey).toBeNull()
      expect(selection.selectedEntry).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses the current date when no entries are available', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T09:00:00.000Z'))

    try {
      const selection = resolveEntriesSelection([], {
        month: 'invalid-month',
        date: 'invalid-date',
        entry: 'missing',
      })

      expect(selection.visibleEntries).toEqual([])
      expect(selection.monthKey).toBe('2026-04')
      expect(selection.monthEntries).toEqual([])
      expect(selection.selectedDateKey).toBeNull()
      expect(selection.dayEntries).toEqual([])
      expect(selection.selectedEntry).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
