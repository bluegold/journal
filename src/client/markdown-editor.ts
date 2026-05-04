import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { markdown, markdownKeymap } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import {
  EditorView,
  keymap,
  placeholder,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightSpecialChars,
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/view'

const mountedEditors = new WeakMap<HTMLTextAreaElement, EditorView>()

const editorTheme = EditorView.theme({
  '&': {
    minHeight: '52vh',
    border: '1px solid rgba(100, 116, 139, 0.9)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    color: '#f8fafc',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
    fontSize: '0.875rem',
  },
  '&.cm-focused': {
    outline: '2px solid rgba(34, 211, 238, 0.38)',
    outlineOffset: '2px',
    borderColor: 'rgba(103, 232, 249, 0.95)',
  },
  '.cm-scroller': {
    minHeight: '52vh',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
    lineHeight: '1.5rem',
  },
  '.cm-content': {
    padding: '0.75rem 0.875rem',
    caretColor: '#a5f3fc',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#a5f3fc',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#cffafe',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(8, 47, 73, 0.32)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(34, 211, 238, 0.3)',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-placeholder': {
    color: '#94a3b8',
  },
})

const syncTextareaValue = (textarea: HTMLTextAreaElement, value: string) => {
  textarea.value = value
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

const focusEditorEnd = (view: EditorView) => {
  const end = view.state.doc.length
  view.dispatch({
    selection: { anchor: end, head: end },
    scrollIntoView: true,
  })
  view.focus()
}

const createEditorExtensions = (textarea: HTMLTextAreaElement) => {
  const extensions = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    syntaxHighlighting(defaultHighlightStyle),
    keymap.of([...markdownKeymap, indentWithTab]),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    markdown(),
    EditorView.lineWrapping,
    editorTheme,
  ]

  const placeholderText = textarea.getAttribute('placeholder')?.trim()
  if (placeholderText) {
    extensions.push(placeholder(placeholderText))
  }

  extensions.push(
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      syncTextareaValue(textarea, update.state.doc.toString())
    })
  )

  return extensions
}

const mountMarkdownEditor = (textarea: HTMLTextAreaElement) => {
  if (mountedEditors.has(textarea)) return

  const host = document.createElement('div')
  host.className = 'cm-journal-editor-host'
  textarea.insertAdjacentElement('afterend', host)
  textarea.hidden = true

  const view = new EditorView({
    parent: host,
    doc: textarea.value,
    extensions: createEditorExtensions(textarea),
  })

  host.addEventListener('pointerdown', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('.cm-content')) return

    requestAnimationFrame(() => {
      focusEditorEnd(view)
    })
  })

  mountedEditors.set(textarea, view)
}

const mountMarkdownEditors = (scope: Document | Element) => {
  const textareas = scope.querySelectorAll<HTMLTextAreaElement>('textarea[data-markdown-editor="codemirror"]')

  for (const textarea of textareas) {
    mountMarkdownEditor(textarea)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mountMarkdownEditors(document)
})

document.addEventListener('htmx:load', (event) => {
  const scope = event.target instanceof Element ? event.target : document
  mountMarkdownEditors(scope)
})
