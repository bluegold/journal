import { describe, expect, it } from 'vitest'
import { createEmbeddedDiagramPlaceholderHtml, findEmbeddedDiagramDefinition } from './embedded-diagrams'

describe('embedded diagram definitions', () => {
  it('finds the mermaid definition by language', () => {
    const definition = findEmbeddedDiagramDefinition('mermaid')

    expect(definition).toMatchObject({
      language: 'mermaid',
      selector: '.mermaid',
      placeholderClassName: 'mermaid language-mermaid',
      dataLanguage: 'mermaid',
    })
  })

  it('renders a safe placeholder for a diagram source block', () => {
    const definition = findEmbeddedDiagramDefinition('mermaid')
    if (!definition) {
      throw new Error('Expected mermaid definition')
    }

    const html = createEmbeddedDiagramPlaceholderHtml(definition, 'flowchart LR\n  A --> B')

    expect(html).toContain('class="mermaid language-mermaid"')
    expect(html).toContain('data-language="mermaid"')
    expect(html).toContain('flowchart LR')
    expect(html).toContain('A --&gt; B')
  })
})
