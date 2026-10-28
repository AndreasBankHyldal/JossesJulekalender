import { useId, useState } from 'react'
import type { AdventLetter } from '../data/advent'
import { ChristmasArt, Icon } from './ChristmasArt'

export function WelcomeLetter({ letter }: { letter: AdventLetter }) {
  const [isOpen, setIsOpen] = useState(false)
  const letterId = useId()

  return (
    <div className={`welcome-letter${isOpen ? ' is-open' : ''}`}>
      <div className="welcome-envelope">
        <div className="welcome-snow" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((flake) => <span key={flake}><ChristmasArt kind="snowflake" /></span>)}
        </div>
        <button
          type="button"
          className="welcome-envelope-button"
          aria-expanded={isOpen}
          aria-controls={letterId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="welcome-envelope-art" aria-hidden="true">
            <span className="welcome-envelope-paper"><ChristmasArt kind="sprig" /></span>
            <span className="welcome-envelope-pocket" />
            <span className="welcome-envelope-flap" />
            <span className="welcome-envelope-seal"><Icon name="heart" /></span>
          </span>
          <span className="welcome-envelope-label">{isOpen ? 'Fold brevet sammen' : 'Åbn dit brev'}</span>
        </button>
      </div>
      <article id={letterId} className="welcome-letter-paper" aria-label="Dit decemberbrev" hidden={!isOpen}>
        <p className="welcome-letter-greeting">{letter.greeting}</p>
        {letter.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <p className="reveal-signature">{letter.signature} <Icon name="heart" /></p>
      </article>
    </div>
  )
}
