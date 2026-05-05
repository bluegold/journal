import { JournalHeader } from '../journal-header'
import { Alert } from '../alert'
import { CalendarMonth } from '../calendar-month'
import { EntryCard } from '../entry-card'
import type { JournalTagStat } from '../../lib/tag-stats'
import type { SearchEntryMatch } from '../../lib/search'
import { buildEntriesHref } from '../../lib/entries-navigation'
import { normalizeTagName } from '../../lib/tags'
import type { CalendarMonthView } from '../calendar-month'
import type { JournalUserRow } from '../../types/journal'
import type { JournalConfig } from '../../lib/journal-config'
import { uiText } from '../../lib/i18n'

type SearchPageProps = {
  currentUser: JournalUserRow
  calendarView: CalendarMonthView
  query: string
  tag: string
  month: string
  date: string
  results: SearchEntryMatch[]
  tagStats: JournalTagStat[]
  journalConfig: JournalConfig
}

const buildSearchHref = (options: {
  query?: string
  tag?: string
  month?: string
  date?: string
}): string => {
  const params = new URLSearchParams()
  const queryValue = options.query?.trim() ?? ''
  const tagValue = options.tag?.trim() ?? ''
  const monthValue = options.month?.trim() ?? ''
  const dateValue = options.date?.trim() ?? ''

  if (queryValue.length > 0) {
    params.set('q', queryValue)
  }

  if (tagValue.length > 0) {
    params.set('tag', tagValue)
  }

  if (monthValue.length > 0) {
    params.set('month', monthValue)
  }

  if (dateValue.length > 0) {
    params.set('date', dateValue)
  }

  const serialized = params.toString()
  return serialized.length > 0 ? `/search?${serialized}` : '/search'
}

const buildTagHref = (query: string, tag: string, month: string, date: string): string => {
  return buildSearchHref({ query, tag, month, date })
}

export const SearchPage = ({ currentUser, calendarView, query, tag, month, date, results, tagStats, journalConfig }: SearchPageProps) => {
  return (
    <SearchPageShell
      currentUser={currentUser}
      calendarView={calendarView}
      query={query}
      tag={tag}
      month={month}
      date={date}
      results={results}
      tagStats={tagStats}
      journalConfig={journalConfig}
    />
  )
}

export const SearchContentPane = (props: SearchPageProps) => {
  const { currentUser: _currentUser, calendarView, query, tag, month, date, results, tagStats } = props
  return (
    <div id="search-workspace" class="min-h-screen">
      <SearchWorkspace
        calendarView={calendarView}
        query={query}
        tag={tag}
        month={month}
        date={date}
        results={results}
        tagStats={tagStats}
      />
    </div>
  )
}

const SearchPageShell = ({ currentUser, calendarView, query, tag, month, date, results, tagStats, journalConfig }: SearchPageProps) => {
  const text = uiText.ja

  return (
    <div class="min-h-screen">
      <JournalHeader
        currentUser={currentUser}
        menuItems={[
          { label: text.nav.entries, href: '/entries' },
          { label: text.nav.search, href: '/search' },
        ]}
        journalConfig={journalConfig}
      />

      <div id="search-workspace" class="min-h-screen">
        <SearchWorkspace
          calendarView={calendarView}
          query={query}
          tag={tag}
          month={month}
          date={date}
          results={results}
          tagStats={tagStats}
        />
      </div>
    </div>
  )
}

const SearchWorkspace = ({ calendarView, query, tag, month, date, results, tagStats }: Omit<SearchPageProps, 'currentUser' | 'journalConfig'>) => {
  const normalizedTag = normalizeTagName(tag) ?? ''
  const hasActiveFilters = query.trim().length > 0 || normalizedTag.length > 0 || month.trim().length > 0 || date.trim().length > 0
  const text = uiText.ja

  return (
    <main class="mx-auto w-full max-w-[1680px] px-3 py-3 sm:px-4 lg:px-5">
      <div class="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside class="space-y-3 lg:sticky lg:top-[64px] lg:h-[calc(100vh-76px)] lg:overflow-y-auto lg:pr-1">
          <CalendarMonth view={calendarView} linkTarget="#search-workspace" />
        </aside>

        <div class="space-y-4">
          <section class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-[0_18px_54px_-36px_rgba(2,6,23,0.95)]">
            <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Search</p>
            <h1 class="mt-1 text-2xl font-semibold text-slate-50">{text.search.title}</h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{text.search.description}</p>

            <form class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]" method="get" action="/search">
              {month.trim().length > 0 ? <input type="hidden" name="month" value={month} /> : null}
              {date.trim().length > 0 ? <input type="hidden" name="date" value={date} /> : null}
              <label class="block space-y-1.5">
                <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">{text.search.freeTextLabel}</span>
                <input class="input w-full" type="search" name="q" value={query} placeholder={text.search.placeholderFreeText} />
              </label>

              <label class="block space-y-1.5">
                <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">{text.search.tagLabel}</span>
                <input class="input w-full" type="search" name="tag" value={normalizedTag} placeholder={text.search.placeholderTag} />
              </label>

              <div class="button-group flex w-full items-end lg:w-auto">
                <button type="submit" class="btn btn-primary flex-1 lg:flex-none">
                  {text.search.search}
                </button>
                {hasActiveFilters ? (
                  <a href="/search" class="btn btn-outline flex-1 lg:flex-none">
                    {text.search.clear}
                  </a>
                ) : null}
              </div>
            </form>

            {tagStats.length > 0 ? (
              <div class="mt-4">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">{text.search.popularTags}</span>
                  {tagStats.slice(0, 12).map((tagStat) => (
                    <a
                      href={buildTagHref(query, tagStat.name, month, date)}
                      class={[
                        'badge transition',
                        normalizedTag === tagStat.name
                          ? 'badge-primary'
                          : 'badge-outline hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white',
                      ].join(' ')}
                    >
                      {tagStat.name} <span class="ml-1 opacity-70">{tagStat.usage_count}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section id="search-results" class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Results</p>
                <div class="mt-1 flex items-center gap-3">
                  <h2 class="text-lg font-semibold text-slate-50">{text.search.search}</h2>
                  <span class="badge badge-secondary">
                    {text.search.resultCount.replace('{{count}}', `${results.length}`)}
                  </span>
                </div>
              </div>
              <p class="text-sm text-slate-400">
                {text.search.queryLabel}: <span class="text-slate-200">{query || 'all'}</span>
                {' · '}
                {text.search.tagFilterLabel}: <span class="text-slate-200">{normalizedTag || 'all'}</span>
                {' · '}
                <span class="text-slate-200">{date.trim().length > 0 ? date : month || 'all'}</span>
              </p>
            </div>

            {results.length > 0 ? (
              <div class="mt-4 grid gap-3">
                {results.map((result) => (
                  <EntryCard
                    entry={result.entry}
                    showDate
                    href={buildEntriesHref({
                      monthKey: result.entry.journal_date.slice(0, 7),
                      dateKey: result.entry.journal_date,
                      entryId: result.entry.id,
                    })}
                  />
                ))}
              </div>
            ) : (
              <Alert tone="neutral" className="mt-4">
                  <p>{text.search.noMatches}</p>
              </Alert>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
