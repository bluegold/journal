import type { JournalEntryRow } from '../types/journal'
import { createWorkspaceLinkAttrs } from '../lib/htmx'
import { JournalContentPane } from './journal-content-pane'

type EntryEditPanelProps = {
  entry: JournalEntryRow
  body: string
  updateHref: string
  cancelHref: string
}

export const EntryEditPanel = ({ entry, body, updateHref, cancelHref }: EntryEditPanelProps) => {
  return (
    <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_18px_60px_-34px_rgba(2,6,23,0.9)]">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Editor</p>
          <h3 class="mt-2 text-xl font-semibold text-slate-50">Edit the selected entry</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            hx-post="/entries/preview"
            hx-include="#entry-edit-form"
            hx-target="#entry-preview-overlay"
            hx-swap="outerHTML"
          >
            Preview
          </button>
          <div class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            editing mode
          </div>
        </div>
      </div>

      <form
        id="entry-edit-form"
        class="mt-5 space-y-4"
        method="post"
        action={updateHref}
        hx-post={updateHref}
        hx-target="#journal-workspace"
        hx-swap="outerHTML"
        hx-push-url="true"
      >
        <label class="block space-y-2">
          <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Journal date</span>
          <input class="input w-full" type="date" name="journal_date" value={entry.journal_date} required />
        </label>

        <label class="block space-y-2">
          <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Title</span>
          <input class="input w-full" type="text" name="title" value={entry.title} placeholder="Untitled" />
        </label>

        <label class="block space-y-2">
          <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Summary</span>
          <textarea class="textarea min-h-28 w-full" name="summary" placeholder="Short summary">
            {entry.summary ?? ''}
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
            Save changes
          </button>
          <a {...createWorkspaceLinkAttrs(cancelHref, { target: '#journal-workspace' })} class="btn">
            Cancel
          </a>
        </div>
      </form>

    </section>
  )
}

export const EntryEditContentPane = (props: EntryEditPanelProps) => {
  return <JournalContentPane detailPane={<EntryEditPanel {...props} />} />
}
