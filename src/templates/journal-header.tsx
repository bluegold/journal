import type { JournalUserRow } from '../types/journal'
import type { JournalConfig } from '../lib/journal-config'
import { uiText } from '../lib/i18n'

type JournalHeaderProps = {
  currentUser: JournalUserRow
  menuItems: Array<{
    label: string
    href: string
  }>
  journalConfig: JournalConfig
}

export const JournalHeader = ({ currentUser, menuItems, journalConfig }: JournalHeaderProps) => {
  const avatarSrc = currentUser.avatar_url ?? '/unknown_avatar.png'
  const text = uiText.ja
  const userMenuId = 'journal-user-menu'
  const logoutButton = journalConfig.logoutHref ? (
    <a href={journalConfig.logoutHref} class="btn btn-sm btn-outline w-full justify-center">
      {text.nav.logout}
    </a>
  ) : (
    <button type="button" class="btn btn-sm btn-outline w-full justify-center" disabled>
      {text.nav.logout}
    </button>
  )

  return (
    <header class="sticky top-0 z-30 border-b border-slate-700/80 bg-slate-950/95 backdrop-blur-xl">
      <div class="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-3 py-2 sm:px-4 lg:px-5">
        <a href="/" class="flex min-w-0 items-center gap-3">
          <img
            src="/favicon.png"
            alt=""
            aria-hidden="true"
            class="h-8 w-8 border border-cyan-300/40 bg-cyan-400/10 object-cover shadow-[0_12px_28px_-20px_rgba(34,211,238,0.7)]"
            style="border-radius: var(--radius)"
          />
          <p class="truncate text-sm font-semibold tracking-[0.18em] text-cyan-100 uppercase">{text.misc.journal}</p>
        </a>

        <div class="flex items-center gap-3">
          {menuItems.map((item) => (
            <a
              href={item.href}
              class="btn btn-sm btn-outline"
            >
              {item.label}
            </a>
          ))}

          <button
            type="button"
            popovertarget={userMenuId}
            popovertargetaction="toggle"
            class="flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-left transition hover:border-cyan-300/40 hover:bg-slate-900"
            style="anchor-name: --journal-user-menu;"
          >
            <img
              src={avatarSrc}
              alt={currentUser.name ?? 'User avatar'}
              class="h-8 w-8 rounded-full border border-slate-600 object-cover"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-100">{currentUser.name}</p>
              <p class="truncate text-xs text-slate-400">{currentUser.email}</p>
            </div>
          </button>

          <div
            id={userMenuId}
            popover="auto"
            class="m-0 w-[280px] border border-slate-700/90 bg-slate-950 p-3 text-slate-100 shadow-[0_20px_60px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl"
            style="border-radius: var(--radius); position: fixed; position-anchor: --journal-user-menu; position-area: bottom right;"
          >
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <img
                  src={avatarSrc}
                  alt={currentUser.name ?? 'User avatar'}
                  class="h-10 w-10 rounded-full border border-slate-600 object-cover"
                />
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-slate-50">{currentUser.name}</p>
                  <p class="truncate text-xs text-slate-400">{currentUser.email}</p>
                </div>
              </div>

              {logoutButton}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
