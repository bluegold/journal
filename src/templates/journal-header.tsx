import type { JournalUserRow } from '../types/journal'
import { uiText } from '../lib/i18n'

type JournalHeaderProps = {
  currentUser: JournalUserRow
  menuItems: Array<{
    label: string
    href: string
  }>
}

export const JournalHeader = ({ currentUser, menuItems }: JournalHeaderProps) => {
  const avatarSrc = currentUser.avatar_url ?? '/unknown_avatar.png'
  const text = uiText.ja

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

          <img
            src={avatarSrc}
            alt={currentUser.name ?? 'User avatar'}
            title={currentUser.email ?? undefined}
            class="h-8 w-8 rounded-full border border-slate-600 object-cover"
          />
        </div>
      </div>
    </header>
  )
}
