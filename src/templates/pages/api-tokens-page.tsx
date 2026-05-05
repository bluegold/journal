import { JournalHeader } from '../journal-header'
import { Alert } from '../alert'
import type { JournalConfig } from '../../lib/journal-config'
import { uiText } from '../../lib/i18n'
import type { JournalApiTokenRow, JournalUserRow } from '../../types/journal'

type ApiTokensPageProps = {
  currentUser: JournalUserRow
  apiTokens: JournalApiTokenRow[]
  journalConfig: JournalConfig
  createdToken?: string
  createdTokenName?: string
  errorMessage?: string
}

const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return uiText.ja.apiTokens.neverUsed
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const ApiTokensPage = ({
  currentUser,
  apiTokens,
  journalConfig,
  createdToken,
  createdTokenName,
  errorMessage,
}: ApiTokensPageProps) => {
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

      <main class="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 lg:px-5">
        <div class="space-y-4">
          <section class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-[0_18px_54px_-36px_rgba(2,6,23,0.95)]">
            <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Settings</p>
            <h1 class="mt-1 text-2xl font-semibold text-slate-50">{text.apiTokens.title}</h1>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{text.apiTokens.description}</p>
          </section>

          {createdToken ? (
            <Alert tone="success">
              <div class="space-y-3">
                <p class="font-semibold">{text.apiTokens.created.replace('{{name}}', createdTokenName ?? '')}</p>
                <p class="text-sm text-cyan-100">{text.apiTokens.createdHelp}</p>
                <code class="block overflow-x-auto rounded-xl border border-cyan-300/30 bg-slate-950 px-3 py-3 font-mono text-sm text-cyan-100">
                  {createdToken}
                </code>
              </div>
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert tone="error">
              <p>{errorMessage}</p>
            </Alert>
          ) : null}

          <section class="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <div class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4">
              <h2 class="text-lg font-semibold text-slate-50">{text.apiTokens.createTitle}</h2>
              <p class="mt-2 text-sm leading-6 text-slate-300">{text.apiTokens.createDescription}</p>

              <form method="post" action="/settings/api-tokens" class="mt-4 space-y-3">
                <label class="block space-y-1.5">
                  <span class="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase">{text.apiTokens.nameLabel}</span>
                  <input
                    class="input w-full"
                    type="text"
                    name="name"
                    placeholder={text.apiTokens.namePlaceholder}
                    maxLength={80}
                  />
                </label>

                <button type="submit" class="btn btn-primary w-full">
                  {text.apiTokens.createAction}
                </button>
              </form>
            </div>

            <div class="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4">
              <div class="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.22em] text-cyan-100 uppercase">Tokens</p>
                  <h2 class="mt-1 text-lg font-semibold text-slate-50">{text.apiTokens.listTitle}</h2>
                </div>
                <span class="badge badge-secondary">{apiTokens.length}</span>
              </div>

              {apiTokens.length > 0 ? (
                <div class="mt-4 overflow-x-auto">
                  <table class="table w-full min-w-[720px]">
                    <thead>
                      <tr class="text-slate-400">
                        <th>{text.apiTokens.nameLabel}</th>
                        <th>Prefix</th>
                        <th>{text.apiTokens.createdAt}</th>
                        <th>{text.apiTokens.lastUsedAt}</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiTokens.map((apiToken) => (
                        <tr class="border-slate-800">
                          <td class="font-medium text-slate-100">{apiToken.name}</td>
                          <td class="font-mono text-sm text-slate-300">{apiToken.token_prefix}…</td>
                          <td class="text-sm text-slate-300">{formatTimestamp(apiToken.created_at)}</td>
                          <td class="text-sm text-slate-300">
                            {apiToken.last_used_at ? (
                              formatTimestamp(apiToken.last_used_at)
                            ) : (
                              <span class="badge badge-outline">{text.apiTokens.neverUsed}</span>
                            )}
                          </td>
                          <td class="text-right">
                            <form method="post" action={`/settings/api-tokens/${apiToken.id}/delete`}>
                              <button type="submit" class="btn btn-sm btn-outline text-rose-100 hover:bg-rose-400/10">
                                {text.apiTokens.deleteAction}
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert tone="neutral" className="mt-4">
                  <p>{text.apiTokens.empty}</p>
                </Alert>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
