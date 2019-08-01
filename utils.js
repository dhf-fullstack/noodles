const randomInt = n => {
  return Math.floor(Math.random() * n)
}

Array.prototype.choose = function() {
  return this[randomInt(this.length)]
}

const generateGraph = (W, H) => {
  const G = {}
  for (let n = 0; n < W * H; n++) {
    G[n] = []
    if (n === 0) {
      // top-left corner
      // prettier-ignore
      G[n] = W >= 2 ?
        [n + 1, n + W, n + W + 1] :
        [1]
    } else if (n === (H - 1) * W) {
      // bottom-left corner
      G[n] = [n - W, n + 1].filter(v => 0 <= v && v < H * W) // filter edge cases
    } else if (n === W - 1) {
      // top-right corner
      // prettier-ignore
      G[n] = (((n % W) % 2) ?
        [n - 1, n + W] :
        [n - 1, n + W - 1, n + W])
        .filter(v => 0 <= v && v < H * W) // filter edge cases
    } else if (n === H * W - 1) {
      // bottom-right corner
      // prettier-ignore
      G[n] = ((n % W) % 2) ?
        [n - W, n - W - 1, n - 1] :
        [n - 1, n - W]
    } else if (n % W === 0) {
      // left edge
      // prettier-ignore
      G[n] = [n - W, n + 1, n + W + 1, n + W]
    } else if (n % W === W - 1) {
      // right edge
      // prettier-ignore
      G[n] = ((n % W) % 2) ?
        [n - W, n - W - 1, n - 1, n + W] :
        [n - W, n + W - 1, n - 1, n + W]
    } else if (n < W) {
      // top row
      // prettier-ignore
      G[n] = ((n % W) % 2) ?
        [n - 1, n + W, n + 1] :
        [n - 1, n + W - 1, n + W, n + W + 1, n + 1]
    } else if ((H - 1) * W <= n) {
      // bottom row
      // prettier-ignore
      G[n] = ((n % W) % 2) ?
        [n - 1, n - W - 1, n - W, n - W + 1, n + 1] :
        [n - 1, n - W, n + 1]
    } else {
      // prettier-ignore
      G[n] = ((n % W) % 2) ?
        [n - W, n - W - 1, n - 1, n + W, n + 1, n - W + 1] :
        [n - W, n - 1, n + W - 1, n + W, n + W + 1, n + 1]
      //.filter(v => 0 <= v && v < H * W)
    }
  }
  return G
}

const generateSpanningTree = G => {
  /*
    random walk G starting at some vertex k.
    for each vertex v in G\k save the first
    edge (u, v) traversed. Continue until all
    vertices visited. return the set of saved edges.
  */
  //let attempts = 0
  let valid = false
  let T = {}
  while (!valid) {
    //attempts++
    for (let key in G) {
      T[key] = undefined
    }
    let count = Object.keys(T).length
    let k = Math.floor(Math.random() * count)
    T[k] = []
    count--
    while (count) {
      //debugger
      const v = G[k].choose()
      //console.log(`${count}, ${k} ${G[k]} ${v}`)
      if (T[v] === undefined) {
        T[v] = [k]
        T[k].push(v)
        count--
      }
      k = v
    }
    valid = true
    for (let k in T) {
      if (T[k].length > 4) {
        //console.log(`invalid tree k ${k} T[k] ${T[k]} len T[${k}] ${T[k].length}`)
        valid = false
        T = {}
        break
      }
    }
  }
  //console.log(`generateSpanningTree attempts ${attempts}`)
  return T
}

const renderGraph = (c, G, W, H, X0, Y0, RX, RY) => {
  const nodeCoords = v => {
    const row = Math.floor(v / W)
    const col = v % W
    const x = col * RX
    const y = (row * 2 + (col % 2 ? 0 : 1)) * RY
    return [x, y]
  }

  /*c.fillStyle = COLORS.BACKGROUND
  c.rect(1, 1, W * RX, (3 + H + 3) * RY)
  c.stroke()
  c.fill()*/

  //c.fillStyle = 'GREY'
  /*for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const y = HEX_Y0 + row * RY + (col % 2 ? 0 : RY / 2)
      const x = HEX_X0 + col * RX
      const rr = 3
      c.beginPath()
      c.arc(x, y, rr, 0, 2 * Math.PI, true)
      c.fill()
    }
  }*/

  c.fillStyle = 'GREY'
  for (let v in G) {
    const [x, y] = nodeCoords(v)
    const rr = 3
    c.beginPath()
    c.arc(x + X0, y + Y0, rr, 0, 2 * Math.PI, true)
    c.fill()
    c.fillText(v, x + X0 + 10, y + Y0 + 10)
    G[v].forEach(u => {
      const [w, z] = nodeCoords(u)
      c.beginPath()
      c.moveTo(x + X0, y + Y0)
      c.lineTo(w + X0, z + Y0)
      c.stroke()
    })
  }
}

const patterns = new Array(64)

// prettier-ignore
const pieces = {
  'i': 1,  'c': 3,  ')': 5,  '|': 9,
  'Ш': 7,  'λ': 11, '/': 13, 'Y': 21,
  'K': 15, 'Ψ': 23, 'X': 27,
}

for (let p in pieces) {
  let code = pieces[p]
  for (let orientation = 0; orientation < 6; orientation++) {
    patterns[code] = [p, orientation]
    code = (code * 2) % 63
  }
}

//console.log('patterns')
//console.dir(patterns)

const boardFromTree = (T, H, W) => {
  const side = (v, i) => {
    let a = T[v].indexOf(i) >= 0 ? 1 : 0
    //console.log(`side ${v} ${i} = ${a}`)
    return a
  }
  let B = {}
  for (let v in T) {
    v = Number(v)
    // prettier-ignore
    let P = ((v % W) % 2) ?
              ((((side(v, v + 1) * 2 +
                    side(v, v - W + 1)) * 2 +
                      side(v, v - W)) * 2 +
                        side(v, v - W - 1)) * 2 +
                          side(v, v - 1)) * 2 +
                            side(v, v + W) :
              ((((side(v, v + W + 1) * 2 +
                    side(v, v + 1)) * 2 +
                      side(v, v - W)) * 2 +
                        side(v, v - 1)) * 2 +
                          side(v, v + W - 1)) * 2 +
                            side(v, v + W)
    //console.log(`v ${v} P ${P}, pat ${patterns[P]}`)
    B[v] = patterns[P]
  }
  return B
}

const scrambleBoard = B => {
  let N = {}
  for (let v in B) {
    N[v] = [B[v][0], randomInt(6)] // random orientation
  }
  return N
}
