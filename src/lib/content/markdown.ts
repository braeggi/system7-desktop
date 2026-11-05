import { Marked } from 'marked'

const EXTERNAL = /^https?:\/\//

export type ImageResolver = (src: string) => string | undefined

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function renderMarkdown(md: string, resolveImage: ImageResolver = () => undefined): string {
  const marked = new Marked({
    renderer: {
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
        const external = EXTERNAL.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${escapeAttr(href)}"${titleAttr}${external}>${text}</a>`
      },
      image({ href, title, text }) {
        const src = resolveImage(href) ?? href
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
        return `<img src="${escapeAttr(src)}" alt="${escapeAttr(text)}"${titleAttr}>`
      },
    },
  })
  return marked.parse(md, { async: false })
}
