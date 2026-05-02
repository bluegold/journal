import { createWorkspaceLinkAttrs } from '../lib/htmx'
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
  return (
    <section class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-[0_18px_54px_-36px_rgba(2,6,23,0.95)]">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Editor</p>
          <h3 class="mt-1 truncate text-xl font-semibold text-slate-50">Create a new entry</h3>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="submit" form="entry-compose-form" class="btn btn-primary h-7 px-3 text-xs">
            Save
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white"
            hx-post="/entries/preview"
            hx-include="#entry-compose-form"
            hx-target="#entry-preview-overlay"
            hx-swap="outerHTML"
          >
            Preview
          </button>
          <div class="rounded-full border border-cyan-300/40 bg-cyan-300/15 px-3 py-1 text-xs text-cyan-50">
            journal draft
          </div>
        </div>
      </div>

      <form id="entry-compose-form" class="mt-3 space-y-3" method="post" action="/entries">
        <div class="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <label class="block space-y-1.5">
            <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">Journal date</span>
            <input class="input w-full" type="date" name="journal_date" value={journalDate} required />
          </label>

          <label class="block space-y-1.5">
            <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">Title</span>
            <input class="input w-full" type="text" name="title" value={title} placeholder="Untitled" />
          </label>
        </div>

        <label class="block space-y-1.5">
          <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">Markdown</span>
          <textarea class="textarea min-h-[52vh] w-full font-mono text-sm leading-6" name="body" placeholder="# Title">
            {body}
          </textarea>
        </label>

        <div class="grid gap-3 xl:grid-cols-2">
          <label class="block space-y-1.5">
            <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">Summary</span>
            <textarea class="textarea min-h-24 w-full" name="summary" placeholder="Short summary">
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

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary">
            Save
          </button>
          <a {...createWorkspaceLinkAttrs(cancelHref, { target: '#journal-content' })} class="btn">
            Cancel
          </a>
        </div>
      </form>

    </section>
  )
}

export const EntryComposeContentPane = (props: EntryComposePanelProps) => {
  return <JournalContentPane detailPane={<EntryComposePanel {...props} />} />
}
