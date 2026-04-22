import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './render-markdown'

describe('renderMarkdown', () => {
  it('renders common gfm markdown constructs', () => {
    const html = renderMarkdown(`# Title

Paragraph with **strong** text and a [link](https://example.com).

- [ ] task one
- [x] task two

| Name | Value |
| --- | --- |
| Alpha | 1 |

\`\`\`ts
const answer = 42
\`\`\`

![Alt text](https://example.com/image.png)
`)

    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>strong</strong>')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('contains-task-list')
    expect(html).toContain('task-list-item enabled')
    expect(html).toContain('<table>')
    expect(html).toContain('<code class="language-ts">')
    expect(html).toContain('<img src="https://example.com/image.png" alt="Alt text">')
  })
})
