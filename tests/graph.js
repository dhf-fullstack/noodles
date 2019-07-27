/*global document, window*/
const canvas = document.getElementById('canvas')
const c = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const COLORS = {
  BACKGROUND: '#FEFEF3',
  HEXES: '#F3F1E9',
  CONNECTORS: '#C0B4B9',
  ACTIVATED: '#8D7788',
  SOURCE: '#F4F0EA',
}

const GRID_HEIGHT = 8 // for tests 11
const GRID_WIDTH = 8

const R = 15
const r = 33
const RY = 2 * Math.floor(R * Math.cos(Math.PI / 6))
const RX = 3 * R + Math.floor(R * Math.sin(Math.PI / 6))
// the grid seems to have a margin of about 3 hexes above and below
const H = (3 + GRID_HEIGHT + 3) * RY
const W = GRID_WIDTH * RX
const lineWidth = 16

const HEX_X0 = Math.floor(RX / 2)
const HEX_Y0 = 3 * RY

const generateGraph = (W, H) => {
  const G = {}
  for (let n = 0; n < W * H; n++) {
    G[n] = []
    if (n === 0) {
      // top-left corner
      G[n] = [1, W, W + 1].filter(v => 0 <= v && v < H * W) // filter for edge cases W === 1 or H === 1
    } else if (n === (H - 1) * W) {
      // bottom-left corner
      G[n] = [n - W, n + 1]
    } else if (n === W - 1) {
      // top-right corner
      // prettier-ignore
      G[n] = (n % 2) ?
             [n - 1, n + W] :
             [n - 1, n + W - 1, n + W]
    } else if (n === H * W - 1) {
      // bottom-right corner
      // prettier-ignore
      G[n] = (n % 2) ?
             [n - W, n - W - 1, n - 1] :
             [n - W, n - W - 1]
    } else if (n % W === 0) {
      // left edge
      // prettier-ignore
      G[n] = [n - W, n + 1, n + W + 1, n + W]
    } else if (n % W === W - 1) {
      // right edge
      // prettier-ignore
      G[n] = (n % 2) ?
             [n - W, n - W - 1, n - 1, n + W] :
             [n - 1, n + W - 1, n + W]
    } else {
      // prettier-ignore
      G[n] = ((n % 2) ?
              [n - W, n - 1, n + W - 1, n + W, n + W + 1, n + 1] : 
              [n - W, n - W - 1, n - 1, n + W, n + 1, n - W + 1])
             .filter(v => 0 <= v && v < H * W)
    }
  }
  console.dir(G)
  return G
}

/*
  make a graph of the puzzle board
  find a random spanning tree by doing a random walk of the board
  turns out the pieces are all the possible resulting connections between hexes!
  (considering the curve connecting adjacent sides to go through the center even though
  not rendered that way)
*/

const renderGraph = (G, H, W, X0, Y0, RX, RY) => {
  const nodeCoords = v => {
    const row = Math.floor(v / W)
    const col = v % W
    const y = Y0 + row * RY
    const x = X0 + col * RX
    return [x, y]
  }

  c.fillStyle = COLORS.BACKGROUND
  c.rect(1, 1, W * RX, (3 + H + 3) * RY)
  c.stroke()
  c.fill()

  c.fillStyle = 'GREY'
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const y = HEX_Y0 + row * RY
      const x = HEX_X0 + col * RX
      const rr = 3
      c.beginPath()
      c.arc(x, y, rr, 0, 2 * Math.PI, true)
      c.fill()
    }
  }

  for (let v in G) {
    const [x, y] = nodeCoords(v)
    for (let u of G[v]) {
      const [w, z] = nodeCoords(u)
      c.beginPath()
      c.moveTo(x, y)
      c.lineTo(w, z)
      c.stroke()
    }
  }
}

const generateSpanningTree = G => {
  /*
    random walk G starting at some vertex k.
    for each vertex v in G\k save the first
    edge (u, v) traversed. Continue until all
    vertices visited. return the set of saved edges.
  */

  let T = {}
  for (let key in Object.keys(G)) {
    T[key] = undefined
  }
  let count = Object.keys(G).length
  let k = Math.floor(Math.random() * count)
  T[k] = []
  count--
  while (count) {
    debugger
    const v = G[k].choose()
    console.log(`${count}, ${k} ${G[k]} ${v}`)
    if (T[v] === undefined) {
      T[v] = [k]
      count--
    }
    k = v
  }
  return T
}

const w = 3 // GRID_WIDTH
const h = 3 // GRID_HEIGHT
const G = generateGraph(w, h)
renderGraph(G, w, h, HEX_X0, HEX_Y0, RX, RY)
//const T = generateSpanningTree(G)
//console.log(T)
//renderGraph(T, GRID_WIDTH, HEX_X0, HEX_Y0, RX, RY)