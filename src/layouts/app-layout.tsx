import type { Child } from 'hono/jsx'
import { embeddedDiagramsBootScript } from '../client/embedded-diagrams-script'

type AppLayoutProps = {
  title: string
  children: Child
}

export const AppLayout = ({ title, children }: AppLayoutProps) => {
  return (
    <html lang="ja" class="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#020617" />
        <title>{title}</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="stylesheet" href="/app.css" />
        <script type="module" src="/markdown-editor.mjs" />
        <script
          src="https://unpkg.com/htmx.org@2.0.4"
          integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+"
          crossOrigin="anonymous"
        />
        <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js" crossOrigin="anonymous" />
      </head>
      <body class="min-h-screen bg-background text-foreground antialiased [color-scheme:dark]">
        <div class="min-h-screen">{children}</div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (() => {
            const focusTagInputEnd = (scope) => {
              const root = scope instanceof Element ? scope : document
              const textarea = root.querySelector('textarea[data-focus-end="true"]')
              if (!(textarea instanceof HTMLTextAreaElement)) return

              requestAnimationFrame(() => {
                textarea.focus()
                const end = textarea.value.length
                textarea.setSelectionRange(end, end)
                textarea.removeAttribute('data-focus-end')
              })
            }

            document.addEventListener('DOMContentLoaded', () => {
              focusTagInputEnd(document)
            })

            document.addEventListener('htmx:load', (event) => {
              focusTagInputEnd(event.target)
            })
          })()
        `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: embeddedDiagramsBootScript,
          }}
        />
      </body>
    </html>
  )
}
