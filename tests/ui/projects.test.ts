import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import ProjectsView from '../../src/lib/ui/ProjectsView.svelte'

const projects = {
  title: 'Project Resources',
  subtitle: 'Various projects to explore.',
  entries: [
    { name: 'Tichu Score Board', text: 'Keeps score.', link: 'https://tichu.example', image: '/tichu.png' },
    { name: 'Swiss Temp Dashboard', text: 'Shows the weather.', link: 'https://temp.example' },
  ],
}

describe('ProjectsView', () => {
  it('zeigt Titel und Untertitel', () => {
    render(ProjectsView, { props: { projects } })
    expect(screen.getByRole('heading', { name: 'Project Resources' })).toBeInTheDocument()
    expect(screen.getByText('Various projects to explore.')).toBeInTheDocument()
  })

  it('macht jedes Projekt zu einem Link in einen neuen Tab', () => {
    render(ProjectsView, { props: { projects } })
    const tichu = screen.getByRole('link', { name: /Tichu Score Board/ })
    expect(tichu).toHaveAttribute('href', 'https://tichu.example')
    expect(tichu).toHaveAttribute('target', '_blank')
    expect(tichu).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /Swiss Temp Dashboard/ })).toHaveAttribute('href', 'https://temp.example')
  })

  it('zeigt Bild, Namen und Satz eines Projekts', () => {
    render(ProjectsView, { props: { projects } })
    const tichu = screen.getByRole('link', { name: /Tichu Score Board/ })
    expect(tichu.querySelector('img')).toHaveAttribute('src', '/tichu.png')
    expect(tichu).toHaveTextContent('Keeps score.')
    // ohne Bild kein leeres <img>
    expect(screen.getByRole('link', { name: /Swiss Temp Dashboard/ }).querySelector('img')).toBeNull()
  })
})
