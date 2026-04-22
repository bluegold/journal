import { formatDateKey } from './entries-navigation'

export const buildEntryBodyKey = (journalDate: Date, entryId: string): string => {
  const dateKey = formatDateKey(journalDate)
  const [year, month, day] = dateKey.split('-')
  return `entries/${year}/${month}/${day}/${entryId}.md`
}
