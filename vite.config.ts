import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { calendarApi } from './server/vite-api.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), calendarApi(env)],
    server: {
      fs: {
        deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/**', '**/api/**', '**/src/data/advent.ts'],
      },
    },
  }
})
