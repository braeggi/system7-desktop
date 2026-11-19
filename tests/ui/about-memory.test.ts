import { describe, expect, it } from 'vitest'
import { formatK, memoryRows, TOTAL_MEMORY } from '../../src/lib/ui/aboutMemory'
import { fixtureCatalog as c } from '../fixtures/catalog'

describe('Speicheranzeige im Info-Fenster', () => {
  it('schreibt Kilobyte wie der alte Mac', () => {
    expect(formatK(8192)).toBe('8,192K')
    expect(formatK(32)).toBe('32K')
  })

  it('zeigt ohne offene Fenster nur die Systemsoftware', () => {
    const { rows, unused } = memoryRows([], c)
    expect(rows.map((r) => r.name)).toEqual(['System Software'])
    expect(unused).toBe(TOTAL_MEMORY - rows[0].size)
  })

  it('führt offene Fenster wie laufende Programme auf, das Info-Fenster selbst nicht', () => {
    const { rows, unused } = memoryRows(
      [{ kind: 'about' }, { kind: 'item', id: 'Über mich.md' }, { kind: 'item', id: 'Fotos/Berg.svg' }, { kind: 'trash' }],
      c,
    )
    expect(rows.map((r) => r.name)).toEqual(['System Software', 'Über mich', 'Berg', 'Trash'])
    expect(rows.map((r) => r.kind)).toEqual(['system', 'text', 'image', 'trash'])
    expect(unused).toBe(TOTAL_MEMORY - rows.reduce((sum, r) => sum + r.size, 0))
  })

  it('zählt ein Fenster nur einmal, auch wenn es doppelt gemeldet wird', () => {
    const { rows } = memoryRows([{ kind: 'item', id: 'Über mich.md' }, { kind: 'item', id: 'Über mich.md' }], c)
    expect(rows).toHaveLength(2)
  })
})
