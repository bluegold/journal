import type { Child } from 'hono/jsx'

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
        <script
          src="https://unpkg.com/htmx.org@2.0.4"
          integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+"
          crossOrigin="anonymous"
        />
        <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js" crossOrigin="anonymous" />
      </head>
      <body class="min-h-screen bg-background text-foreground antialiased [color-scheme:dark]">
        <div class="min-h-screen">{children}</div>
        <script>{`
          (() => {
            const getMermaid = () => window.mermaid

            const renderMermaid = async (scope) => {
              const mermaid = getMermaid()
              if (!mermaid) return

              if (!window.__journalMermaidInitialized) {
                mermaid.initialize({
                  startOnLoad: false,
                  theme: 'dark',
                  securityLevel: 'strict',
                })
                window.__journalMermaidInitialized = true
              }

              const root = scope instanceof Element ? scope : document
              const nodes = Array.from(root.querySelectorAll('.mermaid'))
              if (nodes.length === 0) return

              try {
                await mermaid.run({ nodes })
              } catch (error) {
                console.error('Mermaid render failed', error)
              }
            }

            document.addEventListener('DOMContentLoaded', () => {
              void renderMermaid(document)
            })

            document.addEventListener('htmx:load', (event) => {
              void renderMermaid(event.target)
            })
          })()
        `}</script>
      </body>
    </html>
  )
}
