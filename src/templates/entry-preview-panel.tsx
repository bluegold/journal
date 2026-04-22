import { renderMarkdown } from '../lib/render-markdown'

type EntryPreviewOverlayProps = {
  body: string
}

export const EntryPreviewSlot = () => {
  return <div id="entry-preview-overlay" class="hidden" aria-hidden="true" />
}

export const EntryPreviewOverlay = ({ body }: EntryPreviewOverlayProps) => {
  return (
    <section
      id="entry-preview-overlay"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <button
        type="button"
        class="absolute inset-0 z-0 cursor-default"
        aria-label="Close preview overlay"
        hx-get="/entries/preview/close"
        hx-target="#entry-preview-overlay"
        hx-swap="outerHTML"
      />

      <div class="relative z-10 mx-auto mt-6 w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-950/95 p-5 shadow-[0_30px_100px_-40px_rgba(15,23,42,0.95)]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">Preview</p>
            <h4 class="mt-2 text-lg font-semibold text-slate-50">Rendered markdown</h4>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">live</span>
            <button
              type="button"
              class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
              hx-get="/entries/preview/close"
              hx-target="#entry-preview-overlay"
              hx-swap="outerHTML"
            >
              Close
            </button>
          </div>
        </div>

        <div
          class="markdown-body mt-4 max-h-[calc(100vh-10rem)] overflow-x-auto overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/80 p-4"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
        />
      </div>

      <div
        class="sr-only"
        hx-get="/entries/preview/close"
        hx-trigger="keyup[key=='Escape'] from:body"
        hx-target="#entry-preview-overlay"
        hx-swap="outerHTML"
        aria-hidden="true"
      />
    </section>
  )
}
