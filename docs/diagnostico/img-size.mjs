import { readFileSync, readdirSync, existsSync } from 'fs'
function size(b) {
  if (b.toString('ascii', 0, 4) !== 'RIFF') return null
  const cc = b.toString('ascii', 12, 16)
  if (cc === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) }
  if (cc === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3FFF) + 1, h: ((v >> 14) & 0x3FFF) + 1 } }
  if (cc === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3FFF, h: b.readUInt16LE(28) & 0x3FFF }
  return null
}
const dirs = ['public/banners', 'public/banners/mobile'].filter(existsSync)
for (const dir of dirs) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (!f.isFile() || !f.name.endsWith('.webp')) continue
    const s = size(readFileSync(`${dir}/${f.name}`))
    console.log(`${dir}/${f.name}`, s ? `${s.w}x${s.h}` : 'nao lido')
  }
}
