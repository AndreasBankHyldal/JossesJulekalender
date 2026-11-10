import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { AdventDateInvitation } from '../data/advent'
import { Icon } from './ChristmasArt'

type ScratchState = 'covered' | 'clearing' | 'revealed'

const BRUSH_RADIUS = 22
const REVEAL_THRESHOLD = .55
const FADE_MS = 450

function drawCover(canvas: HTMLCanvasElement) {
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.globalCompositeOperation = 'source-over'
  const foil = context.createLinearGradient(0, 0, width, height)
  foil.addColorStop(0, '#b8924f')
  foil.addColorStop(.35, '#e9d39b')
  foil.addColorStop(.6, '#c9a35d')
  foil.addColorStop(1, '#e4c98a')
  context.fillStyle = foil
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#fff6dc66'
  for (let y = 18; y < height; y += 34) {
    for (let x = (y / 34) % 2 ? 18 : 35; x < width; x += 34) {
      context.beginPath()
      context.arc(x, y, 1.6, 0, Math.PI * 2)
      context.fill()
    }
  }
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#7a5a26'
  context.font = `italic 500 ${Math.min(40, width / 8)}px 'Cormorant Garamond', Georgia, serif`
  context.fillText('Skrab her', width / 2, height / 2 - 12)
  context.font = "500 10px 'DM Sans', sans-serif"
  context.fillText('EN INVITATION TIL DIG', width / 2, height / 2 + 22)
}

function clearedShare(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context || canvas.width === 0 || canvas.height === 0) return 0
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  let cleared = 0
  let sampled = 0
  // Sampling every 16th pixel is plenty to estimate how much foil is gone.
  for (let index = 3; index < data.length; index += 64) {
    sampled++
    if (data[index] === 0) cleared++
  }
  return cleared / sampled
}

export function DateInvitation({ invitation, description }: { invitation: AdventDateInvitation; description: string }) {
  const [scratchState, setScratchState] = useState<ScratchState>('covered')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const hasScratched = useRef(false)
  const fadeTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let size = ''
    const redraw = () => {
      const nextSize = `${canvas.offsetWidth}x${canvas.offsetHeight}`
      if (nextSize === size) return
      size = nextSize
      hasScratched.current = false
      drawCover(canvas)
    }
    redraw()
    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)
    let active = true
    // Redraw once the local fonts are ready, unless scratching has already begun.
    document.fonts?.ready.then(() => {
      if (active && !hasScratched.current) drawCover(canvas)
    })
    return () => {
      active = false
      observer.disconnect()
    }
  }, [])

  useEffect(() => () => window.clearTimeout(fadeTimer.current), [])

  function reveal() {
    if (scratchState !== 'covered') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setScratchState('revealed')
      return
    }
    setScratchState('clearing')
    fadeTimer.current = window.setTimeout(() => setScratchState('revealed'), FADE_MS)
  }

  function revealWithButton() {
    reveal()
    contentRef.current?.focus()
  }

  function scratchTo(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget
    const context = canvas.getContext('2d')
    if (!context) return
    const bounds = canvas.getBoundingClientRect()
    // Bounds may be scaled while the door is still zooming open.
    const point = {
      x: (event.clientX - bounds.left) * (canvas.offsetWidth / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.offsetHeight / bounds.height),
    }
    const from = lastPoint.current ?? point
    context.globalCompositeOperation = 'destination-out'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = BRUSH_RADIUS * 2
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(point.x + .01, point.y)
    context.stroke()
    lastPoint.current = point
    hasScratched.current = true
  }

  function startScratch(event: PointerEvent<HTMLCanvasElement>) {
    if (scratchState !== 'covered') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    lastPoint.current = null
    scratchTo(event)
  }

  function continueScratch(event: PointerEvent<HTMLCanvasElement>) {
    if (scratchState !== 'covered' || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    scratchTo(event)
  }

  function endScratch(event: PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    lastPoint.current = null
    if (scratchState === 'covered' && clearedShare(event.currentTarget) >= REVEAL_THRESHOLD) reveal()
  }

  const isCovered = scratchState === 'covered'

  return (
    <section className="date-invitation" aria-labelledby="date-invitation-title">
      <h3 id="date-invitation-title" className="eyebrow">DIN INVITATION</h3>
      <p className="date-invitation-hint">
        {isCovered ? 'Skrab guldlaget væk med fingeren eller musen.' : 'Invitationen er skrabet fri. Næste gang du åbner lågen, kan du skrabe igen.'}
      </p>
      <div className="scratch-card">
        <div ref={contentRef} className="scratch-card-content" tabIndex={-1}>
          <svg className="date-invitation-cup" viewBox="0 0 120 90" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M47 24c-6-6 6-9 0-16m14 16c-6-6 6-9 0-16m14 16c-6-6 6-9 0-16" stroke="#c6a76b" strokeWidth="2.5" />
            <path d="M30 34h60v22a20 20 0 0 1-20 20H50a20 20 0 0 1-20-20z" fill="#fffaf0" stroke="#943d39" strokeWidth="3" />
            <path d="M90 41h5a10 10 0 0 1 0 20h-6" stroke="#943d39" strokeWidth="3" />
            <path d="M33 40h54" stroke="#6b3a2a" strokeWidth="6" />
            <path d="M54 54c0-5 6-7 6-2 0-5 6-3 6 2 0 5-6 9-6 9s-6-4-6-9z" fill="#c45a52" />
            <path d="M20 82h80" stroke="#d4c7a8" strokeWidth="2" />
          </svg>
          <p className="date-invitation-venue">{invitation.venue}</p>
          <p className="date-invitation-text">{description}</p>
          <p className="date-invitation-choice"><Icon name="sparkle" /><span>{invitation.choice}</span></p>
          <p className="date-invitation-timing">{invitation.timing}</p>
        </div>
        {scratchState === 'revealed' ? null : (
          <canvas
            ref={canvasRef}
            className={`scratch-card-cover${scratchState === 'clearing' ? ' is-clearing' : ''}`}
            aria-hidden="true"
            onPointerDown={startScratch}
            onPointerMove={continueScratch}
            onPointerUp={endScratch}
            onPointerCancel={endScratch}
          />
        )}
      </div>
      {isCovered ? (
        <button type="button" className="scratch-card-reveal" onClick={revealWithButton}>
          <Icon name="sparkle" /> Vis hele invitationen
        </button>
      ) : null}
    </section>
  )
}
