import type { JournalEntryRow } from '../types/journal'

type EntryCardProps = {
  entry: JournalEntryRow
  active?: boolean
}

export const EntryCard = ({ entry, active = false }: EntryCardProps) => {
  return (
    <article
      class={[
        'rounded-2xl border p-3 transition',
        active
          ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_14px_36px_-24px_rgba(34,211,238,0.6)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]',
      ].join(' ')}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-sm font-semibold text-slate-100">{entry.title || 'Untitled'}</h3>
          <p class="mt-1 text-[11px] tracking-[0.18em] text-slate-500 uppercase">{entry.journal_date}</p>
        </div>
        <span class="mt-0.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
          {entry.status}
        </span>
      </div>
      <p class="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{entry.summary ?? 'No summary yet'}</p>
    </article>
  )
}
