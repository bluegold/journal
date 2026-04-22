import type { JournalEntryRow } from '../types/journal'

type EntryDetailPanelProps = {
  entry: JournalEntryRow | null
}

export const EntryDetailPanel = ({ entry }: EntryDetailPanelProps) => {
  if (!entry) {
    return (
      <section class="rounded-3xl border border-dashed border-white/10 bg-slate-950/70 p-6 text-slate-300">
        <p class="text-sm font-semibold tracking-[0.18em] text-cyan-200/80 uppercase">Content area</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-100">Select a journal entry</h2>
        <p class="mt-3 max-w-xl text-sm leading-6 text-slate-400">
          The workspace is reserved for the selected article detail and editor. Once an entry is chosen, this area
          will show the article body, approved metadata, and edit controls.
        </p>
      </section>
    )
  }

  return (
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_18px_60px_-34px_rgba(2,6,23,0.9)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Selected article</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-50">{entry.title || 'Untitled'}</h2>
          </div>
          <span class="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            {entry.journal_date}
          </span>
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
          <div class="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <div class="h-3 w-4/5 rounded-full bg-white/10" />
            <div class="h-3 w-full rounded-full bg-white/10" />
            <div class="h-3 w-3/4 rounded-full bg-white/10" />
            <div class="h-3 w-5/6 rounded-full bg-white/10" />
            <div class="h-28 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-slate-500">
              R2 body preview will appear here.
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_18px_60px_-34px_rgba(2,6,23,0.9)]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Editor</p>
            <h3 class="mt-2 text-xl font-semibold text-slate-50">Edit the selected entry</h3>
          </div>
          <div class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            draft wireframe
          </div>
        </div>

        <form class="mt-5 space-y-4">
          <label class="block space-y-2">
            <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Title</span>
            <input class="input w-full" type="text" value={entry.title} readOnly />
          </label>

          <label class="block space-y-2">
            <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Summary</span>
            <textarea class="textarea min-h-28 w-full" readOnly>
              {entry.summary ?? ''}
            </textarea>
          </label>

          <label class="block space-y-2">
            <span class="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">Markdown</span>
            <textarea class="textarea min-h-60 w-full font-mono text-sm leading-6" readOnly>
              {`# ${entry.title || 'Untitled'}\n\nWrite markdown here.\n\n- task 1\n- task 2`}
            </textarea>
          </label>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary">
              Save
            </button>
            <button type="button" class="btn">
              Preview
            </button>
            <button type="button" class="btn">
              Delete
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
