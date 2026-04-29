import { embeddedDiagramDefinitions } from '../lib/mermaid-diagram'

const serializedDefinitions = JSON.stringify(embeddedDiagramDefinitions)

export const embeddedDiagramsBootScript = `
(() => {
  const diagramDefinitions = ${serializedDefinitions}
  let mermaidInitialized = false
  let renderScheduled = false
  let pendingScope = null

  const getMermaid = () => window.mermaid

  const getRenderScope = (event) => {
    const scope = event?.detail?.elt ?? event?.target
    if (scope instanceof Element || scope instanceof DocumentFragment || scope instanceof Document) {
      return scope
    }

    return document
  }

  const initializeMermaid = () => {
    const mermaid = getMermaid()
    if (!mermaid || mermaidInitialized) {
      return mermaid
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
    })
    mermaidInitialized = true
    return mermaid
  }

  const renderMermaidNode = async (node) => {
    if (!(node instanceof Element)) return
    if (node.dataset.embeddedDiagramRendered === 'true') return

    const mermaid = initializeMermaid()
    if (!mermaid) return

    try {
      await mermaid.run({ nodes: [node] })
      node.dataset.embeddedDiagramRendered = 'true'
    } catch (error) {
      console.error('Mermaid render failed', error)
    }
  }

  const renderEmbeddedDiagrams = async (scope) => {
    const root = scope instanceof Element || scope instanceof DocumentFragment ? scope : document
    const nodes = []

    for (const definition of diagramDefinitions) {
      for (const node of root.querySelectorAll(definition.selector)) {
        nodes.push(node)
      }
    }

    if (nodes.length === 0) return

    await Promise.all(nodes.map((node) => renderMermaidNode(node)))
  }

  const scheduleRender = (scope) => {
    pendingScope = scope ?? document

    if (renderScheduled) {
      return
    }

    renderScheduled = true
    requestAnimationFrame(() => {
      renderScheduled = false
      const nextScope = pendingScope ?? document
      pendingScope = null
      void renderEmbeddedDiagrams(nextScope)
    })
  }

  const observeEmbeddedDiagrams = () => {
    const body = document.body
    if (!body) return

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (!(addedNode instanceof Element)) continue

          for (const definition of diagramDefinitions) {
            if (addedNode.matches(definition.selector) || addedNode.querySelector(definition.selector)) {
              scheduleRender(addedNode)
              return
            }
          }
        }
      }
    })

    observer.observe(body, { childList: true, subtree: true })
  }

  document.addEventListener('DOMContentLoaded', () => {
    scheduleRender(document)
    observeEmbeddedDiagrams()
  })

  document.addEventListener('htmx:afterSwap', (event) => {
    scheduleRender(getRenderScope(event))
  })

  document.addEventListener('htmx:afterSettle', (event) => {
    scheduleRender(getRenderScope(event))
  })
})()
`
