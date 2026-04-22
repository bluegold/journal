import { parseTagList } from './tags'
import type { JournalEntryTagRow, JournalTagRow } from '../types/journal'

const loadTagRows = async (db: D1Database): Promise<JournalTagRow[]> => {
  const rows = await db.prepare('SELECT * FROM tags').all<JournalTagRow>()
  return rows.results
}

const loadEntryTagRows = async (db: D1Database): Promise<JournalEntryTagRow[]> => {
  const rows = await db.prepare('SELECT * FROM entry_tags').all<JournalEntryTagRow>()
  return rows.results
}

export const loadEntryTagNames = async (
  db: D1Database,
  userId: string,
  entryId: string
): Promise<string[]> => {
  const [tagRows, entryTagRows] = await Promise.all([loadTagRows(db), loadEntryTagRows(db)])
  const tagNameById = new Map(
    tagRows.filter((tag) => tag.user_id === userId).map((tag) => [tag.id, tag.name] as const)
  )

  const tagNames = entryTagRows
    .filter((entryTag) => entryTag.entry_id === entryId)
    .map((entryTag) => tagNameById.get(entryTag.tag_id))
    .filter((tagName): tagName is string => typeof tagName === 'string')

  return [...new Set(tagNames)].sort((a, b) => a.localeCompare(b))
}

export const replaceEntryTags = async (options: {
  db: D1Database
  userId: string
  entryId: string
  tagText: string
  timestamp: string
}): Promise<string[]> => {
  const desiredTagNames = parseTagList(options.tagText)
  const [tagRows, entryTagRows] = await Promise.all([loadTagRows(options.db), loadEntryTagRows(options.db)])
  const tagsByName = new Map(
    tagRows.filter((tag) => tag.user_id === options.userId).map((tag) => [tag.name, tag] as const)
  )
  const previousEntryTags = entryTagRows.filter((entryTag) => entryTag.entry_id === options.entryId)
  const createdTagIds: number[] = []

  try {
    await options.db.prepare('DELETE FROM entry_tags WHERE entry_id = ?').bind(options.entryId).run()

    for (const tagName of desiredTagNames) {
      let tag = tagsByName.get(tagName) ?? null

      if (!tag) {
        await options.db
          .prepare('INSERT INTO tags (user_id, name, created_at) VALUES (?, ?, ?)')
          .bind(options.userId, tagName, options.timestamp)
          .run()

        const refreshedTags = await loadTagRows(options.db)
        tag =
          refreshedTags.find((current) => current.user_id === options.userId && current.name === tagName) ?? null

        if (!tag) {
          throw new Error(`Failed to create tag: ${tagName}`)
        }

        tagsByName.set(tagName, tag)
        createdTagIds.push(tag.id)
      }

      await options.db
        .prepare('INSERT INTO entry_tags (entry_id, tag_id, created_at) VALUES (?, ?, ?)')
        .bind(options.entryId, tag.id, options.timestamp)
        .run()
    }
  } catch (error) {
    await options.db.prepare('DELETE FROM entry_tags WHERE entry_id = ?').bind(options.entryId).run()

    for (const entryTag of previousEntryTags) {
      await options.db
        .prepare('INSERT INTO entry_tags (entry_id, tag_id, created_at) VALUES (?, ?, ?)')
        .bind(entryTag.entry_id, entryTag.tag_id, entryTag.created_at ?? options.timestamp)
        .run()
    }

    for (const tagId of createdTagIds) {
      await options.db.prepare('DELETE FROM tags WHERE id = ?').bind(tagId).run()
    }

    throw error
  }

  return desiredTagNames
}
