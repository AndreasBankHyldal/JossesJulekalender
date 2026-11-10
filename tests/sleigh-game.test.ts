import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  advanceSleighRun, BASE_SPEED, formatDuration, HIT_PROTECTION_MS, MAX_X, MIN_X,
  ROAD_HEIGHT, SLEIGH_Y, speedAt, startSleighRun,
} from '../src/lib/sleigh-game.ts'
import type { RoadObject, Steering } from '../src/lib/sleigh-game.ts'

const idle: Steering = { direction: 0, targetX: null }

test('a fresh run has two hearts, no presents, and no elapsed time', () => {
  const run = startSleighRun()
  assert.equal(run.hearts, 2)
  assert.equal(run.presents, 0)
  assert.equal(run.elapsedMs, 0)
  assert.equal(run.finished, false)
  assert.equal(speedAt(0), BASE_SPEED)
})

test('speed increases smoothly to twice the starting speed at 20 seconds and three times at 40', () => {
  assert.equal(speedAt(0), BASE_SPEED)
  assert.equal(speedAt(10_000), BASE_SPEED * 1.5)
  assert.equal(speedAt(20_000), BASE_SPEED * 2)
  assert.equal(speedAt(40_000), BASE_SPEED * 3)
  assert.equal(speedAt(60_000), BASE_SPEED * 4)
})

test('the faster pace moves both the road and obstacles, not just the speed display', () => {
  const early = startSleighRun()
  early.nextRowDistance = 1e9
  early.objects = [{ id: 0, kind: 'snowman', x: 88, y: 0 }]
  const later = { ...early, elapsedMs: 20_000 }
  const earlyStep = advanceSleighRun(early, 16, idle)
  const laterStep = advanceSleighRun(later, 16, idle)
  assert.ok(laterStep.distance > earlyStep.distance * 1.99)
  assert.equal(earlyStep.objects[0].y, earlyStep.distance)
  assert.equal(laterStep.objects[0].y, laterStep.distance)
})

test('the game lasts beyond 30 seconds, scrolls the road, and gets continuously faster', () => {
  const original = startSleighRun()
  const run = advanceSleighRun(original, 120_000, { direction: 0, targetX: 272 }, () => 0)
  assert.equal(run.finished, false)
  assert.equal(run.hearts, 2)
  assert.equal(run.elapsedMs, 120_000)
  assert.ok(run.distance > BASE_SPEED * 120)
  assert.ok(speedAt(120_000) > speedAt(60_000))
  assert.ok(speedAt(60_000) > speedAt(30_000))
  assert.ok(run.presents > 0)
  assert.equal(original.distance, 0)
})

test('keyboard and pointer steering remain within the road boundaries', () => {
  const left = advanceSleighRun(startSleighRun(), 1000, { direction: -1, targetX: null }, () => 0)
  const right = advanceSleighRun(startSleighRun(), 1000, { direction: 1, targetX: null }, () => 0)
  assert.equal(left.x, MIN_X)
  assert.equal(right.x, MAX_X)
  assert.equal(advanceSleighRun(startSleighRun(), 1000, { direction: 0, targetX: -500 }, () => 0).x, MIN_X)
  assert.equal(advanceSleighRun(startSleighRun(), 1000, { direction: 0, targetX: 900 }, () => 0).x, MAX_X)
})

test('presents are collected exactly once and do not cost a heart', () => {
  const run = startSleighRun()
  run.nextRowDistance = 1e9
  run.objects = [{ id: 0, kind: 'present', x: run.x, y: SLEIGH_Y - 10 }]
  const collected = advanceSleighRun(run, 16, idle)
  assert.equal(collected.presents, 1)
  assert.equal(collected.hearts, 2)
  assert.equal(collected.objects.length, 0)
  assert.equal(advanceSleighRun(collected, 100, idle).presents, 1)
})

test('one collision takes one heart and a shield prevents a pile-up taking both', () => {
  const run = startSleighRun()
  run.nextRowDistance = 1e9
  run.objects = [
    { id: 0, kind: 'snowman', x: run.x, y: SLEIGH_Y },
    { id: 1, kind: 'car', x: run.x, y: SLEIGH_Y },
    { id: 2, kind: 'present', x: run.x, y: SLEIGH_Y },
  ]
  const hit = advanceSleighRun(run, 16, idle)
  assert.equal(hit.hearts, 1)
  assert.equal(hit.finished, false)
  assert.equal(hit.presents, 1)
  assert.equal(hit.protectedUntilMs, 16 + HIT_PROTECTION_MS)
  const protectedRun = { ...hit, objects: [{ id: 3, kind: 'tree', x: hit.x, y: SLEIGH_Y }] as RoadObject[] }
  assert.equal(advanceSleighRun(protectedRun, 100, idle).hearts, 1)
  const expired = advanceSleighRun(hit, HIT_PROTECTION_MS, idle)
  expired.objects = [{ id: 4, kind: 'rock', x: expired.x, y: SLEIGH_Y }]
  const crashed = advanceSleighRun(expired, 16, idle)
  assert.equal(crashed.hearts, 0)
  assert.equal(crashed.finished, true)
  assert.equal(advanceSleighRun(crashed, 1000, idle), crashed)
})

test('fast objects cannot tunnel through the sleigh between frames', () => {
  const run = startSleighRun()
  run.nextRowDistance = 1e9
  run.elapsedMs = 10_000_000
  run.objects = [{ id: 0, kind: 'car', x: run.x, y: 200 }]
  assert.equal(advanceSleighRun(run, 16, idle).hearts, 1)
})

test('all obstacle types can spawn and each row leaves an unobstructed gift lane', () => {
  const types = new Set<string>()
  for (const random of [0, .26, .51, .76]) {
    const run = advanceSleighRun(startSleighRun(), 16, idle, () => random)
    for (const object of run.objects) if (object.kind !== 'present') types.add(object.kind)
  }
  assert.deepEqual(types, new Set(['snowman', 'car', 'tree', 'rock']))
  const hard = startSleighRun()
  hard.elapsedMs = 60_000
  const row = advanceSleighRun(hard, 16, idle, () => 0).objects
  const obstacles = row.filter((object) => object.kind !== 'present')
  assert.equal(obstacles.length, 2)
  assert.ok(row.some((object) => object.kind === 'present' && obstacles.every((obstacle) => obstacle.x !== object.x)))
  assert.equal(new Set(row.map((object) => object.id)).size, row.length)
})

test('off-screen objects are removed, replay resets both scores, and time is formatted consistently', () => {
  const run = startSleighRun()
  run.nextRowDistance = 1e9
  run.objects = [{ id: 0, kind: 'snowman', x: 88, y: ROAD_HEIGHT + 80 }]
  assert.equal(advanceSleighRun(run, 16, idle).objects.length, 0)
  const replay = startSleighRun()
  assert.equal(replay.hearts, 2)
  assert.equal(replay.presents, 0)
  assert.equal(replay.elapsedMs, 0)
  assert.deepEqual(replay.objects, [])
  assert.equal(formatDuration(0), '0:00,0')
  assert.equal(formatDuration(12_345), '0:12,3')
  assert.equal(formatDuration(65_499), '1:05,4')
  assert.throws(() => advanceSleighRun(run, -1, idle), RangeError)
})
