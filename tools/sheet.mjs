import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const dir = process.argv[2]
const out = process.argv[3]

const files = fs.readdirSync(dir)
  .filter(f => /^imgi_\d+/.test(f))
  .sort((a, b) => (+a.match(/imgi_(\d+)/)[1]) - (+b.match(/imgi_(\d+)/)[1]))

const TW = 900, TH = 232, PAD = 12, LAB = 30, COLS = 2
const rows = Math.ceil(files.length / COLS)
const W = COLS * (TW + PAD) + PAD
const H = rows * (TH + LAB + PAD) + PAD

const comps = []
const meta = []
let i = 0

for (const f of files) {
  const full = path.join(dir, f)
  const m = await sharp(full).metadata()
  meta.push(`${f}  ${m.width}x${m.height}  ${m.format}`)

  const col = i % COLS, row = Math.floor(i / COLS)
  const x = PAD + col * (TW + PAD)
  const y = PAD + row * (TH + LAB + PAD)

  const buf = await sharp(full).resize(TW, TH, { fit: 'contain', background: '#0d1015' }).toBuffer()
  comps.push({ input: buf, left: x, top: y })

  let grid = `<svg width="${TW}" height="${TH}" xmlns="http://www.w3.org/2000/svg">`
  grid += `<g stroke="#00E58A" stroke-width="1" opacity="0.55">`
  for (let k = 1; k < 10; k++) {
    grid += `<line x1="${TW * k / 10}" y1="0" x2="${TW * k / 10}" y2="${TH}"/>`
    grid += `<line x1="0" y1="${TH * k / 10}" x2="${TW}" y2="${TH * k / 10}"/>`
  }
  grid += `</g><g fill="#00E58A" font-family="Arial" font-size="11" font-weight="bold">`
  for (let k = 1; k < 10; k++) {
    grid += `<text x="${TW * k / 10 + 3}" y="13">${k * 10}</text>`
    grid += `<text x="3" y="${TH * k / 10 - 4}">${k * 10}</text>`
  }
  grid += `</g></svg>`
  comps.push({ input: Buffer.from(grid), left: x, top: y })

  const n = f.match(/imgi_(\d+)/)[1]
  const label = `<svg width="${TW}" height="${LAB}" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="22" font-family="Arial" font-size="20" font-weight="bold" fill="#F07C1F">BANNER ${n}</text>
    <text x="150" y="20" font-family="monospace" font-size="12" fill="#c9d4e0">${m.width}x${m.height} | ${f.slice(0, 38)}</text>
  </svg>`
  comps.push({ input: Buffer.from(label), left: x, top: y + TH })

  i++
}

await sharp({ create: { width: W, height: H, channels: 3, background: '#0d1015' } })
  .composite(comps)
  .png()
  .toFile(out)

console.log(meta.join('\n'))
console.log('SHEET ->', out)