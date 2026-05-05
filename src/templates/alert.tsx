import type { Child } from 'hono/jsx'

export type AlertTone = 'neutral' | 'success' | 'error'

const alertToneClassName = (tone: AlertTone): string => {
  switch (tone) {
    case 'success':
      return 'border border-cyan-300/40 bg-cyan-300/10 text-cyan-50'
    case 'error':
      return 'border border-rose-300/40 bg-rose-400/10 text-rose-100'
    default:
      return 'border border-dashed border-slate-700 bg-slate-900/70 text-slate-300'
  }
}

type AlertProps = {
  tone: AlertTone
  children: Child
  className?: string
}

export const Alert = ({ tone, children, className }: AlertProps) => {
  return (
    <div class={['alert', alertToneClassName(tone), className].filter(Boolean).join(' ')}>
      <section>{children}</section>
    </div>
  )
}
