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

export const formatTagList = (tagNames: string[]): string => {
  return tagNames.join(', ')
}
