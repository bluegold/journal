export const normalizeTagName = (value: string): string | null => {
  const normalized = value.trim().replace(/\s+/g, ' ')

  if (normalized.length === 0) {
    return null
  }

  return normalized.toLowerCase()
}

export const parseTagList = (value: string): string[] => {
  const seen = new Set<string>()
  const tags: string[] = []

  for (const rawPart of value.split(/[\n,]+/)) {
    const normalized = normalizeTagName(rawPart)
    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    tags.push(normalized)
  }

  return tags
}

export const splitTagInput = (value: string): { selectedTags: string[]; query: string } => {
  const normalized = value.replace(/\r\n/g, '\n')
  const lastSeparatorIndex = Math.max(normalized.lastIndexOf(','), normalized.lastIndexOf('\n'))

  if (lastSeparatorIndex < 0) {
    return {
      selectedTags: [],
      query: normalizeTagName(normalized) ?? '',
    }
  }

  const selectedTags = parseTagList(normalized.slice(0, lastSeparatorIndex + 1))
  const query = normalizeTagName(normalized.slice(lastSeparatorIndex + 1)) ?? ''

  return {
    selectedTags,
    query,
  }
}

export const formatTagList = (tagNames: string[]): string => {
  return tagNames.join(', ')
}
