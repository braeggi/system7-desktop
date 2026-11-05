import type { Catalog } from '../../src/lib/content/types'

export const fixtureCatalog: Catalog = {
  items: {
    'Über mich.md': { id: 'Über mich.md', kind: 'text', title: 'Über mich', folder: null, html: '<p>Hallo</p>' },
    Projekte: { id: 'Projekte', kind: 'folder', title: 'Projekte', folder: null },
    'Projekte/App.md': { id: 'Projekte/App.md', kind: 'text', title: 'App', folder: 'Projekte', html: '<p>App</p>' },
    Fotos: { id: 'Fotos', kind: 'folder', title: 'Fotos', folder: null },
    'Fotos/Berg.svg': { id: 'Fotos/Berg.svg', kind: 'image', title: 'Berg', folder: 'Fotos', src: '/berg.svg' },
  },
  order: ['Über mich.md', 'Projekte', 'Fotos', 'Fotos/Berg.svg', 'Projekte/App.md'],
  initial: {
    reference: { w: 1440, h: 900 },
    positions: { 'Über mich.md': { x: 1200, y: 60 }, Projekte: { x: 1200, y: 160 } },
  },
}
