import { createWorkspaceLinkAttrs } from '../lib/htmx'
import { JournalContentPane } from './journal-content-pane'

type EntryComposePanelProps = {
  journalDate: string
  title: string
  summary: string
  body: string
  cancelHref: string
}

export const EntryComposePanel = ({ journalDate, title, summary, body, cancelHref }: EntryComposePanelProps) => {
  return (
    <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_18px_60px_-34px_rgba(2,6,23,0.9)]">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Editor</p>
          <h3 class="mt-2 text-xl font-semibold text-slate-50">Create a new entry</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            hx-post="/entries/preview"
            hx-include="#entry-compose-form"
            hx-target="#entry-preview-overlay"
            hx-swap="outerHTML"
          >
            Preview
          </button>
          <div class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            journal draft
          </div>
        </div>
      </div>

      <form id="entry-compose-form" class="mt-5 space-y-4" method="post" action="/entries">
        <label class="block space-y-2">
          <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Journal date</span>
          <input class="input w-full" type="date" name="journal_date" value={journalDate} required />
        </label>

        <label class="block space-y-2">
          <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Title</span>
          <input class="input w-full" type="text" name="title" value={title} placeholder="Untitled" />
        </label>

        <label class="block space-y-2">
          <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Summary</span>
          <textarea class="textarea min-h-28 w-full" name="summary" placeholder="Short summary">
            {summary}
          </textarea>
        </label>

        <label class="block space-y-2">
          <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Markdown</span>
          <textarea class="textarea min-h-60 w-full font-mono text-sm leading-6" name="body" placeholder="# Title">
            {body}
          </textarea>
        </label>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary">
            Save
          </button>
          <a {...createWorkspaceLinkAttrs(cancelHref, { target: '#journal-workspace' })} class="btn">
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
