import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { handleApi } from './api.ts'

async function middleware(
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
  env: Record<string, string>,
) {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  if (url.pathname !== '/api' && url.pathname !== '/api/') return next()

  try {
    const headers = new Headers()
    for (let index = 0; index < request.rawHeaders.length; index += 2) {
      headers.append(request.rawHeaders[index], request.rawHeaders[index + 1])
    }
    const init: RequestInit = { method: request.method, headers }
    if (request.method === 'POST') {
      request.setEncoding('utf8')
      let body = ''
      for await (const chunk of request) {
        if (typeof chunk !== 'string') throw new TypeError('Uventet format i loginforespørgslen.')
        body += chunk
        if (Buffer.byteLength(body, 'utf8') > 4096) {
          response.writeHead(413, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          response.end(JSON.stringify({ error: 'Loginoplysningerne er for lange.' }))
          return
        }
      }
      init.body = body
    }
    const result = await handleApi(new Request(url, init), env)
    response.statusCode = result.status
    result.headers.forEach((value, key) => response.setHeader(key, value))
    response.end(await result.text())
  } catch (error) {
    console.error('Den lokale loginserver fejlede:', error)
    response.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify({ error: 'Loginserveren kunne ikke svare. Prøv igen om lidt.' }))
  }
}

export function calendarApi(env: Record<string, string>): Plugin {
  const handler = (request: IncomingMessage, response: ServerResponse, next: () => void) =>
    middleware(request, response, next, env)
  return {
    name: 'calendar-api',
    configureServer(server) { server.middlewares.use(handler) },
    configurePreviewServer(server) { server.middlewares.use(handler) },
  }
}
