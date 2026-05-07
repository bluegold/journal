import { embeddedDiagramDefinitions } from '../lib/mermaid-diagram'

const serializedDefinitions = JSON.stringify(embeddedDiagramDefinitions)

export const embeddedDiagramsBootScript = `
(() => {
  const diagramDefinitions = ${serializedDefinitions}
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

  const renderEmbeddedDiagrams = async () => {
    const nodes = []

    for (const definition of diagramDefinitions) {
      for (const node of document.querySelectorAll(definition.selector)) {
        nodes.push(node)
      }
    }

    if (nodes.length === 0) return

    await Promise.all(nodes.map((node) => renderMermaidNode(node)))
  }

  document.addEventListener('DOMContentLoaded', () => {
    void renderEmbeddedDiagrams()
  })
})()
`
