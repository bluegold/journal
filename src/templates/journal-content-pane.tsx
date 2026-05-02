import type { Child } from 'hono/jsx'

type JournalContentPaneProps = {
  detailPane: Child
}

export const JournalContentPane = ({ detailPane }: JournalContentPaneProps) => {
  return (
    <section id="journal-content" class="min-w-0 space-y-4 lg:flex lg:min-h-[calc(100vh-112px)] lg:flex-col lg:space-y-4">
      {detailPane}
      <div id="entry-preview-overlay" class="hidden" aria-hidden="true" />
    </section>
  )
}
