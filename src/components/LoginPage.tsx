import { useState } from 'react'
import type { FormEvent } from 'react'
import { login } from '../lib/session'
import type { CalendarSession } from '../types/session'
import { ChristmasArt, Icon, PineBranch } from './ChristmasArt'

export function LoginPage({ onLogin }: {
  onLogin: (session: CalendarSession) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      onLogin(await login(username, password))
    } catch (cause) {
      console.error('Loginforsøget mislykkedes:', cause)
      setError(cause instanceof Error ? cause.message : 'Kunne ikke logge ind. Prøv igen.')
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="calendar-page login-page">
      <header className="site-header">
        <a className="wordmark" href="#" aria-label="Josses julekalender, forside">
          <ChristmasArt kind="bow" />
          <span>Josses julekalender<span className="wordmark-dot">.</span></span>
        </a>
        <span className="header-date"><Icon name="sparkle" /> EN DECEMBER AT HUSKE</span>
      </header>
      <main className="login-main">
        <div className="hero-branch hero-branch--left"><PineBranch /></div>
        <div className="hero-branch hero-branch--right"><PineBranch /></div>
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-art"><ChristmasArt kind="bow" /></div>
          <p className="eyebrow">EN LILLE HEMMELIGHED. KUN FOR OS.</p>
          <h1 id="login-title">Lidt julemagi<br /><em>venter på dig.</em></h1>
          <p className="login-description">Log ind, og træd indenfor i vores lille december.</p>
          <form className="login-form" onSubmit={submit}>
            <label htmlFor="username">Brugernavn</label>
            <input id="username" name="username" autoComplete="username" required maxLength={128}
              value={username} onChange={(event) => setUsername(event.target.value)} />
            <label htmlFor="password">Adgangskode</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={512}
              value={password} onChange={(event) => setPassword(event.target.value)} />
            {error ? <p className="login-error" role="alert">{error}</p> : null}
            <button type="submit" className="login-button" disabled={submitting}>
              <Icon name="lock" /> {submitting ? 'Logger ind…' : 'Åbn vores december'}
            </button>
          </form>
          <p className="login-signature">Altid med kærlighed <Icon name="heart" /></p>
        </section>
      </main>
      <footer className="site-footer">
        <span>En lille ting, kun til dig.</span>
        <span>LAVET MED KÆRLIGHED <Icon name="heart" /> JUL</span>
      </footer>
    </div>
  )
}
