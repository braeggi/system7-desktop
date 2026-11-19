import { parseFrontmatter } from './frontmatter'
import { renderMarkdown } from './markdown'
import type { Catalog, CatalogItem, ItemId, LayoutFile, Point, ProjectOverview } from './types'

const ROOT = '/inhalt/'
const IMAGE = /\.(jpe?g|png|webp|gif|svg)$/i
const GUESTBOOK = /\.gaestebuch$/i

/** Löst einen Pfad relativ zum Ordner einer Datei in `inhalt/` auf. */
function resolvePath(filePath: string, src: string): string {
  const base = src.startsWith('/') ? [] : filePath.split('/').slice(0, -1)
  for (const part of src.split('/')) {
    if (part === '..') base.pop()
    else if (part !== '.' && part !== '') base.push(part)
  }
  return '/' + base.filter(Boolean).join('/')
}

/** Liest eine `*.projekte`-Datei; `null` bei ungültigem Inhalt. Merkt sich die benutzten Bilder in `used`. */
function parseProjects(path: string, raw: string, images: Record<string, string>, used: Set<string>): ProjectOverview | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    console.warn(`${path}: kein gültiges JSON, wird übersprungen`)
    return null
  }
  const d = data as { titel?: unknown; untertitel?: unknown; projekte?: unknown }
  if (!Array.isArray(d.projekte)) {
    console.warn(`${path}: "projekte" fehlt, wird übersprungen`)
    return null
  }
  const text = (v: unknown) => (typeof v === 'string' ? v : '')
  return {
    title: text(d.titel),
    subtitle: text(d.untertitel),
    entries: d.projekte.map((p: Record<string, unknown>) => {
      const bild = typeof p.bild === 'string' ? resolvePath(path, p.bild) : null
      if (bild) used.add(bild)
      const image = bild ? images[bild] : undefined
      return { name: text(p.name), text: text(p.text), link: text(p.link), ...(image ? { image } : {}) }
    }),
  }
}

/** Löst einen Bildpfad aus einem Markdown-Dokument relativ zu dessen Ordner gegen die bekannten Bilder auf. */
function imageResolver(mdPath: string, images: Record<string, string>) {
  return (src: string) => {
    if (/^[a-z]+:|^\/\//i.test(src)) return undefined
    const resolved = resolvePath(mdPath, src)
    return images[resolved] ?? images[ROOT + resolved.slice(1)]
  }
}

export function buildCatalog(input: {
  markdown: Record<string, string>
  images: Record<string, string>
  layout: LayoutFile
  /** Nur mit Supabase-Zugangsdaten wird aus `*.gaestebuch` ein Gästebuch. */
  guestbook?: boolean
  /** Rohtext der `*.projekte`-Dateien */
  projects?: Record<string, string>
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
      const { title, cursor, center, body } = parseFrontmatter(raw)
      const html = renderMarkdown(body, imageResolver(path, input.images))
      return { id, kind: 'text', title: title ?? name, folder, html, ...(cursor ? { cursor } : {}), ...(center ? { center } : {}) }
    })
  }
  // Bilder, die nur zu einer Projektübersicht gehören, liegen nicht als eigene Icons herum
  const usedByProjects = new Set<string>()
  for (const [path, raw] of Object.entries(input.projects ?? {})) {
    const projects = parseProjects(path, raw, input.images, usedByProjects)
    if (projects) addFile(path, (id, folder, name) => ({ id, kind: 'projects', title: name, folder, projects }))
  }
  for (const [path, src] of Object.entries(input.images)) {
    if (usedByProjects.has(path)) continue
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
    .sort((a, b) => a.localeCompare(b, 'en'))

  return {
    items,
    order: [...positioned, ...rest],
    initial: {
      reference: { w: input.layout.referenz.breite, h: input.layout.referenz.hoehe },
      positions,
    },
  }
}
