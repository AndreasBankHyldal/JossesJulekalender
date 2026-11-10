import { createServer } from 'vite'
import { testAuthEnv } from '../tests/fixtures/auth.ts'

if (process.env.VERCEL) throw new Error('Spiltesten må kun køres lokalt.')
Object.assign(process.env, testAuthEnv, {
  CALENDAR_LOCAL_SCORE_FILE: `${process.cwd()}/.local/sleigh-scores.json`,
  VERCEL_ENV: 'development',
})
const server = await createServer({ server: { host: '127.0.0.1', port: 5173 } })
await server.listen()
server.printUrls()
console.log('Lokal spiltest med opdigtede testkonti og lokale rekorder. Ingen adgang til den rigtige kalenderdatabase.')
