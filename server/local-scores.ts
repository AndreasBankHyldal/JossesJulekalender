import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { mergeBests, parseSleighHighScores } from '../src/lib/sleigh-game.ts'
import type { SleighHighScores } from '../src/lib/sleigh-game.ts'
import type { SleighScoreStore } from './sleigh-scores.ts'

export function createLocalScoreStore(path: string): SleighScoreStore {
  let queue = Promise.resolve()

  async function readScores(): Promise<SleighHighScores> {
    let content: string
    try {
      content = await readFile(path, 'utf8')
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return { admin: null, josse: null, storage: 'local' }
      }
      throw error
    }
    const scores = parseSleighHighScores(JSON.parse(content))
    if (scores.storage !== 'local') throw new Error('Den lokale rekordfil har forkert format.')
    return scores
  }

  return {
    async read() {
      await queue
      return readScores()
    },
    record(role, result) {
      const operation = queue.then(async () => {
        const scores = await readScores()
        scores[role] = mergeBests(scores[role], result)
        await mkdir(dirname(path), { recursive: true })
        await writeFile(`${path}.tmp`, JSON.stringify(scores), { mode: 0o600 })
        await rename(`${path}.tmp`, path)
        return scores
      })
      // Keep later requests usable; the caller still receives this write's rejection.
      queue = operation.then(() => {}, () => {})
      return operation
    },
  }
}
