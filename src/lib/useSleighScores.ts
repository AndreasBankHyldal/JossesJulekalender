import { useEffect, useRef, useState } from 'react'
import type { AccountRole } from '../types/session'
import { mergeBests } from './sleigh-game'
import type { RunResult, SleighHighScores } from './sleigh-game'
import { requestSleighScores } from './sleigh-scores'

function mergeScores(previous: SleighHighScores | null, incoming: SleighHighScores): SleighHighScores {
  return {
    admin: mergeBests(previous?.admin ?? null, incoming.admin),
    josse: mergeBests(previous?.josse ?? null, incoming.josse),
    storage: incoming.storage,
  }
}

export function useSleighScores(role: AccountRole) {
  const [scores, setScores] = useState<SleighHighScores | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const mounted = useRef(false)
  const pending = useRef<RunResult | null>(null)
  const inFlight = useRef(false)

  function refresh(signal?: AbortSignal) {
    return requestSleighScores(undefined, signal).then((incoming) => {
      if (mounted.current) {
        setScores((previous) => mergeScores(previous, incoming))
        setLoadError(null)
      }
    }, (error: unknown) => {
      if (signal?.aborted) return
      console.error('Kunne ikke hente fælles rekorder:', error)
      if (mounted.current) setLoadError('Rekorderne kunne ikke hentes. Prøv at hente dem igen.')
    })
  }

  async function flush() {
    if (inFlight.current || pending.current === null) return
    inFlight.current = true
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      while (pending.current !== null) {
        const submitted = pending.current
        const incoming = await requestSleighScores(submitted)
        const best = incoming[role]
        if (best === null || best.presents < submitted.presents || best.durationMs < submitted.durationMs) {
          throw new Error('Serveren bekræftede ikke de gemte rekorder.')
        }
        if (pending.current.presents <= best.presents && pending.current.durationMs <= best.durationMs) pending.current = null
        if (mounted.current) {
          setScores((previous) => mergeScores(previous, incoming))
          setLoadError(null)
        }
      }
      if (mounted.current) setSaved(true)
    } catch (error) {
      console.error('Kunne ikke gemme spilrekorden:', error)
      if (mounted.current) setSaveError('Dit resultat er ikke gemt. Hold siden åben, og prøv at gemme igen.')
    } finally {
      inFlight.current = false
      if (mounted.current) setSaving(false)
    }
  }

  function saveScore(result: RunResult) {
    pending.current = mergeBests(pending.current, result)
    void flush()
  }

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    void refresh(controller.signal)
    function update() {
      if (document.visibilityState === 'visible') void refresh(controller.signal)
    }
    const interval = window.setInterval(update, 15_000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      mounted.current = false
      controller.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return { scores, loadError, saveError, saving, saved, refresh: () => { void refresh() }, saveScore, retrySave: () => { void flush() } }
}
