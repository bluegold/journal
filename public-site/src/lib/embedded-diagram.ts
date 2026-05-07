export type EmbeddedDiagramDefinition = {
  language: string
  selector: string
  placeholderClassName: string
  dataLanguage: string
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
