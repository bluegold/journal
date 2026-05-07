function normalizeHeadingText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function stripRedundantLeadingHeading(markdown: string, title: string) {
  const match = markdown.match(/^\s*#\s+(.+?)(?:\s+#+)?\s*(?:\r?\n|$)/)

  if (!match) {
    return markdown
  }

  const headingText = match[1] ?? ''
  const normalizedHeading = normalizeHeadingText(headingText)
  const normalizedTitle = normalizeHeadingText(title)

  if (
    normalizedHeading === normalizedTitle ||
    normalizedHeading.includes(normalizedTitle) ||
    normalizedTitle.includes(normalizedHeading)
  ) {
    return markdown.slice(match[0].length).replace(/^\s*\r?\n/, '')
  }

  return markdown
}
