import type { JournalEntryRow } from '../types/journal'
import { createWorkspaceLinkAttrs } from '../lib/htmx'

type EntryDetailPanelProps = {
  entry: JournalEntryRow | null
  renderedBodyHtml: string | null
  entryTags: string[]
  editHref?: string | null
  deleteHref?: string | null
}

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export const EntryDetailPanel = ({ entry, renderedBodyHtml, entryTags, editHref, deleteHref }: EntryDetailPanelProps) => {
  if (!entry) {
    return (
      <section class="rounded-2xl border border-dashed border-slate-700 bg-slate-950/90 p-4 text-slate-300">
        <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Content area</p>
        <h2 class="mt-1 text-lg font-semibold text-slate-50">Select a journal entry</h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Pick a day on the calendar and select an entry from the list, or start a new one with the <strong class="font-medium text-slate-200">+ New</strong> button.
        </p>
      </section>
    )
  }

  return (
    <section class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-[0_18px_54px_-36px_rgba(2,6,23,0.95)]">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Selected article</p>
          <div class="mt-1 flex min-w-0 items-center gap-2">
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full border border-cyan-200/70 bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.55)]"
              title={`Status: ${entry.status}`}
            />
            <h2 class="truncate text-2xl font-semibold text-slate-50">{entry.title || 'Untitled'}</h2>
          </div>
        </div>
        <div class="text-right">
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="rounded-full border border-cyan-300/50 bg-cyan-300/15 px-3 py-1 text-xs text-cyan-50">
              {entry.journal_date}
            </span>
            {editHref ? (
              <a
                {...createWorkspaceLinkAttrs(editHref, {
                  target: '#journal-content',
                })}
                class="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white"
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
          <p class="mt-1 text-[11px] text-slate-400">Updated {formatTimestamp(entry.updated_at)}</p>
        </div>
      </div>

      <div class="mt-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[10px] font-semibold tracking-[0.2em] text-cyan-100 uppercase">Markdown body</p>
          {entryTags.length > 0 ? (
            <div class="flex flex-wrap items-center justify-end gap-1.5">
              <span class="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">Tags</span>
              {entryTags.map((tagName) => (
                <a
                  href={`/search?tag=${encodeURIComponent(tagName)}`}
                  class="rounded-full border border-cyan-300/40 bg-cyan-300/15 px-2.5 py-0.5 text-[11px] text-cyan-50 transition hover:border-cyan-200/70 hover:bg-cyan-300/25 hover:text-white"
                >
                  {tagName}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        {renderedBodyHtml ? (
          <div
            class="markdown-body mt-2 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/80 p-4"
            dangerouslySetInnerHTML={{ __html: renderedBodyHtml }}
          />
        ) : (
          <div class="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <div class="h-3 w-4/5 rounded-full bg-white/10" />
            <div class="h-3 w-full rounded-full bg-white/10" />
            <div class="h-3 w-3/4 rounded-full bg-white/10" />
            <div class="h-3 w-5/6 rounded-full bg-white/10" />
            <div class="h-28 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4 font-mono text-xs text-slate-400">
              R2 body preview will appear here.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
