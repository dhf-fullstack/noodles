let canvas = document.getElementById('canvas')
let c = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const COLORS = {
  BACKGROUND: '#FEFEF3',
  HEXES: '#F3F1E9',
  CONNECTORS: '#C0B4B9',
  ACTIVATED: '#8D7788',
  SOURCE: '#F4F0EA',
}

const GRID_HEIGHT = 10
const GRID_WIDTH = 8

const R = 42 //35
const r = 39 //33
const RY = 2 * Math.floor(R * Math.cos(Math.PI / 6))
const RX = 3 * R + Math.floor(R * Math.sin(Math.PI / 6))
// the grid seems to have a margin of about 3 hexes above and below
const H = (3 + GRID_HEIGHT + 3) * RY
const W = 4 * RX
const lineWidth = 16

const HEX_X0 = Math.floor(RX / 2)
const HEX_Y0 = 3 * RY

const renderHex = (c, x, y, r) => {
  const dx = Math.floor(r * Math.cos(Math.PI / 3))
  const dy = Math.floor(r * Math.sin(Math.PI / 3))
  const x1 = x - dx
  const x2 = x + dx
  const y1 = y - dy
  const y2 = y + dy
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x2, y1)
  c.lineTo(x + r, y)
  c.lineTo(x2, y2)
  c.lineTo(x1, y2)
  c.lineTo(x - r, y)
  c.closePath()
  c.fillStyle = COLORS.HEXES
  c.fill()
  //c.stroke()
}

const hexIndexToCenterCoords = (row, col) => {
  const dx = R + Math.floor(R * Math.sin(Math.PI / 6))
  const dy = Math.floor(R * Math.cos(Math.PI / 6))
  return [col * dx, row * 2 * dy + (col % 2 ? 0 : dy)]
}

const renderHexGrid = (c, x0, y0, R, r) => {
  // outer hexagons of radius R for spacing
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      let [x, y] = hexIndexToCenterCoords(row, col)
      renderHex(c, x + x0, y + y0, r)
    }
  }
}

c.fillStyle = COLORS.BACKGROUND
c.rect(1, 1, W, H)
c.stroke()
c.fill()
renderHexGrid(c, HEX_X0, HEX_Y0, R, r)

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

const renderTerminus = (x, y, orientation, activated, source) => {
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
}

const renderStraight = (x, y, orientation, activated, source) => {
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
}

const renderCurve = (x, y, orientation, activated, source) => {
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
}

const renderSha = (x, y, orientation, activated, source) => {
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
}

const renderTriskelion = (x, y, orientation, activated, source) => {
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
}

const renderLambda = (x, y, orientation, activated, source) => {
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
}

const renderLambdaFlipped = (x, y, orientation, activated, source) => {
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
}

const renderPsi = (x, y, orientation, activated, source) => {
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
}

const renderChi = (x, y, orientation, activated, source) => {
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
}

const testRenderConnectors = (row, f) => {
  let x, y
  for (let col = 0; col < 6; col++) {
    [x, y] = hexIndexToCenterCoords(row, col)
    f(x + HEX_X0, y + HEX_Y0, col, col === 2 || col === 4, col === 4)
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
