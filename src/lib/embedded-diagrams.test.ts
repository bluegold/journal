import { describe, expect, it } from 'vitest'
import { createEmbeddedDiagramPlaceholderHtml } from './embedded-diagram'
import { embeddedDiagramDefinitions } from './mermaid-diagram'

describe('embedded diagram definitions', () => {
  it('exposes the mermaid definition', () => {
    const definition = embeddedDiagramDefinitions[0]

    expect(definition).toMatchObject({
      language: 'mermaid',
      selector: '.mermaid',
      placeholderClassName: 'mermaid language-mermaid',
      dataLanguage: 'mermaid',
    })
  })

  it('renders a safe placeholder for a diagram source block', () => {
    const definition = embeddedDiagramDefinitions[0]

    const html = createEmbeddedDiagramPlaceholderHtml(definition, 'flowchart LR\n  A --> B')

    expect(html).toContain('class="mermaid language-mermaid"')
    expect(html).toContain('data-language="mermaid"')
    expect(html).toContain('flowchart LR')
    expect(html).toContain('A --&gt; B')
  })
})
