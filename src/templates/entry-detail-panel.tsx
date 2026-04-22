import type { JournalEntryRow } from '../types/journal'
import { renderMarkdown } from '../lib/render-markdown'
import { createWorkspaceLinkAttrs } from '../lib/htmx'

type EntryDetailPanelProps = {
  entry: JournalEntryRow | null
  body: string | null
  editHref?: string | null
  deleteHref?: string | null
}

export const EntryDetailPanel = ({ entry, body, editHref, deleteHref }: EntryDetailPanelProps) => {
  if (!entry) {
    return (
      <section class="rounded-3xl border border-dashed border-white/10 bg-slate-950/70 p-6 text-slate-300">
        <p class="text-sm font-semibold tracking-[0.18em] text-cyan-200/80 uppercase">Content area</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-100">Select a journal entry</h2>
        <p class="mt-3 max-w-xl text-sm leading-6 text-slate-400">
          The workspace is reserved for the selected article detail. Once an entry is chosen, this area will show
          the article body, approved metadata, and edit controls.
        </p>
      </section>
    )
  }

  return (
    <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_18px_60px_-34px_rgba(2,6,23,0.9)]">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Selected article</p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-50">{entry.title || 'Untitled'}</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            {entry.journal_date}
          </span>
          {editHref ? (
            <a
              {...createWorkspaceLinkAttrs(editHref, {
                target: '#journal-content',
              })}
              class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            >
              Edit
            </a>
          ) : null}
          {deleteHref ? (
            <button
              type="button"
              class="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-100 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-white"
              hx-post={deleteHref}
              hx-confirm="Delete this entry?"
              hx-target="#journal-workspace"
              hx-swap="outerHTML"
              hx-push-url="true"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p class="text-[10px] tracking-[0.2em] text-slate-500 uppercase">Status</p>
          <p class="mt-1 text-sm text-slate-100">{entry.status}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p class="text-[10px] tracking-[0.2em] text-slate-500 uppercase">Body key</p>
          <p class="mt-1 break-all text-sm text-slate-100">{entry.body_key}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p class="text-[10px] tracking-[0.2em] text-slate-500 uppercase">Updated</p>
          <p class="mt-1 text-sm text-slate-100">{entry.updated_at}</p>
        </div>
      </div>

      <div class="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p class="text-xs font-semibold tracking-[0.18em] text-cyan-200/75 uppercase">Markdown body</p>
        {body ? (
          <div
            class="markdown-body mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 p-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
          />
        ) : (
          <div class="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <div class="h-3 w-4/5 rounded-full bg-white/10" />
            <div class="h-3 w-full rounded-full bg-white/10" />
            <div class="h-3 w-3/4 rounded-full bg-white/10" />
            <div class="h-3 w-5/6 rounded-full bg-white/10" />
            <div class="h-28 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-slate-500">
              R2 body preview will appear here.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
