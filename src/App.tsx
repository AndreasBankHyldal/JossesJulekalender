import { useEffect, useState } from 'react'
import { Calendar } from './components/Calendar'
import { LoginPage } from './components/LoginPage'
import { getSession, logout } from './lib/session'
import type { CalendarSession } from './types/session'
import './App.css'

function App() {
  const [session, setSession] = useState<CalendarSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getSession(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setSession(result) })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        console.error('Kalenderens session kunne ikke indlæses:', cause)
        setError(cause instanceof Error ? cause.message : 'Kunne ikke indlæse dit login. Prøv igen.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  async function signOut() {
    setLoggingOut(true)
    setError(null)
    try {
      await logout()
      setSession(null)
    } catch (cause) {
      console.error('Kunne ikke logge ud:', cause)
      setError('Kunne ikke logge ud. Prøv igen.')
    } finally {
      setLoggingOut(false)
    }
  }

  if (!session) {
    return <LoginPage loadingSession={loading} sessionError={error} onLogin={(result) => {
      setError(null)
      setSession(result)
    }} />
  }
  return <Calendar key={session.role} session={session} onLogout={signOut} loggingOut={loggingOut} logoutError={error} />
}

export default App
