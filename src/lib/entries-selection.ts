import { formatMonthKey, parseDateKey, parseMonthKey } from './entries-navigation'
import type { JournalEntryRow } from '../types/journal'

export type EntriesSelectionQuery = {
  month?: string | null
  date?: string | null
  entry?: string | null
}

export type EntriesSelection = {
  visibleEntries: JournalEntryRow[]
  monthDate: Date
  monthKey: string
  monthEntries: JournalEntryRow[]
  selectedDateKey: string | null
  dayEntries: JournalEntryRow[]
  selectedEntry: JournalEntryRow | null
}

const parseJournalDate = (dateKey: string): Date => {
  return parseDateKey(dateKey) ?? new Date()
}

const getMonthDate = (monthParam: string | null | undefined, dateParam: string | null | undefined, entries: JournalEntryRow[]): Date => {
  return (
    parseMonthKey(monthParam) ??
    parseDateKey(dateParam) ??
    (entries[0] ? parseJournalDate(entries[0].journal_date) : new Date())
  )
}

export const resolveEntriesSelection = (
  entries: JournalEntryRow[],
  query?: EntriesSelectionQuery
): EntriesSelection => {
  const visibleEntries = entries.filter((entry) => entry.deleted_at == null)
  const monthDate = getMonthDate(query?.month, query?.date, visibleEntries)
  const monthKey = formatMonthKey(monthDate)
  const monthEntries = visibleEntries.filter((entry) => entry.journal_date.startsWith(monthKey))
  const selectedDateKey =
    query?.date && query.date.startsWith(`${monthKey}-`) ? query.date : monthEntries[0]?.journal_date ?? null

  const dayEntries = selectedDateKey
    ? monthEntries.filter((entry) => entry.journal_date === selectedDateKey)
    : []
  const selectedEntry = query?.entry
    ? dayEntries.find((entry) => entry.id === query.entry) ?? dayEntries[0] ?? null
    : dayEntries[0] ?? null

  return {
    visibleEntries,
    monthDate,
    monthKey,
    monthEntries,
    selectedDateKey,
    dayEntries,
    selectedEntry,
  }
}
