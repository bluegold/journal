import { marked } from 'marked'
import { bundledLanguages, createHighlighter } from 'shiki'
import { createEmbeddedDiagramPlaceholderHtml, escapeHtml } from './embedded-diagram'
import { embeddedDiagramDefinitions } from './mermaid-diagram'

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

const normalizeLanguage = (language: string | null | undefined): string | null => {
  const value = language?.trim().toLowerCase()
  if (!value) {
    return null
  }

  return languageAliasMap[value] ?? value
}

const markdownPromise = (async () => {
  const highlighter = await highlighterPromise
  const renderer = new marked.Renderer()
  const originalCode = renderer.code.bind(renderer)

  renderer.code = ({ text, lang }) => {
    const normalizedLanguage = normalizeLanguage(lang)

    if (!normalizedLanguage) {
      return originalCode({ text, lang, escaped: false })
    }

    const embeddedDiagramDefinition =
      embeddedDiagramDefinitions.find((definition) => definition.language === normalizedLanguage) ?? null
    if (embeddedDiagramDefinition) {
      return createEmbeddedDiagramPlaceholderHtml(embeddedDiagramDefinition, text)
    }

    try {
      return highlighter
        .codeToHtml(text, {
          lang: normalizedLanguage,
          theme,
        })
        .replace('<pre class="shiki ', `<pre class="shiki language-${normalizedLanguage} `)
    } catch {
      return `<pre class="shiki language-${normalizedLanguage}"><code>${escapeHtml(text)}</code></pre>`
    }
  }

  marked.use({
    renderer,
  })

  return marked
})()

export async function renderMarkdown(source: string): Promise<string> {
  const markdown = await markdownPromise
  return markdown.parse(source, { breaks: true })
}
