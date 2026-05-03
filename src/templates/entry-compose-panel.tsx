import { createWorkspaceLinkAttrs } from '../lib/htmx'
import { uiText } from '../lib/i18n'
import { JournalContentPane } from './journal-content-pane'
import { TagAutocompleteField } from './tag-autocomplete-field'

type EntryComposePanelProps = {
  journalDate: string
  title: string
  summary: string
  tagsText: string
  body: string
  cancelHref: string
}

export const EntryComposePanel = ({ journalDate, title, summary, tagsText, body, cancelHref }: EntryComposePanelProps) => {
  const text = uiText.ja
  return (
    <section class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-[0_18px_54px_-36px_rgba(2,6,23,0.95)]">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Editor</p>
          <div class="mt-1 flex items-center gap-3">
            <h3 class="truncate text-xl font-semibold text-slate-50">{text.editor.createTitle}</h3>
            <span class="badge badge-draft">
              {text.editor.draft}
            </span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="button-group">
            <button type="submit" form="entry-compose-form" class="btn btn-sm btn-primary">
              {text.editor.save}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              hx-post="/entries/preview"
              hx-include="#entry-compose-form"
              hx-target="#entry-preview-overlay"
              hx-swap="outerHTML"
            >
              {text.editor.preview}
            </button>
            <a
              {...createWorkspaceLinkAttrs(cancelHref, { target: '#journal-workspace' })}
              class="btn btn-sm btn-outline"
            >
              {text.editor.cancel}
            </a>
          </div>
        </div>
      </div>

      <form id="entry-compose-form" class="mt-3 space-y-3" method="post" action="/entries">
        <div class="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <label class="block space-y-1.5">
            <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">{text.editor.journalDate}</span>
            <input class="input w-full" type="date" name="journal_date" value={journalDate} required />
          </label>

          <label class="block space-y-1.5">
            <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">{text.editor.title}</span>
            <input class="input w-full" type="text" name="title" value={title} placeholder={text.editor.placeholderTitle} />
          </label>
        </div>

        <label class="block space-y-1.5">
          <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">{text.editor.markdown}</span>
          <textarea class="textarea min-h-[52vh] w-full font-mono text-sm leading-6" name="body" placeholder={text.editor.placeholderMarkdown}>
            {body}
          </textarea>
        </label>

        <div class="grid gap-3 xl:grid-cols-2">
          <label class="block space-y-1.5">
            <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">{text.editor.summary}</span>
            <textarea class="textarea min-h-24 w-full" name="summary" placeholder={text.editor.placeholderSummary}>
              {summary}
            </textarea>
          </label>

          <TagAutocompleteField
            fieldId="entry-compose-tags"
            formId="entry-compose-form"
            value={tagsText}
            query=""
            suggestions={[]}
          />
        </div>
      </form>

    </section>
  )
}

export const EntryComposeContentPane = (props: EntryComposePanelProps) => {
  return <JournalContentPane detailPane={<EntryComposePanel {...props} />} />
}
