import type { JournalEntryRow, JournalEntryTagRow, JournalTagRow } from '../types/journal'
import { normalizeTagName } from './tags'

type SearchEntriesOptions = {
  entries: JournalEntryRow[]
  tags: JournalTagRow[]
  entryTags: JournalEntryTagRow[]
  userId: string
  query: string
  tag: string
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
  tags,
  entryTags,
  userId,
  query,
  tag,
}: SearchEntriesOptions): SearchEntryMatch[] => {
  const normalizedTag = normalizeTagName(tag)
  const tagNamesByEntryId = buildTagNamesByEntryId(tags, entryTags, userId)

  return entries
    .filter((entry) => entry.user_id === userId && entry.deleted_at == null)
    .map((entry) => ({
      entry,
      tagNames: [...new Set(tagNamesByEntryId.get(entry.id) ?? [])].sort((a, b) => a.localeCompare(b)),
    }))
    .filter(({ entry, tagNames }) => {
      if (!matchesFreeText(entry, query)) {
        return false
      }

      if (!normalizedTag) {
        return true
      }

      return tagNames.includes(normalizedTag)
    })
}
