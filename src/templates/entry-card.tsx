import { createWorkspaceLinkAttrs } from '../lib/htmx'
import type { JournalEntryRow } from '../types/journal'

type EntryCardProps = {
  entry: JournalEntryRow
  active?: boolean
  href?: string
}

export const EntryCard = ({ entry, active = false, href }: EntryCardProps) => {
  const classes = [
    'block rounded-xl border p-3 transition',
    active
      ? 'border-cyan-200/70 bg-cyan-300/15 shadow-[0_14px_36px_-24px_rgba(34,211,238,0.7)]'
      : 'border-slate-700 bg-slate-900/80 hover:border-slate-500 hover:bg-slate-800/90',
  ].join(' ')

  if (!href) {
    return (
      <article class={classes}>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-sm font-semibold text-slate-100">{entry.title || 'Untitled'}</h3>
          </div>
          <span class="mt-0.5 rounded-full border border-slate-600 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-200">
            {entry.status}
          </span>
        </div>
        <p class="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{entry.summary ?? 'No summary yet'}</p>
      </article>
    )
  }

  return (
    <a {...createWorkspaceLinkAttrs(href)} class={classes}>
      <article class={active ? 'cursor-default' : 'cursor-pointer'}>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-sm font-semibold text-slate-100">{entry.title || 'Untitled'}</h3>
          </div>
          <span class="mt-0.5 rounded-full border border-slate-600 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-200">
            {entry.status}
          </span>
        </div>
        <p class="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{entry.summary ?? 'No summary yet'}</p>
      </article>
    </a>
  )
}
