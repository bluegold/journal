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
      </head>
      <body class="min-h-screen bg-background text-foreground antialiased [color-scheme:dark]">
        <div class="min-h-screen">{children}</div>
        <script>{`
          (() => {
            const closePreviewOverlay = async () => {
              const overlay = document.getElementById('entry-preview-overlay')
              if (!overlay || overlay.classList.contains('hidden')) return

              const response = await fetch('/entries/preview/close', {
                headers: { 'HX-Request': 'true' },
              })
              const html = await response.text()
              overlay.outerHTML = html
            }

            document.addEventListener('click', (event) => {
              const overlay = document.getElementById('entry-preview-overlay')
              if (!overlay || overlay.classList.contains('hidden')) return

              if (event.target === overlay) {
                closePreviewOverlay()
              }
            })

            document.addEventListener('keydown', (event) => {
              if (event.key === 'Escape') {
                void closePreviewOverlay()
              }
            })
          })()
        `}</script>
      </body>
    </html>
  )
}
