import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables, JournalEntryRow, JournalEntryTagRow, JournalTagRow } from '../types/journal'
import { buildTagStats } from '../lib/tag-stats'
import { formatTagList, splitTagInput, normalizeTagName } from '../lib/tags'
import { TagAutocompleteField, TagAutocompleteSuggestions } from '../templates/tag-autocomplete-field'

export const tagsRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

const loadTagStats = async (db: D1Database, userId: string) => {
  const [tagRows, entryTagRows, entryRows] = await Promise.all([
    db.prepare('SELECT * FROM tags').all<JournalTagRow>(),
    db.prepare('SELECT * FROM entry_tags').all<JournalEntryTagRow>(),
    db.prepare('SELECT * FROM entries').all<JournalEntryRow>(),
  ])

  return buildTagStats(tagRows.results, entryTagRows.results, entryRows.results, userId)
}

const getTagFieldId = (value: string | null | undefined): string => {
  return value?.trim().length ? value.trim() : 'entry-tags'
}

const getTagFormId = (fieldId: string, fallback: string | null | undefined): string => {
  const trimmedFallback = fallback?.trim()
  if (trimmedFallback) {
    return trimmedFallback
  }

  return fieldId.endsWith('-tags') ? `${fieldId.slice(0, -5)}-form` : `${fieldId}-form`
}

const getAutocompleteSuggestions = (tags: ReturnType<typeof buildTagStats>, query: string, selectedTags: string[]) => {
  const selectedSet = new Set(selectedTags)
  const normalizedQuery = query.trim().toLowerCase()

  return tags.filter((tag) => {
    if (selectedSet.has(tag.name)) {
      return false
    }

    if (normalizedQuery.length === 0) {
      return true
    }

    return tag.name.startsWith(normalizedQuery)
  })
}

tagsRoutes.get('/tags', async (c) => {
  const tags = await loadTagStats(c.env.DB, c.var.currentUser.id)

  return c.json({
    tags,
  })
})

tagsRoutes.get('/tags/autocomplete', async (c) => {
  const tags = await loadTagStats(c.env.DB, c.var.currentUser.id)
  const fieldId = getTagFieldId(c.req.query('tags_field_id'))
  const formId = getTagFormId(fieldId, c.req.query('tags_form_id'))
  const tagsInput = c.req.query('tags') ?? ''
  const selectedTag = normalizeTagName(c.req.query('selected_tag') ?? '') ?? ''
  const { selectedTags, query } = splitTagInput(tagsInput)
  const nextSelectedTags = selectedTag.length > 0 && !selectedTags.includes(selectedTag) ? [...selectedTags, selectedTag] : selectedTags
  const nextValue = selectedTag.length > 0 ? `${formatTagList(nextSelectedTags)}${nextSelectedTags.length > 0 ? ', ' : ''}` : tagsInput
  const suggestions = getAutocompleteSuggestions(tags, selectedTag.length > 0 ? '' : query, nextSelectedTags)

  if (selectedTag.length > 0) {
    return c.html(
      <TagAutocompleteField
        fieldId={fieldId}
        formId={formId}
        value={nextValue}
        query=""
        suggestions={suggestions}
        focusEnd
      />
    )
  }

  return c.html(<TagAutocompleteSuggestions fieldId={fieldId} formId={formId} query={query} suggestions={suggestions} />)
})
