import { guestbookConfig } from '../guestbook/config'
import { buildCatalog } from './catalog'
import type { LayoutFile, SiteConfig } from './types'
import layout from '../../../inhalt/schreibtisch.json'
import siteConfig from '../../../inhalt/seite.json'

const markdown = import.meta.glob<string>(['/inhalt/**/*.md', '/inhalt/**/*.MD'], {
  query: '?raw',
  import: 'default',
  eager: true,
})
// Alle übrigen Dateien als URL; welche davon Bilder sind, entscheidet buildCatalog (ohne Rücksicht auf Groß-/Kleinschreibung).
const images = import.meta.glob<string>(['/inhalt/**/*', '!/inhalt/**/*.{md,MD,json}'], {
  query: '?url',
  import: 'default',
  eager: true,
})

export const catalog = buildCatalog({ markdown, images, layout: layout as LayoutFile, guestbook: guestbookConfig !== null })
export const site: SiteConfig = siteConfig
