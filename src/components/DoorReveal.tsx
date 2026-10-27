import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { AdventDay } from '../data/advent'
import { ChristmasArt, Icon } from './ChristmasArt'

export type DoorSelection = {
  day: AdventDay
  origin: { top: number; left: number; width: number; height: number }
}

export function DoorReveal({ selection, onClose }: { selection: DoorSelection; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { day, origin } = selection

  function closeReveal() {
    // Close while mounted so the browser can restore focus to the original door.
    dialogRef.current?.close()
    onClose()
  }

  function containKeyboardFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button')
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current
    const panel = panelRef.current
    if (!dialog || !panel) return

    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    let animation: Animation | undefined

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const target = panel.getBoundingClientRect()
      // FLIP keeps the expansion anchored to the actual door, even after scrolling.
      animation = panel.animate(
        [
          { transform: `translate(${origin.left + origin.width / 2 - target.left - target.width / 2}px, ${origin.top + origin.height / 2 - target.top - target.height / 2}px) scale(${origin.width / target.width}, ${origin.height / target.height})`, borderRadius: '5px' },
          { transform: 'translate(0, 0) scale(1, 1)', borderRadius: '8px' },
        ],
        { duration: 720, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      )
    }

    return () => {
      animation?.cancel()
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [origin])

  return (
    <dialog
      ref={dialogRef}
      className="door-dialog"
      aria-labelledby="reveal-title"
      aria-describedby="reveal-message"
      onCancel={(event) => { event.preventDefault(); closeReveal() }}
      onClick={(event) => { if (event.target === event.currentTarget) closeReveal() }}
      onKeyDown={containKeyboardFocus}
    >
      <div className={`reveal-panel theme-${day.theme}`} ref={panelRef}>
        <button type="button" className="reveal-close" aria-label="Luk og vend tilbage til kalenderen" onClick={closeReveal} autoFocus>
          <Icon name="close" />
        </button>
        <div className="reveal-letter">
          <p className="eyebrow">{day.day}. DECEMBER <span aria-hidden="true">✦</span> EN LILLE TING TIL DIG</p>
          <div className="reveal-art"><ChristmasArt kind={day.art} /></div>
          <h2 id="reveal-title">{day.title}</h2>
          <p id="reveal-message" className="reveal-message">{day.message}</p>
          <div className="little-joy">
            <p className="eyebrow">DAGENS LILLE GLÆDE</p>
            <p>{day.littleJoy}</p>
          </div>
          <p className="reveal-signature">Altid med kærlighed <Icon name="heart" /></p>
          <button type="button" className="back-button" onClick={closeReveal}><Icon name="arrow" /> Tilbage til vores december</button>
        </div>
        <div className={`reveal-cover pattern-${day.pattern}`} aria-hidden="true">
          <span className="door-frame" />
          <ChristmasArt kind={day.art} />
          <span className="reveal-cover-number">{day.day}</span>
          <span className="eyebrow">LIDT JULEMAGI</span>
          <span className="cover-knob" />
        </div>
      </div>
    </dialog>
  )
}
