import { JournalHeader } from '../journal-header'
import { EntryCard } from '../entry-card'
import type { JournalTagStat } from '../../lib/tag-stats'
import type { SearchEntryMatch } from '../../lib/search'
import { buildEntriesHref } from '../../lib/entries-navigation'
import { normalizeTagName } from '../../lib/tags'
import type { JournalUserRow } from '../../types/journal'

type SearchPageProps = {
  currentUser: JournalUserRow
  query: string
  tag: string
  results: SearchEntryMatch[]
  tagStats: JournalTagStat[]
}

const buildTagHref = (query: string, tag: string): string => {
  const params = new URLSearchParams()

  if (query.trim().length > 0) {
    params.set('q', query)
  }

  if (tag.trim().length > 0) {
    params.set('tag', tag)
  }

  const serialized = params.toString()
  return serialized.length > 0 ? `/search?${serialized}` : '/search'
}

export const SearchPage = ({ currentUser, query, tag, results, tagStats }: SearchPageProps) => {
  const normalizedTag = normalizeTagName(tag) ?? ''
  const hasActiveFilters = query.trim().length > 0 || normalizedTag.length > 0

  return (
    <div class="min-h-screen">
      <JournalHeader
        currentUser={currentUser}
        menuItems={[
          { label: 'Entries', href: '/entries' },
          { label: 'Search', href: '/search' },
        ]}
      />

      <main class="mx-auto w-full max-w-[1200px] px-3 py-4 sm:px-4 lg:px-5">
        <section class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-[0_18px_54px_-36px_rgba(2,6,23,0.95)]">
          <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Search</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-50">Find entries</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Search approved metadata only: title, summary, and approved tags.
          </p>

          <form class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]" method="get" action="/search">
            <label class="block space-y-1.5">
              <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">Free text</span>
              <input class="input w-full" type="search" name="q" value={query} placeholder="meeting, idea, project..." />
            </label>

            <label class="block space-y-1.5">
              <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">Tag</span>
              <input class="input w-full" type="search" name="tag" value={normalizedTag} placeholder="work" />
            </label>

            <div class="flex items-end gap-2">
              <button type="submit" class="btn btn-primary w-full lg:w-auto">
                Search
              </button>
              {hasActiveFilters ? (
                <a href="/search" class="btn w-full lg:w-auto">
                  Clear
                </a>
              ) : null}
            </div>
          </form>

          {tagStats.length > 0 ? (
            <div class="mt-4">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">Popular tags</span>
                {tagStats.slice(0, 12).map((tagStat) => (
                  <a
                    href={buildTagHref(query, tagStat.name)}
                    class={[
                      'rounded-full border px-3 py-1 text-xs transition',
                      normalizedTag === tagStat.name
                        ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-50'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white',
                    ].join(' ')}
                  >
                    {tagStat.name} <span class="text-slate-400">{tagStat.usage_count}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section id="search-results" class="mt-4 rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Results</p>
              <h2 class="mt-1 text-lg font-semibold text-slate-50">{results.length} entries</h2>
            </div>
            <p class="text-sm text-slate-400">
              q: <span class="text-slate-200">{query || 'all'}</span>
              {' · '}
              tag: <span class="text-slate-200">{normalizedTag || 'all'}</span>
            </p>
          </div>

          {results.length > 0 ? (
            <div class="mt-4 grid gap-3">
              {results.map((result) => (
                <EntryCard
                  entry={result.entry}
                  href={buildEntriesHref({
                    monthKey: result.entry.journal_date.slice(0, 7),
                    dateKey: result.entry.journal_date,
                    entryId: result.entry.id,
                  })}
                />
              ))}
            </div>
          ) : (
            <div class="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
              No matches.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
