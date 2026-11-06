import { describe, expect, it } from 'vitest'
import { imageWindowSize } from '../../src/lib/ui/actions'

describe('imageWindowSize', () => {
  const big = { w: 2000, h: 1200 }

  it('zeigt das Bild 1:1, Rahmen und Titelleiste kommen dazu', () => {
    // 1 px Rahmen links und rechts, oben 20 px Titelleiste, unten 1 px Rahmen
    expect(imageWindowSize({ w: 384, h: 224 }, big)).toEqual({ w: 386, h: 246 })
  })

  it('verkleinert zu große Bilder auf 70 % des Bildschirms', () => {
    expect(imageWindowSize({ w: 2800, h: 1400 }, big)).toEqual({ w: 1402, h: 722 })
  })

  it('wird nicht kleiner als das kleinste Fenster', () => {
    expect(imageWindowSize({ w: 32, h: 32 }, big)).toEqual({ w: 220, h: 140 })
  })
})
