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
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (() => {
            const getMermaid = () => window.mermaid
            let mermaidRenderScheduled = false

            const getRenderScope = (event) => {
              const scope = event?.detail?.elt ?? event?.target
              if (scope instanceof Element || scope instanceof DocumentFragment || scope instanceof Document) {
                return scope
              }

              return document
            }

            const renderMermaidNode = async (node) => {
              if (!(node instanceof Element)) return
              if (!node.matches('.mermaid')) return
              if (node.dataset.journalMermaidRendered === 'true') return

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

              try {
                await mermaid.run({ nodes: [node] })
                node.dataset.journalMermaidRendered = 'true'
              } catch (error) {
                console.error('Mermaid render failed', error)
              }
            }

            const renderMermaid = async (scope) => {
              const root = scope instanceof Element || scope instanceof DocumentFragment ? scope : document
              const nodes = Array.from(root.querySelectorAll('.mermaid'))
              if (nodes.length === 0) return

              await Promise.all(nodes.map((node) => renderMermaidNode(node)))
            }

            const scheduleMermaidRender = (scope) => {
              if (mermaidRenderScheduled) return

              mermaidRenderScheduled = true
              requestAnimationFrame(() => {
                mermaidRenderScheduled = false
                void renderMermaid(scope)
              })
            }

            document.addEventListener('DOMContentLoaded', () => {
              scheduleMermaidRender(document)
            })

            document.addEventListener('htmx:afterSwap', (event) => {
              scheduleMermaidRender(getRenderScope(event))
            })

            document.addEventListener('htmx:afterSettle', (event) => {
              scheduleMermaidRender(getRenderScope(event))
            })

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

            const observeMermaid = () => {
              const body = document.body
              if (!body) return

              const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  for (const addedNode of mutation.addedNodes) {
                    if (!(addedNode instanceof Element)) continue
                    if (addedNode.matches('.mermaid') || addedNode.querySelector('.mermaid')) {
                      scheduleMermaidRender(addedNode)
                      return
                    }
                  }
                }
              })

              observer.observe(body, { childList: true, subtree: true })
            }

            if (document.body) {
              observeMermaid()
            } else {
              document.addEventListener('DOMContentLoaded', observeMermaid, { once: true })
            }
          })()
        `,
          }}
        />
      </body>
    </html>
  )
}
