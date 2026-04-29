import { describe, expect, it } from 'vitest'
import { embeddedDiagramsBootScript } from './embedded-diagrams-script'

describe('embedded diagrams boot script', () => {
  it('includes browser redraw triggers and mermaid rendering', () => {
    expect(embeddedDiagramsBootScript).toContain('MutationObserver')
    expect(embeddedDiagramsBootScript).toContain('htmx:afterSwap')
    expect(embeddedDiagramsBootScript).toContain('htmx:afterSettle')
    expect(embeddedDiagramsBootScript).toContain('mermaid.run')
    expect(embeddedDiagramsBootScript).toContain('.mermaid')
  })
})
