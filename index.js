/*global document, window*/
const canvas = document.getElementById('canvas')
const c = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const mask = document.createElement('canvas')
const m = mask.getContext('2d')
mask.width = window.innerWidth
mask.height = window.innerHeight

const COLORS = {
  BACKGROUND: '#FEFEF3',
  HEXES: '#F3F1E9',
  CONNECTORS: '#C0B4B9',
  ACTIVATED: '#8D7788',
  SOURCE: '#F4F0EA',
}

const GRID_HEIGHT = 8 // for tests 11
const GRID_WIDTH = 8

const R = 42 //35
const r = 39 //33
const RY = 2 * Math.floor(R * Math.cos(Math.PI / 6))
const RX = /*3 * */ R + Math.floor(R * Math.sin(Math.PI / 6))
// the grid seems to have a margin of about 3 hexes above and below
const H = (3 + GRID_HEIGHT + 3) * RY
const W = GRID_WIDTH * RX
const lineWidth = 16

const HEX_X0 = Math.floor(RX / 2)
const HEX_Y0 = 3 * RY

const cssHex = n => {
  return `#${('000000' + n.toString(16)).slice(-6)}`
}

const renderHex = (ctx, x, y, r, color) => {
  const dx = Math.floor(r * Math.cos(Math.PI / 3))
  const dy = Math.floor(r * Math.sin(Math.PI / 3))
  const x1 = x - dx
  const x2 = x + dx
  const y1 = y - dy
  const y2 = y + dy
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y1)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x2, y2)
  ctx.lineTo(x1, y2)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  if (color === undefined) {
    ctx.fillStyle = COLORS.HEXES
  } else {
    ctx.fillStyle = cssHex(color)
  }
  ctx.fill()
  //ctx.stroke()
}

const pixelCoordsToHexIndex = (x, y) => {
  // returns [row, col]
  const c = m.getImageData(x, y, 1, 1).data
  const h = (c[0] * 256 + c[1]) * 256 + c[2]
  if (h >= GRID_WIDTH * GRID_HEIGHT) {
    /* out of bound should always be #ffffff === 16777215 
       but in testing occasionally got unexpected values.
       I don't know if the canvas is doing some color blending
       at edges or if I have a bug.
       Either way, this hack solves it, since the hexes
       are colored [0..((w*h)-1]  */
    return undefined
  } else {
    const row = Math.floor(h / GRID_WIDTH)
    const col = h % GRID_WIDTH
    return [row, col]
  }
}

const canvasClickSubscribers = []

const subscribeToCanvasClick = f => {
  canvasClickSubscribers.push(f)
  return () => {
    const i = canvasClickSubscribers.findIndex(e => e === f)
    if (i >= 0) {
      canvasClickSubscribers.splice(i, 1)
    }
  }
}

canvas.onclick = ev => {
  canvasClickSubscribers.forEach(s => s(ev))
}

// testing
// subscribeToCanvasClick(ev => console.log(pixelCoordsToHexIndex(ev.x, ev.y)))

const unsubscribeGridClick = subscribeToCanvasClick(ev =>
  gridOnClick(ev.x, ev.y)
)

const gridOnClick = (x, y) => {
  const coords = pixelCoordsToHexIndex(x, y)
  if (coords != undefined) {
    const [row, col] = coords
    const [x, y] = hexIndexToCenterCoords(row, col)
    renderHex(c, HEX_X0 + x, HEX_Y0 + y, r, '#ff0000')
  }
}

const hexIndexToCenterCoords = (row, col) => {
  // returns [x, y]
  const dx = R + Math.floor(R * Math.sin(Math.PI / 6))
  const dy = Math.floor(R * Math.cos(Math.PI / 6))
  return [col * dx, row * 2 * dy + (col % 2 ? 0 : dy)]
}

const renderHexGrid = (ctx, x0, y0, R, r) => {
  // outer hexagons of radius R for spacing
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      const [x, y] = hexIndexToCenterCoords(row, col)
      renderHex(ctx, x + x0, y + y0, r)
    }
  }
}

const renderMaskGrid = (ctx, x0, y0, R, r) => {
  // outer hexagons of radius R for spacing
  // note: 1000 + k1000 is pretty!
  let color = 0
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      const [x, y] = hexIndexToCenterCoords(row, col)
      color = row * GRID_WIDTH + col
      renderHex(ctx, x + x0, y + y0, r, color)
    }
  }
}

c.fillStyle = COLORS.BACKGROUND
c.rect(1, 1, W, H)
c.stroke()
c.fill()
renderHexGrid(c, HEX_X0, HEX_Y0, R, r)

m.fillStyle = '#FFFFFF'
m.rect(1, 1, W, H)
m.stroke()
m.fill()
renderMaskGrid(m, HEX_X0, HEX_Y0, R, r)

/* debugging occasional unexpected values on click
c.fillStyle = '#FFFFFF'
c.rect(1, 1, W, H)
c.stroke()
c.fill()
renderMaskGrid(c, HEX_X0, HEX_Y0, R, r)
*/

/*
c.font = '10px serif'
c.fillStyle = '#000000'
for (let row = 0; row < GRID_HEIGHT; row++) {
  for (let col = 0; col < GRID_WIDTH; col++) {
    const [x, y] = hexIndexToCenterCoords(row, col)
    c.fillText((row * GRID_WIDTH + col + 1).toString(10), x + HEX_X0, y + HEX_Y0)
  }
}
*/

/* Render Connectors:

    orientation is [0,6), the sides of the hexagon
    in a quite arbitrary order
    (makes the rotate code cleaner)
        3
       ---
    2 /   \ 4
    1 \   / 5
       ---
        0
*/

const renderTerminus = (x, y, orientation, activated, source = false) => {
  // The o- piece.
  // the pipe is at orientation
  const rr = 11
  const h = Math.floor(r * Math.cos(Math.PI / 6))
  c.beginPath()
  c.arc(x, y, rr, 0, 2 * Math.PI, true)
  c.fillStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.fill()
  c.save()
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.rect(-lineWidth / 2, 0, lineWidth, h)
  c.fill()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderBend = (x, y, orientation, activated, source) => {
  // the /\ piece.
  // the "bottom" of the connector is at orientation
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineJoin = 'round'
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.moveTo(0, cos)
  c.lineTo(0, 0)
  c.rotate((Math.PI / 3) * 2)
  c.lineTo(0, cos)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderStraight = (x, y, orientation, activated, source = false) => {
  // the | piece.
  // the "bottom" of the connector is at orientation
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.moveTo(0, cos)
  c.lineTo(0, -cos)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderCurve = (x, y, orientation, activated, source = false) => {
  // the C piece. the "right hand" side is at orientation (so 0 runs from side 0 to side 1)
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  const sin = Math.floor(r * Math.sin(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.arc(-sin, cos, sin, 0, (-Math.PI * 2) / 3, true)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation, true)
  }
}

const renderSha = (x, y, orientation, activated, source = false) => {
  // the \|/ piece.
  // the center branch is at orientation
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineJoin = 'round'
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.rotate(Math.PI / 3)
  c.moveTo(0, cos)
  c.lineTo(0, 0)
  c.rotate(-Math.PI / 3)
  c.lineTo(0, cos)
  c.moveTo(0, 0)
  c.rotate(-(Math.PI / 3))
  c.lineTo(0, cos)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderTriskelion = (x, y, orientation, activated, source = false) => {
  // the Y piece
  // an arm is at orientation
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.moveTo(0, cos)
  c.lineTo(0, 0)
  c.rotate((-Math.PI / 3) * 2)
  c.lineTo(0, cos)
  c.moveTo(0, 0)
  c.rotate((-Math.PI / 3) * 2)
  c.lineTo(0, cos)
  c.moveTo(0, 0)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderLambda = (x, y, orientation, activated, source = false) => {
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.moveTo(0, cos)
  c.lineTo(0, -cos)
  c.moveTo(0, 0)
  c.rotate(Math.PI / 3)
  c.lineTo(0, cos)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderLambdaFlipped = (x, y, orientation, activated, source = false) => {
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.moveTo(0, cos)
  c.lineTo(0, -cos)
  c.moveTo(0, 0)
  c.rotate(-Math.PI / 3)
  c.lineTo(0, cos)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderPsi = (x, y, orientation, activated, source = false) => {
  // the -<- piece
  // the middle arm of the trio is at orientation
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.rotate(Math.PI / 3)
  c.moveTo(0, cos)
  c.lineTo(0, 0)
  c.rotate(-Math.PI / 3)
  c.lineTo(0, cos)
  c.moveTo(0, 0)
  c.rotate(-(Math.PI / 3))
  c.lineTo(0, cos)
  c.moveTo(0, 0)
  c.rotate((Math.PI / 3) * -2)
  c.lineTo(0, cos)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderChi = (x, y, orientation, activated, source = false) => {
  // the X piece.
  // the right branch of the "bottom" is at orientation
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.moveTo(0, cos)
  c.lineTo(0, -cos)
  c.rotate(Math.PI / 3)
  c.moveTo(0, cos)
  c.lineTo(0, -cos)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderK = (x, y, orientation, activated, source = false) => {
  // the K piece.
  // with the arms pointing left, the bottom branch is at orientation
  const cos = Math.floor(r * Math.cos(Math.PI / 6))
  c.save()
  c.strokeStyle = activated ? COLORS.ACTIVATED : COLORS.CONNECTORS
  c.lineWidth = lineWidth
  c.translate(x, y)
  c.rotate((Math.PI / 3) * orientation)
  c.beginPath()
  c.moveTo(0, cos)
  c.lineTo(0, -cos)
  c.rotate(Math.PI / 3)
  c.moveTo(0, cos)
  c.lineTo(0, 0)
  c.rotate(Math.PI / 3)
  c.moveTo(0, cos)
  c.lineTo(0, 0)
  c.stroke()
  c.restore()
  if (source) {
    renderSourceMarker(x, y, orientation)
  }
}

const renderSourceMarker = (x, y, orientation, special = false) => {
  c.save()
  if (special) {
    const cos = Math.floor(
      20 * Math.cos((Math.PI / 6) * ((orientation + 1) % 6))
    )
    const sin = Math.floor(
      20 * Math.sin((Math.PI / 6) * ((orientation + 1) % 6))
    )
    c.translate(x + sin, y + cos)
    //c.rotate((Math.PI / 3) * orientation + Math.PI / 4)
  } else {
    c.translate(x, y)
    c.rotate((Math.PI / 3) * orientation + Math.PI / 4)
    c.fillStyle = COLORS.SOURCE
  }
  c.fillRect(-5, -5, 10, 10)
  c.restore()
}

/* tests

const testRenderConnectors = (row, f) => {
  let x, y
  for (let col = 0; col < 6; col++) {
    [x, y] = hexIndexToCenterCoords(row, col)
    f(x + HEX_X0, y + HEX_Y0, col, col === 2 || col === 4, true)
  }
}

testRenderConnectors(0, renderTerminus)
testRenderConnectors(1, renderStraight)
testRenderConnectors(2, renderBend)
testRenderConnectors(3, renderCurve)
testRenderConnectors(4, renderSha)
testRenderConnectors(5, renderTriskelion)
testRenderConnectors(6, renderLambda)
testRenderConnectors(7, renderLambdaFlipped)
testRenderConnectors(8, renderPsi)
testRenderConnectors(9, renderChi)
testRenderConnectors(10, renderK)


let f1 = subscribeToCanvasClick(ev => {
  console.log('f1')
})
let f2 = subscribeToCanvasClick(ev => {
  console.log('f2')
})
let f3 = subscribeToCanvasClick(ev => {
  console.log('f3')
  f2()
})

// first click will log f1, f2, f3
// successive clicks will log f1,f3 (f2 having been removed, and calling f2() multiple times is a no-op)
*/

const isCorner = (row, col) => {
  return (
    (row === 0 && col === 0) ||
    (row === GRID_HEIGHT - 1 && col === 0) ||
    (row === 0 && col === GRID_WIDTH - 1) ||
    (row === GRID_HEIGHT - 1 && col === GRID_WIDTH - 1)
  )
}

const isEdge = (row, col) => {
  return (
    row === 0 || row === GRID_HEIGHT - 1 || col === 0 || col === GRID_WIDTH - 1
  )
}

/*
const board = `
i 5 i 5 ) 0 c 5 i 2 c 5 | 2 i 0
i 0 | 2 K 2 ) 1 i 5 | 0 i 0 c 2
) 3 i 0 ) 5 ) 0 | 1 Ψ 2 c 2 i 0
i 5 Ш 3 ) 5 K 2 Ψ 1 Ш 0 / 5 ) 1
) 4 λ 1 ) 4 Ψ 1 / 0 ) 3 λ 5 i 2
| 0 c 5 c 2 i 3 λ 0 ) 0 i 3 ) 0
| 0 i 3 / 1 / 1 i 3 / 0 ) 0 | 0
i 3 i 4 i 3 ) 3 i 2 i 3 i 3 i 3
`.replace(/\s+/g, '')

const source = [3, 0]
*/

const pieceRenderers = {
  i: renderTerminus,
  '|': renderStraight,
  ')': renderBend,
  c: renderCurve,
  Ш: renderSha,
  Y: renderTriskelion,
  λ: renderLambda,
  '/': renderLambdaFlipped,
  Ψ: renderPsi,
  X: renderChi,
  K: renderK,
}

const renderConnector = (
  row,
  col,
  piece,
  orientation,
  activated,
  source = false
) => {
  const f = pieceRenderers[piece]
  if (f !== undefined) {
    f(row, col, orientation, activated, source)
  }
}

/*
const renderPuzzle = (board, [source_row, source_col]) => {
  renderHexGrid(c, HEX_X0, HEX_Y0, R, r)
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      const [x, y] = hexIndexToCenterCoords(row, col)
      const piece = board.substr((row * GRID_WIDTH + col) * 2, 1)
      const orientation = board.substr((row * GRID_WIDTH + col) * 2 + 1, 1)
      const source = row === source_row && col === source_col
      renderConnector(x + HEX_X0, y + HEX_Y0, piece, orientation, true, source)
    }
  }
}

renderPuzzle(board, source)
*/
console.log(2 / Math.sqrt(3))
const G = generateGraph(GRID_WIDTH, GRID_HEIGHT)
renderGraph(G, GRID_WIDTH, GRID_HEIGHT, HEX_X0, HEX_Y0, RX / 2.4, RY)
