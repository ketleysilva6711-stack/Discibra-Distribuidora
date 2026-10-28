// scripts/gen-mobile-banners.mjs
import sharp from 'sharp'
import { readdir, mkdir } from 'node:fs/promises'
const SRC = 'public/banners'
const OUT = 'public/banners/mobile'
await mkdir(OUT, { recursive: true })
for (const f of await readdir(SRC)) {
  if (!f.endsWith('.webp')) continue
  const meta = await sharp(`${SRC}/${f}`).metadata()
  await sharp(`${SRC}/${f}`)
    .resize({ width: 1080, height: 810, fit: 'cover', position: 'left' })
    .webp({ quality: 84 })
    .toFile(`${OUT}/${f}`)
  console.log(`[CROP] ${f}: ${meta.width}x${meta.height} -> 1080x810 (4:3)`)
}
