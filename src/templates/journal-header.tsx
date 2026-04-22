import type { JournalUserRow } from '../types/journal'

type JournalHeaderProps = {
  currentUser: JournalUserRow
  menuItems: Array<{
    label: string
    href: string
  }>
}

export const JournalHeader = ({ currentUser, menuItems }: JournalHeaderProps) => {
  const avatarSrc = currentUser.avatar_url ?? '/unknown_avatar.png'

  return (
    <header class="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div class="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <img
            src="/favicon.png"
            alt=""
            aria-hidden="true"
            class="h-10 w-10 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 object-cover shadow-[0_12px_28px_-20px_rgba(34,211,238,0.7)]"
          />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold tracking-[0.2em] text-cyan-200/90 uppercase">Journal</p>
            <p class="truncate text-xs text-slate-400">Private server-rendered journal</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <div class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <img
              src={avatarSrc}
              alt=""
              aria-hidden="true"
              class="h-6 w-6 rounded-full object-cover"
            />
            <div class="min-w-0 text-right">
              <p class="truncate text-xs font-medium text-slate-100">{currentUser.name}</p>
              <p class="truncate text-[11px] text-slate-400">{currentUser.email}</p>
            </div>
          </div>

          {menuItems.map((item) => (
            <a
              href={item.href}
              class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
