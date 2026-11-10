import { useEffect, useRef, useState } from 'react'
import type { AdventGiftSurprise } from '../data/advent'
import { Icon } from './ChristmasArt'

export function GiftSurprise({ surprise, description }: { surprise: AdventGiftSurprise; description: string }) {
  const [revealedHints, setRevealedHints] = useState(0)
  const revealRef = useRef<HTMLDivElement>(null)
  const isRevealed = revealedHints === surprise.hints.length

  useEffect(() => {
    if (isRevealed) revealRef.current?.focus()
  }, [isRevealed])

  return (
    <section className="gift-surprise" aria-labelledby="gift-surprise-title">
      <h3 id="gift-surprise-title" className="eyebrow">EN LILLE HEMMELIGHED</h3>
      <p className="gift-surprise-progress">{revealedHints} af {surprise.hints.length} hints åbnet</p>
      <div aria-live="polite" aria-relevant="additions">
        <ol className="gift-surprise-hints">
          {surprise.hints.slice(0, revealedHints).map((hint, index) => (
            <li key={index}>
              <span className="eyebrow">HINT {index + 1}</span>
              <p>{hint}</p>
            </li>
          ))}
        </ol>
        {isRevealed ? (
          <div className="gift-surprise-reveal" ref={revealRef} tabIndex={-1} role="group" aria-labelledby="gift-surprise-reveal-title">
            <Icon name="heart" />
            <h4 id="gift-surprise-reveal-title">{surprise.revealTitle}</h4>
            <p>{surprise.revealMessage}</p>
            <p className="gift-surprise-timing">{description}</p>
          </div>
        ) : null}
      </div>
      {isRevealed ? null : (
        <button type="button" className="gift-surprise-next" onClick={() => setRevealedHints((count) => Math.min(count + 1, surprise.hints.length))}>
          <Icon name="sparkle" /> Åbn {revealedHints === 0 ? 'første' : 'næste'} hint
        </button>
      )}
    </section>
  )
}
