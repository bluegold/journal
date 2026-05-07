(() => {
  const diagramSelector = '.mermaid'
  let mermaidInitialized = false

  const getMermaid = () => window.mermaid

  const initializeMermaid = () => {
    const mermaid = getMermaid()
    if (!mermaid || mermaidInitialized) {
      return mermaid
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        background: 'transparent',
        primaryColor: '#5b3a29',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#d6b08c',
        secondaryColor: '#334155',
        secondaryTextColor: '#f8fafc',
        secondaryBorderColor: '#94a3b8',
        tertiaryColor: '#0f172a',
        tertiaryTextColor: '#e2e8f0',
        tertiaryBorderColor: '#64748b',
        lineColor: '#cbd5e1',
        textColor: '#f8fafc',
        actorBkg: '#5b3a29',
        actorBorder: '#d6b08c',
        actorTextColor: '#f8fafc',
        noteBkgColor: '#1e293b',
        noteBorderColor: '#94a3b8',
        noteTextColor: '#f8fafc',
        signalColor: '#cbd5e1',
        signalTextColor: '#f8fafc',
        loopTextColor: '#e2e8f0',
        labelBoxBkgColor: '#0f172a',
        labelBoxBorderColor: '#64748b',
        labelTextColor: '#f8fafc',
        activationBkgColor: '#5b3a29',
        activationBorderColor: '#d6b08c',
        sequenceNumberColor: '#f8fafc',
      },
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

  const renderEmbeddedDiagrams = async (root) => {
    const scope = root instanceof Element || root instanceof DocumentFragment ? root : document
    const nodes = Array.from(scope.querySelectorAll(diagramSelector))

    if (nodes.length === 0) return

    await Promise.all(nodes.map((node) => renderMermaidNode(node)))
  }

  const scheduleRender = (() => {
    let scheduled = false
    let pendingRoot = null

    return (root) => {
      pendingRoot = root ?? document

      if (scheduled) return

      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        const nextRoot = pendingRoot ?? document
        pendingRoot = null
        void renderEmbeddedDiagrams(nextRoot)
      })
    }
  })()

  const observeEmbeddedDiagrams = () => {
    const body = document.body
    if (!body) return

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (!(addedNode instanceof Element)) continue

          if (addedNode.matches(diagramSelector) || addedNode.querySelector(diagramSelector)) {
            scheduleRender(addedNode)
            return
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
})()
