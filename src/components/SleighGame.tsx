import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { AdventSleighGame } from '../data/advent'
import type { AccountRole } from '../types/session'
import { useSleighScores } from '../lib/useSleighScores'
import { advanceSleighRun, BASE_SPEED, formatDuration, MAX_X, MIN_X, ROAD_HEIGHT, ROAD_WIDTH, speedAt, startSleighRun } from '../lib/sleigh-game'
import type { RunResult, SleighRun, Steering } from '../lib/sleigh-game'
import { drawSleighScene } from '../lib/sleigh-art'
import { Icon } from './ChristmasArt'

type Phase = 'ready' | 'playing' | 'paused' | 'over'
type Hud = { presents: number; elapsedMs: number; hearts: number; x: number }
const initialHud: Hud = { presents: 0, elapsedMs: 0, hearts: 2, x: ROAD_WIDTH / 2 }

function PlayerBest({ name, best }: { name: string; best: RunResult | null }) {
  return (
    <div className="sleigh-player-record">
      <h5>{name}</h5>
      {best ? <dl>
        <div><dt>Flest gaver</dt><dd>{best.presents}</dd></div>
        <div><dt>Længste tur</dt><dd>{formatDuration(best.durationMs)}</dd></div>
      </dl> : <p>Ikke spillet endnu</p>}
    </div>
  )
}

export function SleighGame({ game, role }: { game: AdventSleighGame; role: AccountRole }) {
  const records = useSleighScores(role)
  const [phase, setPhase] = useState<Phase>('ready')
  const [hud, setHud] = useState(initialHud)
  const [canvasError, setCanvasError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const rootRef = useRef<HTMLElement>(null)
  const replayRef = useRef<HTMLButtonElement>(null)
  const runRef = useRef<SleighRun | null>(null)
  const inputRef = useRef<Steering>({ direction: 0, targetX: null })
  const keysRef = useRef({ left: false, right: false })
  const pointerRef = useRef<number | null>(null)
  const reducedRef = useRef(false)
  const lastHudRef = useRef(0)
  const focusReplayRef = useRef(false)
  const id = useId()
  const playing = phase === 'playing'

  function draw() {
    if (contextRef.current) drawSleighScene(contextRef.current, runRef.current, reducedRef.current)
  }

  function clearSteering() {
    keysRef.current = { left: false, right: false }
    inputRef.current = { direction: 0, targetX: null }
    pointerRef.current = null
  }

  function updateHud(run: SleighRun) {
    setHud({ presents: run.presents, elapsedMs: run.elapsedMs, hearts: run.hearts, x: run.x })
    lastHudRef.current = run.elapsedMs
  }

  function start() {
    const canvas = canvasRef.current
    if (!canvas || !contextRef.current) {
      console.error('Spillebanen kunne ikke oprettes.')
      setCanvasError('Din browser kunne ikke vise spillet. Prøv at genindlæse siden eller bruge en anden browser.')
      return
    }
    clearSteering()
    runRef.current = startSleighRun()
    lastHudRef.current = 0
    setHud(initialHud)
    setPhase('playing')
    canvas.focus({ preventScroll: true })
    canvas.scrollIntoView({ block: 'center', behavior: 'instant' })
    draw()
  }

  function pause() {
    if (!playing) return
    clearSteering()
    if (runRef.current) updateHud(runRef.current)
    setPhase('paused')
  }

  function resume() {
    clearSteering()
    setPhase('playing')
    canvasRef.current?.focus({ preventScroll: true })
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>, pressed: boolean) {
    if (!playing || event.altKey || event.ctrlKey || event.metaKey) return
    const key = event.key.toLowerCase()
    if (!['arrowleft', 'arrowright', 'a', 'd'].includes(key)) return
    event.preventDefault()
    if (key === 'arrowleft' || key === 'a') keysRef.current.left = pressed
    else keysRef.current.right = pressed
    inputRef.current = { targetX: null, direction: Number(keysRef.current.right) - Number(keysRef.current.left) }
  }

  function steerPointer(event: PointerEvent<HTMLCanvasElement>) {
    if (!playing || (event.pointerType !== 'mouse' && pointerRef.current !== event.pointerId)) return
    const rect = event.currentTarget.getBoundingClientRect()
    inputRef.current = { direction: 0, targetX: (event.clientX - rect.left) / rect.width * ROAD_WIDTH }
  }

  function nudge(direction: number) {
    if (!playing || !runRef.current) return
    inputRef.current = { direction: 0, targetX: runRef.current.x + direction * 75 }
  }

  const tick = useEffectEvent((deltaMs: number) => {
    const previous = runRef.current
    if (!previous || previous.finished) return
    const next = advanceSleighRun(previous, deltaMs, inputRef.current)
    runRef.current = next
    draw()
    if (
      next.elapsedMs - lastHudRef.current >= 100 || next.presents !== previous.presents ||
      next.hearts !== previous.hearts || next.finished
    ) {
      updateHud(next)
    }
    if (next.finished) {
      focusReplayRef.current = rootRef.current?.contains(document.activeElement) ?? false
      clearSteering()
      setPhase('over')
      records.saveScore({ presents: next.presents, durationMs: Math.floor(next.elapsedMs) })
    }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedRef.current = media.matches
    function updateMotion() {
      reducedRef.current = media.matches
      draw()
    }
    const observer = new ResizeObserver(() => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio))
      canvas.height = Math.round(canvas.width * ROAD_HEIGHT / ROAD_WIDTH)
      const context = canvas.getContext('2d')
      if (!context) {
        console.error('Browseren understøtter ikke spillets Canvas-visning.')
        setCanvasError('Din browser kunne ikke vise spillet. Prøv en anden browser.')
        return
      }
      contextRef.current = context
      draw()
    })
    observer.observe(canvas)
    media.addEventListener('change', updateMotion)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', updateMotion)
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    let frameId: number
    let previousTime: number | null = null
    function frame(time: number) {
      const delta = previousTime === null ? 0 : Math.min(80, time - previousTime)
      previousTime = time
      tick(delta)
      if (!runRef.current?.finished) frameId = window.requestAnimationFrame(frame)
    }
    frameId = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(frameId)
  }, [playing])

  const pauseWhenHidden = useEffectEvent(() => {
    if (document.visibilityState === 'hidden') pause()
  })
  const pauseOnBlur = useEffectEvent(() => pause())
  useEffect(() => {
    document.addEventListener('visibilitychange', pauseWhenHidden)
    window.addEventListener('blur', pauseOnBlur)
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden)
      window.removeEventListener('blur', pauseOnBlur)
    }
  }, [])

  useEffect(() => {
    if (phase === 'over' && focusReplayRef.current) replayRef.current?.focus({ preventScroll: true })
  }, [phase])

  return (
    <section
      ref={rootRef}
      className="sleigh-game"
      aria-label="Julemandens kane"
      onKeyDown={(event) => handleKeys(event, true)}
      onKeyUp={(event) => handleKeys(event, false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) clearSteering() }}
    >
      <div className="sleigh-layout">
        <div className="sleigh-play-area">
          <div className="sleigh-hud">
            <p role="status" aria-label="Gaver"><span>Gaver</span><strong>{hud.presents}</strong></p>
            <p role="timer" aria-label="Overlevelsestid"><span>Tid</span><strong>{formatDuration(hud.elapsedMs)}</strong></p>
            <p role="status" aria-label={`Liv: ${hud.hearts} af 2`} className="sleigh-hearts">
              <span>Liv</span><span aria-hidden="true">{[0, 1].map((heart) => <span key={heart} className={heart < hud.hearts ? 'is-full' : ''}><Icon name="heart" /></span>)}</span>
            </p>
          </div>
          <div className="sleigh-board">
            <canvas
              ref={canvasRef}
              role="slider"
              aria-label="Styr kanen"
              aria-describedby={`${id}-instructions`}
              aria-valuemin={MIN_X}
              aria-valuemax={MAX_X}
              aria-valuenow={Math.round(hud.x)}
              aria-orientation="horizontal"
              aria-disabled={!playing}
              tabIndex={playing ? 0 : -1}
              onPointerDown={(event) => {
                if (!playing) return
                pointerRef.current = event.pointerId
                event.currentTarget.setPointerCapture(event.pointerId)
                steerPointer(event)
              }}
              onPointerMove={steerPointer}
              onPointerUp={() => { pointerRef.current = null }}
              onPointerCancel={clearSteering}
            >
              Styr med piletasterne eller A og D. Saml gaver og undgå forhindringer.
            </canvas>
            {phase !== 'playing' ? (
              <div className="sleigh-overlay">
                <p className="eyebrow">{phase === 'over' ? 'SLUT PÅ TUREN' : phase === 'paused' ? 'EN LILLE PAUSE' : 'KLAR TIL AFGANG?'}</p>
                <h3>{phase === 'over' ? 'Sikke en juletur!' : phase === 'paused' ? 'Kanen venter på dig' : 'Julen har brug for dig'}</h3>
                <p>{phase === 'over'
                  ? `${hud.presents} gaver · ${formatDuration(hud.elapsedMs)} på vejen`
                  : phase === 'paused' ? 'Tiden og vejen står stille, indtil du fortsætter.' : 'To hjerter. Masser af gaver. Hvor længe kan du klare vejen?'}</p>
                <button ref={replayRef} type="button" className="sleigh-start" disabled={canvasError !== null} onClick={phase === 'paused' ? resume : start}>
                  {phase === 'over' ? 'Spil igen' : phase === 'paused' ? 'Fortsæt turen' : 'Start turen'}
                </button>
              </div>
            ) : null}
          </div>
          <div className="sleigh-controls">
            <button type="button" disabled={!playing} aria-label="Styr til venstre" onClick={() => nudge(-1)}><Icon name="arrow" /></button>
            <span>Fart {(speedAt(hud.elapsedMs) / BASE_SPEED).toFixed(1).replace('.', ',')}×</span>
            <button type="button" disabled={!playing} aria-label="Styr til højre" onClick={() => nudge(1)}><Icon name="arrow" /></button>
            {playing ? <button type="button" className="sleigh-pause" onClick={pause}>Pause</button> : null}
          </div>
          {canvasError ? <p role="alert" className="sleigh-error">{canvasError}</p> : null}
          {phase === 'over' ? <p className="sleigh-result" role="status">{game.resultMessage}</p> : null}
        </div>
        <aside className="sleigh-aside">
          <p id={`${id}-instructions`} className="sleigh-instructions">{game.instructions}</p>
          <p className="sleigh-tip">Efter et sammenstød beskytter et gyldent skjold dig kortvarigt. Turen slutter først, når begge hjerter er væk.</p>
          <section className="sleigh-records" aria-label="Vores rekorder">
            <h4>Vores rekorder</h4>
            <p>Flest gaver og længste tur er to separate rekorder.</p>
            {records.scores ? <>
              <PlayerBest name={role === 'admin' ? 'Dine rekorder' : "Andreas' rekorder"} best={records.scores.admin} />
              <PlayerBest name={role === 'josse' ? 'Dine rekorder' : 'Josses rekorder'} best={records.scores.josse} />
            </> : records.loadError ? null : <p role="status">Henter rekorder...</p>}
            {records.loadError ? <p role="alert">{records.loadError} <button type="button" onClick={records.refresh}>Hent rekorder igen</button></p> : null}
            <p>{records.scores?.storage === 'local'
              ? 'Lokal test: Rekorderne gemmes på denne computer, ikke i den rigtige kalender.'
              : 'Jeres rekorder gemmes på tværs af enheder. Spil igen så tit, I vil.'}</p>
          </section>
          {records.saving ? <p className="sleigh-save" role="status">Gemmer dine rekorder...</p> : null}
          {records.saved && !records.saving ? <p className="sleigh-save" role="status">Dine rekorder er gemt.</p> : null}
          {records.saveError ? <p className="sleigh-save" role="alert">{records.saveError} <button type="button" onClick={records.retrySave}>Prøv at gemme igen</button></p> : null}
        </aside>
      </div>
    </section>
  )
}
