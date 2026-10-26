import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const dir = process.argv[2]
const files = fs.readdirSync(dir).filter(f => /^imgi_/.test(f))
  .sort((a, b) => (+(a.match(/imgi_(\d+)/)?.[1] || 0)) - (+(b.match(/imgi_(\d+)/)?.[1] || 0)))

console.log('sharp versions:', JSON.stringify(sharp.versions))

for (const f of files) {
  const p = path.join(dir, f)
  const buf = fs.readFileSync(p)
  const head = Buffer.from(buf.subarray(0, 24)).toString('hex').match(/../g).join(' ')
  let info
  try {
    const m = await sharp(p).metadata()
    info = JSON.stringify({ format: m.format, w: m.width, h: m.height, ch: m.channels })
  } catch (e) { info = 'ERRO: ' + e.message }
  console.log(f + '  bytes=' + buf.length)
  console.log('    head=' + head)
  console.log('    sharp=' + info)
}