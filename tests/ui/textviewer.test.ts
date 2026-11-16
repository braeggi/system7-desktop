import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import TextViewer from '../../src/lib/ui/TextViewer.svelte'

describe('TextViewer', () => {
  it('zeigt am Ende Smiley und Cursor, wenn cursor gesetzt ist', () => {
    render(TextViewer, { props: { html: '<p>Hallo</p>', cursor: true } })
    const end = screen.getByTestId('textende')
    expect(end).toHaveAttribute('aria-hidden', 'true')
    expect(end.querySelector('svg')).not.toBeNull()
    expect(end.querySelector('.caret')).not.toBeNull()
  })

  it('zeigt ohne cursor nichts davon', () => {
    render(TextViewer, { props: { html: '<p>Hallo</p>' } })
    expect(screen.queryByTestId('textende')).toBeNull()
  })
})
