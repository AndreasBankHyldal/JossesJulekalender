import { useState } from 'react'
import { Calendar } from './components/Calendar'
import { LoginPage } from './components/LoginPage'
import { logout } from './lib/session'
import type { CalendarSession } from './types/session'
import './App.css'

function App() {
  const [session, setSession] = useState<CalendarSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

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
    return <LoginPage onLogin={(result) => {
      setError(null)
      setSession(result)
    }} />
  }
  return <Calendar key={session.role} session={session} onLogout={signOut} loggingOut={loggingOut} logoutError={error} />
}

export default App
