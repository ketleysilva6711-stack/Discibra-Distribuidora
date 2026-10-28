import fs from 'fs';
const p = 'components/store/hero-banner.tsx';
let c = fs.readFileSync(p, 'utf8');
const oldStr = '<Image src={String(banner.image_url ?? "")} alt={String(banner.title ?? `Banner ${i + 1}`)} fill sizes="100vw" priority={i === 0} className="object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />';
const newStr = 'const imgSrc = String(banner.image_url ?? "");\n              const imgAlt = String(banner.title || "Banner " + (i + 1));\n              <Image src={imgSrc} alt={imgAlt} fill sizes="100vw" priority={i === 0} className="object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />';
if (c.includes(oldStr)) {
  c = c.replace(oldStr, newStr);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Sucesso!');
} else {
  console.log('Erro: padrão não encontrado');
  // Tentar encontrar o padrão exato
  const idx = c.indexOf('src={String(banner.image_url');
  if (idx >= 0) {
    console.log('Contexto:', c.substring(idx - 50, idx + 200));
  }
}
