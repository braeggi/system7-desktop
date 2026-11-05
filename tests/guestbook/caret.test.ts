import { describe, expect, it } from 'vitest'
import { keepCaret } from '../../src/lib/guestbook/caret'

describe('keepCaret', () => {
  it('bleibt stehen, wenn hinter der Marke eingefügt wird', () => expect(keepCaret('Hallo', 'Hallo Welt', 3)).toBe(3))
  it('rückt mit, wenn vor der Marke eingefügt wird', () => expect(keepCaret('Welt', 'Hallo Welt', 2)).toBe(8))
  it('rückt zurück, wenn vor der Marke gelöscht wird', () => expect(keepCaret('Hallo Welt', 'Welt', 8)).toBe(2))
  it('bleibt im Text, wenn alles ersetzt wird', () => expect(keepCaret('abcdef', 'xy', 5)).toBe(2))
})
