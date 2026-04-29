export type EmbeddedDiagramDefinition = {
  language: string
  selector: string
  placeholderClassName: string
  dataLanguage: string
}

export const mermaidDiagram: EmbeddedDiagramDefinition = {
  language: 'mermaid',
  selector: '.mermaid',
  placeholderClassName: 'mermaid language-mermaid',
  dataLanguage: 'mermaid',
}

export const embeddedDiagramDefinitions: EmbeddedDiagramDefinition[] = [mermaidDiagram]

export const normalizeEmbeddedDiagramLanguage = (language: string | null | undefined): string | null => {
  const value = language?.trim().toLowerCase()
  if (!value) {
    return null
  }

  return value
}

export const findEmbeddedDiagramDefinition = (
  language: string | null | undefined
): EmbeddedDiagramDefinition | null => {
  const normalizedLanguage = normalizeEmbeddedDiagramLanguage(language)
  if (!normalizedLanguage) {
    return null
  }

  return embeddedDiagramDefinitions.find((definition) => definition.language === normalizedLanguage) ?? null
}

export const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export const createEmbeddedDiagramPlaceholderHtml = (
  definition: EmbeddedDiagramDefinition,
  code: string
): string => {
  return `<div class="${definition.placeholderClassName}" data-language="${definition.dataLanguage}">${escapeHtml(
    code
  )}</div>`
}
