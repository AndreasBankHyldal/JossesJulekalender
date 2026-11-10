export const ROAD_WIDTH = 360
export const ROAD_HEIGHT = 520
export const SLEIGH_Y = 420
export const MIN_X = 58
export const MAX_X = ROAD_WIDTH - MIN_X
export const HIT_PROTECTION_MS = 1_600
export const BASE_SPEED = 160
const LANES = [88, 180, 272]
const OBSTACLES = ['snowman', 'car', 'tree', 'rock'] as const

export type RunResult = { presents: number; durationMs: number }
export type SleighHighScores = {
  admin: RunResult | null
  josse: RunResult | null
  storage: 'shared' | 'local'
}
export type RoadObject = {
  id: number
  kind: typeof OBSTACLES[number] | 'present'
  x: number
  y: number
}
export type SleighRun = {
  x: number
  elapsedMs: number
  distance: number
  nextRowDistance: number
  nextId: number
  objects: RoadObject[]
  presents: number
  hearts: number
  protectedUntilMs: number
  finished: boolean
}
export type Steering = { direction: number; targetX: number | null }

export function isRunResult(value: unknown): value is RunResult {
  return typeof value === 'object' && value !== null &&
    'presents' in value && typeof value.presents === 'number' && Number.isSafeInteger(value.presents) && value.presents >= 0 &&
    'durationMs' in value && typeof value.durationMs === 'number' && Number.isSafeInteger(value.durationMs) && value.durationMs >= 0
}

export function parseSleighHighScores(value: unknown): SleighHighScores {
  if (
    typeof value !== 'object' || value === null ||
    !('admin' in value) || (value.admin !== null && !isRunResult(value.admin)) ||
    !('josse' in value) || (value.josse !== null && !isRunResult(value.josse)) ||
    !('storage' in value) || (value.storage !== 'shared' && value.storage !== 'local')
  ) throw new Error('Serveren sendte et uventet svar om rekorderne.')
  return { admin: value.admin, josse: value.josse, storage: value.storage }
}

export function mergeBests(previous: RunResult | null, incoming: RunResult | null): RunResult | null {
  if (!previous) return incoming
  if (!incoming) return previous
  return { presents: Math.max(previous.presents, incoming.presents), durationMs: Math.max(previous.durationMs, incoming.durationMs) }
}

export function formatDuration(ms: number): string {
  const tenths = Math.floor(ms / 100)
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')},${tenths % 10}`
}

export function speedAt(elapsedMs: number): number {
  return BASE_SPEED * (1 + elapsedMs / 20_000)
}

export function startSleighRun(): SleighRun {
  return {
    x: ROAD_WIDTH / 2, elapsedMs: 0, distance: 0, nextRowDistance: 0,
    nextId: 0, objects: [], presents: 0, hearts: 2, protectedUntilMs: 0, finished: false,
  }
}

function spawnRow(run: SleighRun, random: () => number) {
  const lane = Math.floor(random() * LANES.length)
  const kind = OBSTACLES[Math.floor(random() * OBSTACLES.length)]
  run.objects.push({ id: run.nextId++, kind, x: LANES[lane], y: -50 })
  const secondLane = (lane + 1) % LANES.length
  const doubleObstacle = run.elapsedMs >= 45_000 && random() < .45
  if (doubleObstacle) {
    run.objects.push({
      id: run.nextId++, kind: OBSTACLES[Math.floor(random() * OBSTACLES.length)],
      x: LANES[secondLane], y: -50,
    })
  }
  const giftLane = doubleObstacle ? (lane + 2) % LANES.length : (lane + 1 + Math.floor(random() * 2)) % LANES.length
  run.objects.push({ id: run.nextId++, kind: 'present', x: LANES[giftLane], y: -135 })
  run.nextRowDistance = run.distance + Math.max(170, 265 - run.elapsedMs / 1000)
}

function step(run: SleighRun, deltaMs: number, input: Steering, random: () => number): SleighRun {
  const next = { ...run, objects: run.objects.map((object) => ({ ...object })) }
  next.elapsedMs += deltaMs
  const seconds = deltaMs / 1000
  const movement = input.direction !== 0
    ? Math.max(-1, Math.min(1, input.direction)) * 350 * seconds
    : input.targetX === null ? 0 : Math.max(-550 * seconds, Math.min(550 * seconds, input.targetX - next.x))
  next.x = Math.max(MIN_X, Math.min(MAX_X, next.x + movement))
  const travel = speedAt(next.elapsedMs) * seconds
  next.distance += travel
  const remaining: RoadObject[] = []
  for (const object of next.objects) {
    const previousY = object.y
    object.y += travel
    const halfWidth = object.kind === 'present' ? 14 : object.kind === 'car' ? 18 : 20
    const halfHeight = object.kind === 'present' ? 15 : object.kind === 'car' ? 29 : 25
    const contact = Math.abs(object.x - next.x) < halfWidth + 15 &&
      previousY - halfHeight < SLEIGH_Y + 26 && object.y + halfHeight > SLEIGH_Y - 26
    if (contact) {
      if (object.kind === 'present') next.presents++
      else if (next.elapsedMs >= next.protectedUntilMs) {
        next.hearts--
        next.protectedUntilMs = next.elapsedMs + HIT_PROTECTION_MS
        if (next.hearts === 0) {
          next.finished = true
          break
        }
      }
    } else if (object.y < ROAD_HEIGHT + 60) remaining.push(object)
  }
  next.objects = remaining
  if (!next.finished && next.distance >= next.nextRowDistance) spawnRow(next, random)
  return next
}

export function advanceSleighRun(run: SleighRun, deltaMs: number, input: Steering, random: () => number = Math.random): SleighRun {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('Spillets tidsinterval er ugyldigt.')
  let next = run
  let remaining = deltaMs
  // Small physics steps and swept vertical contact prevent fast obstacles passing through the sleigh.
  while (remaining > 0 && !next.finished) {
    const delta = Math.min(16, remaining)
    next = step(next, delta, input, random)
    remaining -= delta
  }
  return next
}
