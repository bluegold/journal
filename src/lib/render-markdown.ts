import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import { bundledLanguages, createHighlighter } from 'shiki'

const theme = 'github-dark'

const highlighterPromise = createHighlighter({
  themes: [theme],
  langs: [
    bundledLanguages.ts,
    bundledLanguages.tsx,
    bundledLanguages.js,
    bundledLanguages.jsx,
    bundledLanguages.json,
    bundledLanguages.bash,
    bundledLanguages.shellscript,
    bundledLanguages.css,
    bundledLanguages.html,
    bundledLanguages.yaml,
    bundledLanguages.sql,
    bundledLanguages.diff,
    bundledLanguages.python,
    bundledLanguages.go,
    bundledLanguages.java,
    bundledLanguages.ruby,
    bundledLanguages.c,
    bundledLanguages.cpp,
    bundledLanguages.rust,
    bundledLanguages.markdown,
  ],
})

const markdownPromise = (async () => {
  const highlighter = await highlighterPromise

  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: false,
    highlight(code, language) {
      const normalizedLanguage = normalizeLanguage(language)

      if (!normalizedLanguage) {
        return ''
      }

      if (normalizedLanguage === 'mermaid') {
        return `<div class="mermaid language-mermaid" data-language="mermaid">${escapeHtml(code)}</div>`
      }

      try {
        return highlighter
          .codeToHtml(code, {
            lang: normalizedLanguage,
            theme,
          })
          .replace('<pre class="shiki ', `<pre class="shiki language-${normalizedLanguage} `)
      } catch {
        return `<pre class="shiki language-${normalizedLanguage}"><code>${escapeHtml(code)}</code></pre>`
      }
    },
  })

  markdown.use(taskLists, {
    enabled: true,
    label: true,
    labelAfter: true,
  })

  return markdown
})()

const languageAliasMap: Record<string, string> = {
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  jsx: 'jsx',
  tsx: 'tsx',
  shell: 'bash',
  sh: 'bash',
  shellscript: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  text: 'text',
}

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const normalizeLanguage = (language: string | null | undefined): string | null => {
  const value = language?.trim().toLowerCase()
  if (!value) {
    return null
  }

  return languageAliasMap[value] ?? value
}

export const renderMarkdown = async (source: string): Promise<string> => {
  const markdown = await markdownPromise
  return markdown.render(source)
}
