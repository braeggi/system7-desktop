import { describe, expect, it } from 'vitest'
import { DeskStore } from '../../src/lib/state/desk.svelte'
import { createActions } from '../../src/lib/ui/actions'
import { TrashTalk } from '../../src/lib/ui/trashTalk.svelte'
import { WindowManager } from '../../src/lib/windows/windows.svelte'
import { fixtureCatalog } from '../fixtures/catalog'

describe('TrashTalk', () => {
  it('nimmt ohne Regel alles an und sagt nichts', () => {
    const talk = new TrashTalk()
    expect(talk.receive('Über mich.md')).toBe(true)
    expect(talk.hits).toBe(1)
    expect(talk.bubble).toBeNull()
  })

  it('sagt den Spruch aus der Regel', () => {
    const talk = new TrashTalk({ 'pulp.gif': { spruch: 'Royale with trash.' } })
    expect(talk.receive('pulp.gif')).toBe(true)
    expect(talk.bubble?.text).toBe('Royale with trash.')
  })

  it('weigert sich bei weigert: true und zählt den Wurf trotzdem', () => {
    const talk = new TrashTalk({ 'hello world.md': { spruch: 'nice try.', weigert: true } })
    expect(talk.receive('hello world.md')).toBe(false)
    expect(talk.hits).toBe(1)
    expect(talk.bubble?.text).toBe('nice try.')
  })

  it('löscht einen alten Spruch beim nächsten Wurf ohne Spruch', () => {
    const talk = new TrashTalk({ 'pulp.gif': { spruch: 'Royale with trash.' } })
    talk.receive('pulp.gif')
    talk.receive('Über mich.md')
    expect(talk.bubble).toBeNull()
  })
})

describe('Ablegen im Papierkorb', () => {
  const setup = (talk: TrashTalk) => {
    const desk = new DeskStore(fixtureCatalog, null)
    const actions = createActions(desk, new WindowManager(), { id: null }, talk)
    return { desk, actions }
  }

  it('lässt ein verweigertes Dokument liegen', () => {
    const { desk, actions } = setup(new TrashTalk({ 'Über mich.md': { spruch: 'nice try.', weigert: true } }))
    expect(actions.drop('Über mich.md', { type: 'trash' })).toBe(false)
    expect(desk.state.locations['Über mich.md']).toEqual({ in: 'desk' })
  })

  it('wirft alles andere weg und lässt den Papierkorb reagieren', () => {
    const talk = new TrashTalk()
    const { desk, actions } = setup(talk)
    expect(actions.drop('Über mich.md', { type: 'trash' })).toBe(true)
    expect(desk.state.locations['Über mich.md']).toEqual({ in: 'trash' })
    expect(talk.hits).toBe(1)
  })

  it('reagiert nicht, wenn etwas woanders abgelegt wird', () => {
    const talk = new TrashTalk()
    const { actions } = setup(talk)
    actions.drop('Über mich.md', { type: 'folder', folder: 'Projekte' })
    expect(talk.hits).toBe(0)
  })
})
