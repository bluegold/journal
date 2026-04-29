import type { EmbeddedDiagramDefinition } from './embedded-diagram'

export const mermaidDiagram: EmbeddedDiagramDefinition = {
  language: 'mermaid',
  selector: '.mermaid',
  placeholderClassName: 'mermaid language-mermaid',
  dataLanguage: 'mermaid',
}

export const embeddedDiagramDefinitions: EmbeddedDiagramDefinition[] = [mermaidDiagram]
