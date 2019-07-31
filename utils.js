Array.prototype.choose = function() {
  return this[Math.floor(Math.random() * this.length)]
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

  let T = {}
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
      count--
    }
    k = v
  }

  return T
}

const renderGraph = (G, W, H, X0, Y0, RX, RY) => {
  const nodeCoords = v => {
    const row = Math.floor(v / W)
    const col = v % W
    const y = Y0 + row * RY + (col % 2 ? 0 : RY / 2)
    const x = X0 + col * RX
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
    c.arc(x, y, rr, 0, 2 * Math.PI, true)
    c.fill()
    G[v].forEach(u => {
      const [w, z] = nodeCoords(u)
      c.beginPath()
      c.moveTo(x, y)
      c.lineTo(w, z)
      c.stroke()
    })
  }
}
