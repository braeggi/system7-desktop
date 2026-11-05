export type ItemId = string
export type ItemKind = 'text' | 'image' | 'folder' | 'guestbook'

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
}

export interface Catalog {
  items: Record<ItemId, CatalogItem>
  order: ItemId[]
  initial: { reference: Size; positions: Record<ItemId, Point> }
}

export interface SiteConfig {
  titel: string
  monogramm: string
}

export interface LayoutFile {
  referenz: { breite: number; hoehe: number }
  positionen: Record<string, { x: number; y: number }>
}
