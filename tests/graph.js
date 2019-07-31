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

/*
  make a graph of the puzzle board
  find a random spanning tree by doing a random walk of the board
  turns out the pieces are all the possible resulting connections between hexes!
  (considering the curve connecting adjacent sides to go through the center even though
  not rendered that way)
*/

/*
const w = 8 // GRID_WIDTH
const h = 8 // GRID_HEIGHT
console.log('generate G')
const G = generateGraph(w, h)
console.dir(G)
console.log('render G')
renderGraph(G, w, h, HEX_X0, HEX_Y0, RX, RY)
console.log('generate T')
const T = generateSpanningTree(G)
console.dir(T)
console.log('render T')
renderGraph(T, w, h, HEX_X0, HEX_Y0, RX, RY)
*/

/*
0: []
1: [0]
2: [6]
3: [2]
4: [0]
5: [0]
6: [10]
7: [2]
8: [4]
9: [8]
10: [9]
11: [15]
12: [13]
13: [10]
14: [13]
15: [14]
*/

/*
0: [5]
1: [5]
2: [1]
3: [7]
4: [5]
5: [6]
6: [11]
7: [6]
8: [9]
9: [5]
10: []
11: [15]
12: [8]
13: [8]
14: [10]
15: [14]
*/
