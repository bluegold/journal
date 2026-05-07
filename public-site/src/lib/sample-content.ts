export interface SiteProjectConfig {
  slug: string
  title: string
  subtitle: string
  summary: string
  tags: string[]
  heroImage: string
  theme: string
}

export interface SampleEntry {
  id: string
  date: string
  title: string
  summary: string
  tags: string[]
}

export interface SampleArchiveMonthStat {
  month: string
  count: number
}

export function buildSampleEntries(project: SiteProjectConfig): SampleEntry[] {
  return [
    {
      id: `${project.slug}-sample-1`,
      date: '2026-05-07',
      title: `${project.title} kickoff note`,
      summary: 'The first note for this project page. It shows date prominence, summary width, and action placement.',
      tags: project.tags,
    },
    {
      id: `${project.slug}-sample-2`,
      date: '2026-05-04',
      title: 'Design review and implementation notes',
      summary: 'A second sample entry to exercise the list layout, tags, and the detail button treatment.',
      tags: [...project.tags, 'design'],
    },
    {
      id: `${project.slug}-sample-3`,
      date: '2026-04-29',
      title: 'Follow-up and cleanup',
      summary: 'A shorter entry with the same card structure, to make sure repeated items do not drift.',
      tags: [...project.tags, 'cleanup'],
    },
  ]
}

export function buildSampleArchiveMonths(entries: SampleEntry[]): SampleArchiveMonthStat[] {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    const month = entry.date.slice(0, 7)
    counts.set(month, (counts.get(month) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort(([monthA], [monthB]) => monthB.localeCompare(monthA))
    .map(([month, count]) => ({ month, count }))
}

export function buildSampleArticle(project: SiteProjectConfig, sampleIndex: number, id: string) {
  const titles = [
    `${project.title} kickoff note`,
    `${project.title} implementation log`,
    `${project.title} follow-up`,
  ]

  const dates = ['2026-05-07', '2026-05-04', '2026-04-29']
  const articleTitle = titles[sampleIndex - 1] ?? `${project.title} note`

  const markdown = `# ${articleTitle}

This page demonstrates the article layout.

## Notes

- Date is prominent
- Tags stay close to the header
- Markdown blocks need breathing room

> The body should stay readable even when it contains code, tables, and diagrams.

### Code

\`\`\`ts
export function summarize(entry: string) {
  return entry.trim()
}
\`\`\`

### Table

| Field | Value |
| --- | --- |
| Project | ${project.title} |
| Entry id | ${id} |
| Status | Draft |

### Diagram

\`\`\`mermaid
flowchart TD
  A[Draft] --> B[Review]
  B --> C[Publish]
\`\`\`
`

  const bodyMarkdown = markdown.startsWith(`# ${articleTitle}\n\n`)
    ? markdown.slice(articleTitle.length + 4)
    : markdown

  return {
    articleTitle,
    articleDate: dates[sampleIndex - 1] ?? dates[0],
    bodyMarkdown,
  }
}
