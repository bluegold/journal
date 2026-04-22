import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
})

markdown.use(taskLists, {
  enabled: true,
  label: true,
  labelAfter: true,
})

export const renderMarkdown = (source: string): string => {
  return markdown.render(source)
}
