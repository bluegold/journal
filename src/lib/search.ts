import type { JournalEntryRow, JournalEntryTagRow, JournalTagRow } from '../types/journal'
import { normalizeTagName } from './tags'

type SearchEntriesOptions = {
  entries: JournalEntryRow[]
  userId: string
  query: string
  requestedTags?: string[]
  tag?: string
  tagRows?: JournalTagRow[]
  entryTagRows?: JournalEntryTagRow[]
  tags?: JournalTagRow[]
  entryTags?: JournalEntryTagRow[]
  month?: string | null
  date?: string | null
}

export type SearchEntryMatch = {
  entry: JournalEntryRow
  tagNames: string[]
}

const matchesFreeText = (entry: JournalEntryRow, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery.length === 0) {
    return true
  }

  return [entry.title, entry.summary ?? ''].some((value) => value.toLowerCase().includes(normalizedQuery))
}

const buildTagNamesByEntryId = (
  tags: JournalTagRow[],
  entryTags: JournalEntryTagRow[],
  userId: string
): Map<string, string[]> => {
  const tagNameById = new Map(tags.filter((tag) => tag.user_id === userId).map((tag) => [tag.id, tag.name] as const))
  const tagNamesByEntryId = new Map<string, string[]>()

  for (const entryTag of entryTags) {
    const tagName = tagNameById.get(entryTag.tag_id)
    if (!tagName) {
      continue
    }

    const current = tagNamesByEntryId.get(entryTag.entry_id) ?? []
    current.push(tagName)
    tagNamesByEntryId.set(entryTag.entry_id, current)
  }

  return tagNamesByEntryId
}

export const searchEntries = ({
  entries,
  userId,
  query,
  requestedTags,
  tag,
  tagRows,
  entryTagRows,
  tags,
  entryTags,
  month,
  date,
}: SearchEntriesOptions): SearchEntryMatch[] => {
  const normalizedTags = (requestedTags ?? (tag ? [tag] : []))
    .map((tagName) => normalizeTagName(tagName))
    .filter((tagName): tagName is string => Boolean(tagName))
  const normalizedMonth = month?.trim() ?? ''
  const normalizedDate = date?.trim() ?? ''
  const tagNamesByEntryId = buildTagNamesByEntryId(tagRows ?? tags ?? [], entryTagRows ?? entryTags ?? [], userId)

  return entries
    .filter((entry) => entry.user_id === userId && entry.deleted_at == null)
    .filter((entry) => {
      if (normalizedDate.length > 0) {
        return entry.journal_date === normalizedDate
      }

      if (normalizedMonth.length > 0) {
        return entry.journal_date.startsWith(normalizedMonth)
      }

      return true
    })
    .map((entry) => ({
      entry,
      tagNames: [...new Set(tagNamesByEntryId.get(entry.id) ?? [])].sort((a, b) => a.localeCompare(b)),
    }))
    .filter(({ entry, tagNames }) => {
      if (!matchesFreeText(entry, query)) {
        return false
      }

      if (normalizedTags.length === 0) {
        return true
      }

      return normalizedTags.some((tag) => tagNames.includes(tag))
    })
}
