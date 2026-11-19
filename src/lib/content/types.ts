import type { TrashRule } from '../ui/trashTalk.svelte'
export type ItemId = string
export type ItemKind = 'text' | 'image' | 'folder' | 'guestbook' | 'projects'

export interface Point {
  x: number
  y: number
}

export interface Size {
  w: number
  h: number
}

export interface CatalogItem {
  id: ItemId
  kind: ItemKind
  title: string
  folder: ItemId | null
  html?: string
  src?: string
  /** Smiley und blinkender Cursor am Textende (Frontmatter `cursor: true`) */
  cursor?: boolean
  /** Inhalt in der Fenstermitte (Frontmatter `center: true`) */
  center?: boolean
  /** Inhalt einer Projektübersicht (`*.projekte`) */
  projects?: ProjectOverview
}

export interface ProjectEntry {
  name: string
  text: string
  link: string
  /** URL des Bildes, falls es eines gibt */
  image?: string
}

export interface ProjectOverview {
  title: string
  subtitle: string
  entries: ProjectEntry[]
}

export interface Catalog {
  items: Record<ItemId, CatalogItem>
  order: ItemId[]
  initial: { reference: Size; positions: Record<ItemId, Point> }
}

export interface SiteConfig {
  titel: string
  monogramm: string
  /** Dokument aus `inhalt/`, das sich beim Laden von selbst öffnet */
  start?: string
  /** Sprüche des Papierkorbs je Element, siehe TrashTalk */
  papierkorb?: Record<string, TrashRule>
}

export interface LayoutFile {
  referenz: { breite: number; hoehe: number }
  positionen: Record<string, { x: number; y: number }>
}
