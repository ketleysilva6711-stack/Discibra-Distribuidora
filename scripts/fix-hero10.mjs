import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');

// Substituir a linha do Image completamente
const oldLine = '              <Image src={String(banner.image_url ?? "")} alt={String(banner.title ?? `Banner ${i + 1}`)} fill sizes="100vw" priority={i === 0} className="object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />';
const newLine = '              <Image src={String(banner.image_url ?? "")} alt={String(banner.title || "Banner " + (i + 1))} fill sizes="100vw" priority={i === 0} className="object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />';

if (c.includes(oldLine)) {
  c = c.replace(oldLine, newLine);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Sucesso na linha do Image');
} else {
  console.log('Padrão não encontrado');
  // Mostrar o que está na linha 86
  const lines = c.split('\n');
  if (lines[85]) {
    console.log('Linha 86:', lines[85]);
  }
}
