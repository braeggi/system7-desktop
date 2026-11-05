import { parseFrontmatter } from './frontmatter'
import { renderMarkdown } from './markdown'
import type { Catalog, CatalogItem, ItemId, LayoutFile, Point } from './types'

const ROOT = '/inhalt/'
const IMAGE = /\.(jpe?g|png|webp|gif|svg)$/i
const GUESTBOOK = /\.gaestebuch$/i

/** Löst einen Bildpfad aus einem Markdown-Dokument relativ zu dessen Ordner gegen die bekannten Bilder auf. */
function imageResolver(mdPath: string, images: Record<string, string>) {
  return (src: string) => {
    if (/^[a-z]+:|^\/\//i.test(src)) return undefined
    const base = src.startsWith('/') ? [] : mdPath.split('/').slice(0, -1)
    for (const part of src.split('/')) {
      if (part === '..') base.pop()
      else if (part !== '.' && part !== '') base.push(part)
    }
    const resolved = '/' + base.filter(Boolean).join('/')
    return images[resolved] ?? images[ROOT + resolved.slice(1)]
  }
}

export function buildCatalog(input: {
  markdown: Record<string, string>
  images: Record<string, string>
  layout: LayoutFile
  /** Nur mit Supabase-Zugangsdaten wird aus `*.gaestebuch` ein Gästebuch. */
  guestbook?: boolean
}): Catalog {
  const items: Record<ItemId, CatalogItem> = {}

  const addFile = (path: string, make: (id: ItemId, folder: ItemId | null, name: string) => CatalogItem) => {
    const id = path.startsWith(ROOT) ? path.slice(ROOT.length) : path.replace(/^\//, '')
    const parts = id.split('/')
    const folder = parts.length > 1 ? parts[0] : null
    if (folder && !items[folder]) items[folder] = { id: folder, kind: 'folder', title: folder, folder: null }
    items[id] = make(id, folder, parts[parts.length - 1].replace(/\.[^.]+$/, ''))
  }

  for (const [path, raw] of Object.entries(input.markdown)) {
    addFile(path, (id, folder, name) => {
      const { title, body } = parseFrontmatter(raw)
      const html = renderMarkdown(body, imageResolver(path, input.images))
      return { id, kind: 'text', title: title ?? name, folder, html }
    })
  }
  for (const [path, src] of Object.entries(input.images)) {
    if (IMAGE.test(path)) addFile(path, (id, folder, name) => ({ id, kind: 'image', title: name, folder, src }))
    else if (input.guestbook && GUESTBOOK.test(path)) addFile(path, (id, folder, name) => ({ id, kind: 'guestbook', title: name, folder }))
  }

  const positions: Record<ItemId, Point> = {}
  for (const [id, p] of Object.entries(input.layout.positionen)) {
    if (items[id]) positions[id] = { x: p.x, y: p.y }
  }

  const positioned = Object.keys(positions)
  const rest = Object.keys(items)
    .filter((id) => !(id in positions))
    .sort((a, b) => a.localeCompare(b, 'de'))

  return {
    items,
    order: [...positioned, ...rest],
    initial: {
      reference: { w: input.layout.referenz.breite, h: input.layout.referenz.hoehe },
      positions,
    },
  }
}
