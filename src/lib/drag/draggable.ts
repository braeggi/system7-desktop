import type { ItemId, Point } from '../content/types'
import { readDropTarget, type DropTarget } from './drop'
import { createGesture, LONG_PRESS_MS, type Gesture } from './gesture'

export interface DraggableOptions {
  id: ItemId
  canDrop: (target: DropTarget) => boolean
  /** Nur antippbar, nicht verschiebbar (z. B. der Papierkorb). */
  fixed?: boolean
  onTap?: (pointerType: string, node: HTMLElement) => void
  onDragStart?: () => void
  /** `topLeft` ist die linke obere Ecke des gezogenen Icons beim Loslassen. */
  onDrop: (target: DropTarget, topLeft: Point) => void
  onDragEnd?: () => void
}

const HOVER_ATTR = 'data-drop-hover'

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function draggable(node: HTMLElement, initial: DraggableOptions | null) {
  let opts = initial
  let gesture: Gesture | null = null
  let pointerId = -1
  let pointerType = 'mouse'
  let grab: Point = { x: 0, y: 0 }
  let origin: DOMRect | null = null
  let ghost: HTMLElement | null = null
  let hovered: HTMLElement | null = null
  let target: DropTarget = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let last: Point = { x: 0, y: 0 }

  const now = () => performance.now()

  function setHover(el: HTMLElement | null) {
    if (hovered === el) return
    hovered?.removeAttribute(HOVER_ATTR)
    hovered = el
    hovered?.setAttribute(HOVER_ATTR, '')
  }

  function hitTest(x: number, y: number) {
    // Das gezogene Icon selbst (halbtransparent an seinem alten Platz) ist nie ein Ziel.
    const el = document.elementsFromPoint(x, y).find((hit) => !node.contains(hit)) ?? null
    const found = readDropTarget(el)
    target = found && opts?.canDrop(found) ? found : null
    setHover(target ? (el?.closest<HTMLElement>('[data-drop]') ?? null) : null)
  }

  function startDrag() {
    origin = node.getBoundingClientRect()
    ghost = node.cloneNode(true) as HTMLElement
    ghost.removeAttribute('id')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.tabIndex = -1
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${origin.left}px`,
      top: `${origin.top}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`,
      margin: '0',
      pointerEvents: 'none',
      zIndex: '10000',
      // 1-Bit-Optik: gepunkteter Umriss statt Schatten und Transparenz
      outline: '1px dotted #000',
      outlineOffset: '-1px',
    })
    ghost.classList.add('drag-ghost')
    document.body.append(ghost)
    node.style.visibility = 'hidden'
    document.body.style.userSelect = 'none'
    try {
      node.setPointerCapture(pointerId)
    } catch {
      // Zeiger ist bereits weg.
    }
    opts?.onDragStart?.()
    moveGhost(last.x, last.y)
  }

  function moveGhost(x: number, y: number) {
    if (!ghost) return
    ghost.style.left = `${x - grab.x}px`
    ghost.style.top = `${y - grab.y}px`
    hitTest(x, y)
  }

  function cleanup(returnHome: boolean) {
    clearTimeout(timer)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
    setHover(null)
    document.body.style.userSelect = ''
    const g = ghost
    ghost = null
    gesture = null
    if (!g) return
    const restore = () => {
      g.remove()
      node.style.visibility = ''
    }
    if (returnHome && origin && !prefersReducedMotion()) {
      g.style.transition = 'left 150ms steps(5, end), top 150ms steps(5, end)'
      g.style.left = `${origin.left}px`
      g.style.top = `${origin.top}px`
      setTimeout(restore, 150)
    } else {
      restore()
    }
    opts?.onDragEnd?.()
  }

  function onPointerDown(e: PointerEvent) {
    if (!opts || (e.pointerType === 'mouse' && e.button !== 0)) return
    if (gesture) return
    pointerId = e.pointerId
    pointerType = e.pointerType || 'mouse'
    const rect = node.getBoundingClientRect()
    grab = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    last = { x: e.clientX, y: e.clientY }
    gesture = createGesture(pointerType)
    gesture.down(now(), e.clientX, e.clientY)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    if (pointerType !== 'mouse') {
      timer = setTimeout(() => {
        if (gesture?.tick(now()) !== 'dragging') return
        if (opts?.fixed) cleanup(false)
        else startDrag()
      }, LONG_PRESS_MS)
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!gesture || e.pointerId !== pointerId) return
    last = { x: e.clientX, y: e.clientY }
    const wasDragging = gesture.phase === 'dragging'
    const phase = gesture.move(now(), e.clientX, e.clientY)
    if (phase === 'cancelled') return cleanup(false)
    if (phase === 'dragging') {
      if (!wasDragging && opts?.fixed) return cleanup(false)
      if (!wasDragging) startDrag()
      else moveGhost(e.clientX, e.clientY)
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!gesture || e.pointerId !== pointerId) return
    const end = gesture.up()
    if (end === 'tap') {
      cleanup(false)
      // Der Klick nach einem Antippen träfe sonst das gerade geöffnete Fenster (z. B. einen Link darin).
      if (pointerType !== 'mouse') suppressNextClick(400)
      opts?.onTap?.(pointerType, node)
      return
    }
    if (end !== 'drop' || !ghost) return cleanup(false)

    hitTest(e.clientX, e.clientY)
    const topLeft = { x: e.clientX - grab.x, y: e.clientY - grab.y }
    let dropTarget = target
    if (dropTarget?.type === 'desk' && dropTarget.gridIndex === undefined) dropTarget = { type: 'desk', point: topLeft }
    suppressNextClick()
    cleanup(dropTarget === null)
    if (dropTarget) opts?.onDrop(dropTarget, topLeft)
  }

  function onPointerCancel(e: PointerEvent) {
    if (e.pointerId === pointerId) cleanup(true)
  }

  // Während eines Touch-Ziehens darf der Browser nicht scrollen, sonst bricht er mit pointercancel ab.
  function onTouchMove(e: TouchEvent) {
    if (gesture?.phase === 'dragging') e.preventDefault()
  }

  function onContextMenu(e: Event) {
    if (gesture && gesture.phase !== 'cancelled') e.preventDefault()
  }

  function suppressNextClick(withinMs = 0) {
    const stop = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
    }
    window.addEventListener('click', stop, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), withinMs)
  }

  node.addEventListener('pointerdown', onPointerDown)
  node.addEventListener('touchmove', onTouchMove, { passive: false })
  node.addEventListener('contextmenu', onContextMenu)

  return {
    update(next: DraggableOptions | null) {
      opts = next
    },
    destroy() {
      cleanup(false)
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('touchmove', onTouchMove)
      node.removeEventListener('contextmenu', onContextMenu)
    },
  }
}
