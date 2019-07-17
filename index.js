let canvas = document.getElementById('canvas')
let c = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
/*
console.log(canvas.width, canvas.height)
c.fillStyle = 'green'
c.fillRect(10, 10, canvas.width - 10, canvas.height - 10)
*/
const renderHex = (x, y, r) => {
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
  c.stroke()
}

const r = 40
const xstep = r + r * Math.sin(Math.PI / 6) + 8
const ystep = 2 * r * Math.cos(Math.PI / 6) + 4
const yoffset = 2 * r * Math.sin(Math.PI / 6) - 5
for (let j = 0, y = 100; j < 8; j++ , y += ystep) {
  for (let i = 0, x = 100; i < 8; i++ , x += xstep) {
    renderHex(x, y - (i % 2 && yoffset), r)
  }
}