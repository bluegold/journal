import type { JournalTagStat } from '../lib/tag-stats'
import { createWorkspaceLinkAttrs } from '../lib/htmx'

type TagAutocompleteFieldProps = {
  fieldId: string
  formId: string
  value: string
  query: string
  suggestions: JournalTagStat[]
  focusEnd?: boolean
}

const getSuggestionsTitle = (query: string, suggestions: JournalTagStat[]): string => {
  if (query.length === 0) {
    return suggestions.length > 0 ? 'Popular tags' : 'No tags yet'
  }

  return suggestions.length > 0 ? `Matches for "${query}"` : `No matches for "${query}"`
}

export const TagAutocompleteSuggestions = ({
  fieldId,
  formId,
  query,
  suggestions,
}: Pick<TagAutocompleteFieldProps, 'fieldId' | 'formId' | 'query' | 'suggestions'>) => {
  return (
    <div
      id={`${fieldId}-suggestions`}
      class="mt-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3"
      aria-live="polite"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
          {getSuggestionsTitle(query, suggestions)}
        </p>
        <span class="text-[10px] text-slate-500">{suggestions.length} shown</span>
      </div>

      {suggestions.length > 0 ? (
        <div class="mt-3 flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <a
              {...createWorkspaceLinkAttrs(`/tags/autocomplete?selected_tag=${encodeURIComponent(tag.name)}`, {
                target: `#${fieldId}-field`,
                pushUrl: false,
              })}
              hx-include={`#${formId}`}
              class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            >
              <span>{tag.name}</span>
              <span class="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                {tag.usage_count}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p class="mt-3 text-sm text-slate-500">Type to narrow the list.</p>
      )}
    </div>
  )
}

export const TagAutocompleteField = ({
  fieldId,
  formId,
  value,
  query,
  suggestions,
  focusEnd = false,
}: TagAutocompleteFieldProps) => {
  return (
    <div id={`${fieldId}-field`} class="space-y-2">
      <input type="hidden" name="tags_field_id" value={fieldId} />
      <input type="hidden" name="tags_form_id" value={formId} />
      <label class="block space-y-2">
        <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Tags</span>
        <textarea
          id={`${fieldId}-input`}
          class="textarea min-h-20 w-full"
          name="tags"
          placeholder="work, ideas, project"
          data-focus-end={focusEnd ? 'true' : undefined}
          hx-get="/tags/autocomplete"
          hx-trigger="input changed delay:250ms"
          hx-include={`#${formId}`}
          hx-target={`#${fieldId}-suggestions`}
          hx-swap="innerHTML"
          hx-push-url="false"
        >
          {value}
        </textarea>
        <p class="text-xs text-slate-500">Comma or newline separated. Lower-cased and deduplicated on save.</p>
      </label>

      <TagAutocompleteSuggestions fieldId={fieldId} formId={formId} query={query} suggestions={suggestions} />
    </div>
  )
}

export const TagAutocompleteSelection = ({
  fieldId,
  formId,
  value,
  suggestions,
}: Pick<TagAutocompleteFieldProps, 'fieldId' | 'formId' | 'value' | 'suggestions'>) => {
  return (
    <TagAutocompleteField
      fieldId={fieldId}
      formId={formId}
      value={value}
      query=""
      suggestions={suggestions}
      focusEnd
    />
  )
}
