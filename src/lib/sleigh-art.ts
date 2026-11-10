import { ROAD_HEIGHT, ROAD_WIDTH, SLEIGH_Y } from './sleigh-game'
import type { RoadObject, SleighRun } from './sleigh-game'

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
}

function triangle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width / 2, y + height)
  ctx.lineTo(x - width / 2, y + height)
  ctx.closePath()
  ctx.fill()
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  box(ctx, -4, 17, 8, 15, 2, '#735238')
  triangle(ctx, 0, -26, 44, 49, '#285a4b')
  triangle(ctx, 0, -38, 35, 40, '#32715b')
  triangle(ctx, 0, -45, 25, 30, '#44856a')
  triangle(ctx, 0, -45, 18, 12, '#f2fbff')
  triangle(ctx, -12, -9, 17, 9, '#e1f4ee')
  triangle(ctx, 10, 7, 17, 9, '#e1f4ee')
  ctx.restore()
}

function drawObject(ctx: CanvasRenderingContext2D, object: RoadObject) {
  ctx.save()
  ctx.translate(object.x, object.y)
  ctx.fillStyle = '#29485b25'
  ctx.beginPath()
  ctx.ellipse(3, 23, 24, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  if (object.kind === 'tree') tree(ctx, 0, 0, .9)
  if (object.kind === 'snowman') {
    circle(ctx, 0, 12, 21, '#d3e6ee')
    circle(ctx, -2, 8, 20, '#fffdf5')
    circle(ctx, -2, -16, 14, '#fffdf5')
    box(ctx, -17, -8, 31, 7, 3, '#c8444f')
    box(ctx, 7, -5, 6, 17, 2, '#c8444f')
    box(ctx, -17, -32, 31, 6, 2, '#263c50')
    box(ctx, -12, -44, 21, 15, 2, '#30495e')
    circle(ctx, -7, -19, 1.8, '#273c4d')
    circle(ctx, 2, -19, 1.8, '#273c4d')
    triangle(ctx, -2, -13, 6, 10, '#ef9141')
    circle(ctx, -2, 6, 2, '#273c4d')
    circle(ctx, -2, 16, 2, '#273c4d')
    ctx.strokeStyle = '#79523c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-20, 2)
    ctx.lineTo(-29, -7)
    ctx.moveTo(18, 2)
    ctx.lineTo(27, -7)
    ctx.stroke()
  }
  if (object.kind === 'car') {
    box(ctx, -23, -20, 8, 16, 3, '#253b4d')
    box(ctx, 15, -20, 8, 16, 3, '#253b4d')
    box(ctx, -23, 12, 8, 16, 3, '#253b4d')
    box(ctx, 15, 12, 8, 16, 3, '#253b4d')
    box(ctx, -19, -36, 38, 72, 9, object.id % 2 ? '#eea44b' : '#5579bb')
    box(ctx, -15, -12, 30, 30, 6, '#324960')
    box(ctx, -12, -9, 24, 12, 3, '#bce2ef')
    box(ctx, -12, 12, 24, 6, 2, '#9ccbdc')
    box(ctx, -14, -33, 28, 8, 3, '#eaf5fa')
    box(ctx, -15, 27, 8, 5, 2, '#ffb9a2')
    box(ctx, 7, 27, 8, 5, 2, '#ffb9a2')
  }
  if (object.kind === 'rock') {
    ctx.fillStyle = '#778a9a'
    ctx.beginPath()
    ctx.moveTo(-24, 11)
    ctx.lineTo(-18, -12)
    ctx.lineTo(2, -21)
    ctx.lineTo(22, -9)
    ctx.lineTo(25, 13)
    ctx.lineTo(6, 23)
    ctx.closePath()
    ctx.fill()
    box(ctx, -17, -14, 33, 13, 6, '#effaff')
  }
  if (object.kind === 'present') {
    circle(ctx, 0, 0, 24, '#ffe8a638')
    box(ctx, -15, -12, 30, 29, 3, object.id % 2 ? '#d94b67' : '#498c6b')
    box(ctx, -18, -17, 36, 9, 2, object.id % 2 ? '#f47787' : '#6cad79')
    box(ctx, -3, -17, 6, 34, 0, '#ffe5a0')
    ctx.strokeStyle = '#ffe5a0'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(-6, -22, 7, 4, .5, 0, Math.PI * 2)
    ctx.ellipse(6, -22, 7, 4, -.5, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function sleigh(ctx: CanvasRenderingContext2D, run: SleighRun | null) {
  ctx.save()
  ctx.translate(run?.x ?? ROAD_WIDTH / 2, SLEIGH_Y)
  if (run && !run.finished && run.elapsedMs < run.protectedUntilMs) {
    circle(ctx, 0, -5, 49, '#ffe2a336')
    ctx.strokeStyle = '#e8b44e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(0, -5, 39, 57, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeStyle = '#dfb269'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-24, 31)
  ctx.lineTo(-24, -23)
  ctx.quadraticCurveTo(-24, -39, -15, -35)
  ctx.moveTo(24, 31)
  ctx.lineTo(24, -23)
  ctx.quadraticCurveTo(24, -39, 15, -35)
  ctx.stroke()
  box(ctx, -20, -27, 40, 60, 9, '#8e293e')
  box(ctx, -17, -25, 34, 49, 7, '#c74950')
  box(ctx, -19, 24, 38, 7, 2, '#efc77a')
  circle(ctx, 8, 11, 14, '#4e7955')
  circle(ctx, -5, -2, 12, '#fff7df')
  circle(ctx, -5, -7, 10, '#edc2a0')
  triangle(ctx, -7, -31, 26, 22, '#e04c55')
  box(ctx, -19, -14, 27, 6, 3, '#fff7ed')
  circle(ctx, -7, -31, 4, '#fff7ed')
  ctx.strokeStyle = '#efd3a7'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-14, -23)
  ctx.lineTo(-8, -49)
  ctx.moveTo(14, -23)
  ctx.lineTo(8, -49)
  ctx.stroke()
  circle(ctx, 0, -52, 9, '#ab7b52')
  circle(ctx, 0, -62, 7, '#ba8b5d')
  circle(ctx, 0, -68, 3, '#df4d50')
  ctx.strokeStyle = '#795636'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-5, -66)
  ctx.lineTo(-11, -78)
  ctx.lineTo(-15, -74)
  ctx.moveTo(5, -66)
  ctx.lineTo(11, -78)
  ctx.lineTo(15, -74)
  ctx.stroke()
  ctx.restore()
}

export function drawSleighScene(ctx: CanvasRenderingContext2D, run: SleighRun | null, reducedMotion: boolean) {
  ctx.setTransform(ctx.canvas.width / ROAD_WIDTH, 0, 0, ctx.canvas.height / ROAD_HEIGHT, 0, 0)
  const distance = run?.distance ?? 0
  const sky = ctx.createLinearGradient(0, 0, 0, ROAD_HEIGHT)
  sky.addColorStop(0, '#172f47')
  sky.addColorStop(1, '#28545c')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT)
  box(ctx, 30, -10, 300, ROAD_HEIGHT + 20, 18, '#e9f5f5')
  box(ctx, 44, -10, 272, ROAD_HEIGHT + 20, 12, '#aac7d5')
  ctx.fillStyle = '#c9dfe7'
  ctx.fillRect(51, 0, 258, ROAD_HEIGHT)
  ctx.strokeStyle = '#f3fbff95'
  ctx.lineWidth = 2
  ctx.setLineDash([25, 31])
  ctx.lineDashOffset = -distance % 56
  ctx.beginPath()
  ctx.moveTo(134, 0)
  ctx.lineTo(134, ROAD_HEIGHT)
  ctx.moveTo(226, 0)
  ctx.lineTo(226, ROAD_HEIGHT)
  ctx.stroke()
  ctx.setLineDash([])
  const scenery = reducedMotion ? 0 : distance * .7
  for (let index = -1; index < 6; index++) {
    const y = index * 120 + scenery % 120
    tree(ctx, 13, y, .9)
    tree(ctx, 348, y + 52, 1.05)
    box(ctx, 33, y + 65, 5, 20, 2, '#c44854')
    box(ctx, 322, y + 13, 5, 20, 2, '#c44854')
    box(ctx, 33, y + 65, 5, 7, 1, '#fff8e9')
    box(ctx, 322, y + 13, 5, 7, 1, '#fff8e9')
  }
  if (run) for (const object of run.objects) drawObject(ctx, object)
  else {
    drawObject(ctx, { id: 0, kind: 'snowman', x: 88, y: 120 })
    drawObject(ctx, { id: 1, kind: 'car', x: 272, y: 240 })
    drawObject(ctx, { id: 2, kind: 'present', x: 180, y: 190 })
    drawObject(ctx, { id: 3, kind: 'present', x: 180, y: 300 })
  }
  sleigh(ctx, run)
  if (!reducedMotion) {
    for (let index = 0; index < 18; index++) {
      circle(ctx, (index * 67 + 11) % ROAD_WIDTH, (index * 113 + distance * .35) % ROAD_HEIGHT, index % 3 === 0 ? 2 : 1, '#ffffff90')
    }
  }
}
