import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { ChristmasArt, Icon, PineBranch } from './components/ChristmasArt'
import { DoorReveal } from './components/DoorReveal'
import type { DoorSelection } from './components/DoorReveal'
import { adventDays } from './data/advent'
import {
  CALENDAR_YEAR,
  daysUntilDecember,
  getUnlockedDay,
  parseProgress,
  serializeProgress,
  STORAGE_KEY,
} from './lib/calendar'
import './App.css'

type Progress = { openedDays: number[]; error: string | null }

function readClock() {
  return new Date()
}

function readProgress(): Progress {
  try {
    return {
      openedDays: parseProgress(window.localStorage.getItem(STORAGE_KEY)),
      error: null,
    }
  } catch (error) {
    console.error('Kunne ikke indlæse kalenderstatus:', error)
    return {
      openedDays: [],
      error: 'Dine gemte låger kunne ikke indlæses. Du kan stadig nyde kalenderen.',
    }
  }
}

function App() {
  const [now, setNow] = useState(readClock)
  const [progress, setProgress] = useState(readProgress)
  const [selection, setSelection] = useState<DoorSelection | null>(null)
  const [notice, setNotice] = useState<{ message: string; id: number } | null>(null)
  const unlockedDay = getUnlockedDay(now)
  const openedCount = progress.openedDays.filter((day) => day <= unlockedDay).length
  const sleeps = daysUntilDecember(now)

  useEffect(() => {
    function updateClock() {
      setNow(readClock())
    }
    function syncProgress(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) {
        setProgress(readProgress())
      }
    }

    const timer = window.setInterval(updateClock, 30_000)
    window.addEventListener('focus', updateClock)
    document.addEventListener('visibilitychange', updateClock)
    window.addEventListener('storage', syncProgress)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', updateClock)
      document.removeEventListener('visibilitychange', updateClock)
      window.removeEventListener('storage', syncProgress)
    }
  }, [])

  function openDoor(day: (typeof adventDays)[number], button: HTMLButtonElement) {
    const currentTime = readClock()
    setNow(currentTime)

    if (day.day > getUnlockedDay(currentTime)) {
      setNotice((previous) => ({
        message: `Lidt tålmodighed, goffe. Låge ${day.day} åbner den ${day.day}. december ${CALENDAR_YEAR}.`,
        id: (previous?.id ?? 0) + 1,
      }))
      return
    }

    setNotice(null)
    if (!progress.openedDays.includes(day.day)) {
      const openedDays = [...progress.openedDays, day.day].sort((a, b) => a - b)
      try {
        window.localStorage.setItem(STORAGE_KEY, serializeProgress(openedDays))
        setProgress({ openedDays, error: null })
      } catch (error) {
        console.error('Kunne ikke gemme kalenderstatus:', error)
        setProgress({
          openedDays,
          error: 'Din browser kunne ikke gemme dine åbnede låger. De kan blive nulstillet, når du forlader siden.',
        })
      }
    }

    const { top, left, width, height } = button.getBoundingClientRect()
    setSelection({ day, origin: { top, left, width, height } })
  }

  return (
    <div className="calendar-page">
      <a className="skip-link" href="#calendar">Spring til kalenderen</a>

      <header className="site-header">
        <a className="wordmark" href="#" aria-label="Josses julekalender, forside">
          <ChristmasArt kind="bow" />
          <span>Josses julekalender<span className="wordmark-dot">.</span></span>
        </a>
        <span className="header-date">
          <Icon name="sparkle" />
          EN DECEMBER AT HUSKE
        </span>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-branch hero-branch--left"><PineBranch /></div>
          <div className="hero-branch hero-branch--right"><PineBranch /></div>
          <span className="hero-star hero-star--one" aria-hidden="true">✧</span>
          <span className="hero-star hero-star--two" aria-hidden="true">✦</span>
          <span className="hero-star hero-star--three" aria-hidden="true">✧</span>

          <p className="eyebrow">LIDT TRADITION. MASSER AF KÆRLIGHED.</p>
          <h1 id="page-title">Den sødeste måde<br />at <em>tælle ned på.</em></h1>
          <p className="hero-description">
            24 små låger. 24 små overraskelser.<br />
            Lidt mere kærlighed, hver dag frem til jul.
          </p>
          <div className="season-pill">
            <Icon name={unlockedDay === 24 ? 'heart' : 'sparkle'} />
            {sleeps > 0
              ? `${sleeps} ${sleeps === 1 ? 'nat' : 'nætter'} til den første lille overraskelse`
              : unlockedDay === 24
                ? 'Glædelig jul, mit yndlingsmenneske'
                : `Det er den ${now.getDate()}. december. Lidt magi venter.`}
          </div>
        </section>

        <section id="calendar" className="calendar-section" aria-labelledby="calendar-title">
          <div className="calendar-heading">
            <div className="calendar-heading-label">
              <span className="tiny-star" aria-hidden="true">✦</span>
              <h2 id="calendar-title">DIN DECEMBER, FYLDT MED KÆRLIGHED</h2>
            </div>
            <span className="calendar-year">1.–24. DECEMBER <span>·</span> {CALENDAR_YEAR}</span>
          </div>

          <div className="calendar-grid">
            {adventDays.map((day) => {
              const isAvailable = day.day <= unlockedDay
              const isOpened = isAvailable && progress.openedDays.includes(day.day)
              const isToday = now.getFullYear() === CALENDAR_YEAR &&
                now.getMonth() === 11 && now.getDate() === day.day

              return (
                <button
                  type="button"
                  key={day.day}
                  className={`calendar-door theme-${day.theme} pattern-${day.pattern}${isOpened ? ' is-opened' : ''}${isToday ? ' is-today' : ''}`}
                  style={{ '--door-index': day.day - 1 } as CSSProperties}
                  aria-label={`${day.day}. december, ${isOpened ? 'åbnet, læs igen' : isAvailable ? 'åbn din overraskelse' : `låst indtil den ${day.day}. december`}`}
                  aria-disabled={!isAvailable}
                  onClick={(event) => openDoor(day, event.currentTarget)}
                >
                  <span className="door-frame" aria-hidden="true" />
                  <span className="door-corner" aria-hidden="true">
                    <Icon name={isOpened ? 'check' : !isAvailable ? 'lock' : 'sparkle'} />
                  </span>
                  <span className="door-art" aria-hidden="true"><ChristmasArt kind={day.art} /></span>
                  <span className="door-number">{day.day}</span>
                  <span className="door-caption">{isOpened ? 'ÅBNET MED KÆRLIGHED' : isToday ? 'LIDT MAGI TIL I DAG' : 'LIDT JULEMAGI'}</span>
                  <span className="door-bottom-star" aria-hidden="true">✧</span>
                </button>
              )
            })}
          </div>

          <div className="calendar-bottom">
            <p className="calendar-hint"><Icon name="lock" /> Hver låge åbner på sin dag. De bedste ting er værd at vente på.</p>
            <div className="progress">
              <span className="progress-dots" aria-hidden="true">
                {adventDays.map(({ day }) => (
                  <span key={day} className={progress.openedDays.includes(day) && day <= unlockedDay ? 'is-filled' : ''} />
                ))}
              </span>
              <span>{openedCount} af 24 små glæder</span>
            </div>
          </div>

          <div className="calendar-notices" aria-live="polite" aria-atomic="true">
            {notice ? <p className="calendar-notice" key={notice.id}><Icon name="heart" />{notice.message}</p> : null}
            {progress.error ? <p className="storage-notice" role="alert">{progress.error}</p> : null}
          </div>
        </section>

        <section className="love-note" aria-label="En hilsen til dig">
          <span className="love-note-line" />
          <ChristmasArt kind="heart" />
          <span className="love-note-line" />
          <p>Fordi jeg elsker dig og fordi, du gør hver dag lidt bedre.</p>
          <span className="love-note-signature">Altid med kærlighed</span>
        </section>
      </main>

      <footer className="site-footer">
        <span>En lille ting, kun til dig.</span>
        <span>LAVET MED KÆRLIGHED <Icon name="heart" /> JUL {CALENDAR_YEAR}</span>
      </footer>

      {selection ? <DoorReveal selection={selection} onClose={() => setSelection(null)} /> : null}
    </div>
  )
}

export default App
