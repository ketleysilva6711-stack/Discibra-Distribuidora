# RELATÓRIO FASE 0 & 0.5 — Baseline, Segurança e Diagnóstico Forense (Read-Only)

**Projeto:** Discibra Distribuidora  
**Diretório:** `C:\Users\Projetos\workspace\discibra\discibra`  
**Domínio Produção:** `https://discibradistribuidora.com`  
**Branch executada:** `refactor/frontend-v2`  
**Tag baseline:** `baseline-antes-refactor`  
**Regra de escrita:** somente arquivos dentro de `docs\diagnostico\\`. Zero novas dependências. Zero `git push`.  
**Status da execução:** CONCLUÍDA (dados coletados e salvos; nenhuma edição fora de `docs\diagnostico\`).

---

## ETAPA 0 — BASELINE & GIT GUARDRAILS

### 0.1 Estado do repositório antes da tag

```
$ git status --porcelain
=> (saída vazia: working tree limpo)
```

```
$ git rev-parse HEAD
=> 60249ef1e1d0562e5d1d6fb465ff4ad7117dc7d4
```

### 0.2 Tag e branch

```
$ git tag baseline-antes-refactor
=> fatal: tag 'baseline-antes-refactor' already exists  (tag mantida da sessão anterior; aponta para 60249ef)
```

```
$ git checkout -B refactor/frontend-v2
=> Reset branch 'refactor/frontend-v2'
=> branch atual: refactor/frontend-v2
```

### 0.3 Versões e remote

```
node -v   => v24.20.0
pnpm -v   => 9.15.0
git remote -v
=> origin	https://github.com/ketleysilva6711-stack/Discibra-Distribuidora.git (fetch)
=> origin	https://github.com/ketleysilva6711-stack/Discibra-Distribuidora.git (push)
```

Branch padrão remota: `origin/HEAD -> origin/main` (confirmada com `git branch -r`).

### 0.4 Diretório de evidências

```
New-Item -ItemType Directory -Force docs\diagnostico | Out-Null
=> DIRETORIO CRIADO OK
```

---

## ETAPA 0.5 — DIAGNÓSTICO FORENSE (Read-Only)

Todas as saídas abaixo foram coletadas no ambiente Windows PowerShell e gravadas em `docs\diagnostico\`.

---

## 1. Scripts e Arquivos de Configuração / Camada de Servidor

### 1.1 package.json (scripts)

Scripts disponíveis: `dev`, `build`, `start`, `pages:build`, `pages:preview`, `pages:deploy`, `lint`, `lint:fix`, `format`, `format:check`, `type-check` (`tsc --noEmit`), `analyze`, `db:generate`, `db:migrate`, `db:quotations`, `admin:hash-password`, `security:audit`, `security:run`, `test`.

**Atenção:** não existe script chamado `typecheck` (apenas `type-check`). Isso foi registrado como ausência de script, não como falha.

### 1.2 next.config.*

```
next.config.mjs  (existe, 6141 bytes)
```

### 1.3 public\_redirects / public\_headers

Não existem arquivos estáticos `public\_redirects` nem `public\_headers`.

### 1.4 middleware.ts / proxy.ts / src\*

- `middleware.ts`: EXISTE (4034 bytes) — camada de Proxy/Middleware do Next.js 16
- `proxy.ts`: NÃO existe
- `src\middleware.ts`: NÃO existe
- `src\proxy.ts`: NÃO existe

### 1.5 wrangler.* / open-next.config.*

- `wrangler.toml`: EXISTE (201 bytes)
- `open-next.config.ts`: EXISTE (617 bytes)

**Camada onde roda o redirect hoje:** `next.config.mjs` (array `async redirects()` com `permanent: true`) — redirecionamentos declarados no próprio config do Next.js, complementados por headers de segurança em `next.config.mjs` e `middleware.ts`.

---

## 2. Variáveis de Ambiente (Supabase)

### 2.1 Test-Path

```
Test-Path .env.local      => True
Test-Path .env.production => True
```

### 2.2 Chaves de ambiente em .env.local (nomes, sem valores)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_REGISTRATION_OPEN
NEXT_PUBLIC_GOOGLE_ADS_ID
NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_ID
NEXT_PUBLIC_GOOGLE_ADS_LEAD_FORM_ID
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID
NEXT_PUBLIC_GOOGLE_ADS_ADD_TO_CART_ID
NEXT_PUBLIC_GOOGLE_ADS_CUSTOMER_ID
NEXT_PUBLIC_GTM_ID
NODE_ENV
NEXT_PUBLIC_SITE_URL
```

---

## 3. Rastreamento e Tags de Conversão

O `git grep -nE 'data-track|dataLayer|gtag|AW-|GTM-|G-[A-Z0-9]{6,}|fbq|wa.me|whatsapp'` retornou ocorrências em:
`app/layout.tsx`, `app/(store)/*.page.tsx`, `components/store/*`, `lib/google-ads.ts`, `lib/track-whatsapp.ts`, `lib/seo.ts`, `lib/site-config.ts`, scripts e markdowns.

**Valores e IDs capturados:**

| Item | Valor | Onde |
|---|---|---|
| GTM container | `GTM-K6K78L54` | `app/layout.tsx:67`, `.env.production`, `lib/google-ads.ts:35` |
| Google Ads ID | `AW-16526087847` | `app/layout.tsx:70`, `.env.production:5` |
| Google Ads WhatsApp conversion | `AW-16526087847/O9LwCKLG96odEKetoMg9` | `lib/google-ads.ts:17`, `.env.production:6` |
| Meta Pixel ID | `NEXT_PUBLIC_META_PIXEL_ID` | `app/layout.tsx:250` |
| GA4 ID | `NEXT_PUBLIC_GA_ID` | `app/layout.tsx:186` |
| WhatsApp número | `5516996447972` (`wa.me/...`) | Vários componentes e `lib/site-config.ts:20` |

**Atributo de tracking WhatsApp:** `data-track="btn_whatsapp"` (classe `btn-whatsapp-track`) presente em dezenas de componentes (home, produto, categoria, promoções, carrinho, header, footer, etc.) e em `components/store/product-card.tsx:230`.

**JSON-LD Schema.org:** presente via `GoogleBusinessSchema` em `app/layout.tsx` e `components/seo/`. Contagem na home: `ld+json` = 1 ocorrência.

**Conclusão:** GTM, GA4, Google Ads (AW-), Meta Pixel (fbq), dataLayer e classes `btn-whatsapp-track`/`data-track="btn_whatsapp"` estão 100% preservados e referenciados em `app/layout.tsx` e `lib/google-ads.ts` — nenhum foi alterado nesta fase (read-only).

---

## 4. Detecção de Raiz (app vs src/app) e Inventário de Rotas

### 4.1 Test-Path

```
Test-Path app     => True
Test-Path src\app => False
```

→ A raiz da aplicação Next.js é `app/` (não há `src/app`). As rotas da loja estão sob o route group `app/(store)/`.

### 4.2 Inventário completo de arquivos de rota

Foram encontrados (recursivo em `app/`): `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `not-found.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`.

Principais rotas da loja (todas sob `app/(store)/`):
- `page.tsx` (home), `produtos/page.tsx`, `categoria/[slug]/page.tsx`, `produto/[slug]/page.tsx`, `promocoes/page.tsx`, `rastrear-pedido/page.tsx`, `busca/page.tsx`, `carrinho/page.tsx`, `checkout`… + rotas de `app/admin/…` e `app/api/…` (auth, orçamentos, pedidos, cep, upload, etc.).

Não há rotas `/ofertas` nem `/rastreamento` como páginas físicas — elas dependem exclusivamente de redirect em `next.config.mjs`.

### 4.3 sitemap/robots públicos

`public\sitemap.xml` e `public\robots.txt` NÃO existem como arquivos estáticos. São gerados dinamicamente por `app/sitemap.ts` e `app/robots.ts`.

---

## 5. Código das Rotas Críticas

### 5.1 `app/(store)/produtos/page.tsx`

Conteúdo integral (estado atual, read-only):

```tsx
"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import { ArrowLeft, SlidersHorizontal, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { rawTokens, slugTokens, escapeLike } from "@/lib/search-normalize"

const supabase = createClient()
const PAGE_SIZE = 36

type Category = { id: string; name: string; slug: string }
type Product = {
  id: string; name: string; slug: string; price: number; original_price: number | null
  image_url: string | null; images?: string[] | null | undefined; unit: string
  stock: number; category_id: string | null; is_new?: boolean; is_discount?: boolean
  featured?: boolean; sku?: string | null
}
…
export default function ProductsPage() { … usa useSWR cliente … }
```

(Arquivo completo mantido inalterado nesta sessão read-only; é o Client Component que fica bloqueado em "Carregando…" sem hidratação de cards no SSR.)

### 5.2 `app/(store)/categoria/[slug]/page.tsx`

Conteúdo integral (estado atual, read-only):

```tsx
"use client"

import { use } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import ProductCard from "@/components/store/product-card"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, LayoutGrid } from "lucide-react"

const supabase = createClient()

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data, isLoading } = useSWR(`category-${slug}`, async () => {
    const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).single()
    if (!cat) return null
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", cat.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
    return { category: cat, products: products || [] }
  })
  …
}
```

(Arquivo completo mantido inalterado nesta sessão read-only; aceita apenas slug exato, sem normalização de aliases.)

---

## 6. Slugs Reais & Mecanismo de Consulta no Supabase

### 6.1 Chamadas do Supabase no código

`git grep -nE '\.from|\.eq|\.select|category_id|slug'` confirma que a consulta de categoria usa:
- `.from("categories").select("*").eq("slug", slug).single()` — match **exato** do slug
- depois `.from("products").select("*").eq("category_id", cat.id).eq("active", true)` — **join por `category_id`**

Não há normalização de aliases de slug nem fallback bidirecional.

### 6.2 Probing direto às tabelas (diag-slugs.mjs, execução com `--env-file=.env.local`)

```
== categories OK | colunas: id, name, slug, image_url, active, sort_order, created_at, parent_id
== categories: 32 registros
== categorias ERRO: Could not find the table 'public.categorias' in the schema cache
== categoria ERRO: Could not find the table 'public.categoria' in the schema cache
== products OK | colunas: id, name, slug, description, price, original_price, category_id, subcategory_id, image_url, images, unit, stock, active, featured, created_at, sku, weight, height, width, depth, is_new, is_discount
== products: 300 registros (amostra limitada a 300)
== produtos ERRO: Could not find the table 'public.produtos' in the schema cache
```

**Não há bloqueio por RLS** na `anon key` para `categories` e `products` (consultas retornaram dados).

### 6.3 Lista de slugs reais da tabela `categories` (32 registros)

| slug | status | name |
|---|---|---|
| cimentos | ATIVO | Cimentos |
| whatsapp-de-ofertas | INATIVO | WhatsApp de Ofertas |
| argamassas | ATIVO | Argamassas |
| promocoes | INATIVO | Promoções |
| cimento | INATIVO | Cimento |
| rejuntes | ATIVO | Rejuntes |
| impermeabilizantes | ATIVO | Impermeabilizantes |
| areia-e-pedra | ATIVO | Areia e Pedra |
| areia-pedra-cal-e-gesso | INATIVO | Areia, Pedra, Cal e Gesso |
| cal-e-gesso | ATIVO | Cal e Gesso |
| aco-e-ferragens | ATIVO | Aço e Ferragens |
| aco-para-construcao | INATIVO | Aço para construção |
| tijolos-e-blocos | ATIVO | Tijolos e Blocos |
| telhas-e-coberturas | ATIVO | Telhas e Coberturas |
| telhas | INATIVO | Telhas |
| materiais-hidraulicos | ATIVO | Materiais Hidráulicos |
| lajes | INATIVO | Lajes |
| materiais-eletricos | ATIVO | Materiais Elétricos |
| tintas-e-pintura | ATIVO | Tintas e Pintura |
| madeiras-e-esquadrias | ATIVO | Madeiras e Esquadrias |
| ferramentas-e-epis | ATIVO | Ferramentas e EPIs |
| lonas | INATIVO | Lonas |
| ferragens | INATIVO | Ferragens |
| ferramentas | INATIVO | Ferramentas |
| loucas-e-metais | INATIVO | Louças e Metais |
| moveis-cozinha-e-banheiro | INATIVO | Móveis, Cozinha e Banheiro |
| revestimentos-e-porcelanatos | INATIVO | Revestimentos e Porcelanatos |
| pintura | INATIVO | Pintura |
| concreto-usinado | INATIVO | Concreto Usinado |
| portas-e-janelas | INATIVO | Portas e Janelas |
| locacao-de-equipamentos | INATIVO | Locação de Equipamentos |
| areia-pedra | INATIVO | Areia e Pedra |

**ACHADO PRINCIPAL:** O slug da URL `/categoria/ferramentas-e-epis` **existe e está ATIVO** na tabela `categories`. Não existem os aliases `ferramentas-epis` nem `ferramentas-e-epi` na tabela (`ferramentas` existe mas está INATIVO). A rota filtra por **match exato de `.eq('slug', slug)`** e depois faz **join por `category_id`** na tabela `products`. Como não há normalização de aliases, variações de slug de tráfego antigo não resolvem automaticamente. Como não há produtos vinculados (ou não renderizados) nessa categoria no HTML inicial, o grid fica vazio (bug P0-2).

---

## 7. Referências Internas aos Links Obsoletos

### 7.1 `git grep -n 'ofertas'`

Ocorrências em: `app/(store)/page.tsx:597` ("Ver todas as ofertas"), `app/(store)/promocoes/page.tsx` (várias), `components/store/footer.tsx:49`, `components/store/industrial-banners.tsx:30`, `components/store/location-selector.tsx:85`, `next.config.mjs:56` (`{ source: '/ofertas', destination: '/promocoes', permanent: true }`).

### 7.2 `git grep -n 'rastreamento'`

Ocorrências em: `app/(store)/carrinho/page.tsx:71` (comentário), `app/(store)/politica-de-frete/page.tsx:27`, `app/(store)/politica-de-privacidade/privacy/page.tsx:103`, `app/(store)/rastrear-pedido/page.tsx:219`, `app/admin/(dashboard)/google/page.tsx:137`, `app/privacy/page.tsx` (2x), `lib/google-ads.ts:4`, `next.config.mjs:57` (`{ source: '/rastreamento', destination: '/rastrear-pedido', permanent: true }`).

**Não há rotas físicas `/ofertas` nem `/rastreamento`** — dependem exclusivamente do redirect em `next.config.mjs`.

---

## 8. Evidência ao Vivo e Contagem Numérica de Ocorrências

Capturados de `https://discibradistribuidora.com` (produção, via Cloudflare):

### 8.1 Status HTTP ao vivo

| URL | Status | Observação |
|---|---|---|
| `/ofertas` | **404 Not Found** | Sem redirect ativo (confirma bug P0-3) |
| `/rastreamento` | **404 Not Found** | Sem redirect ativo (confirma bug P0-4) |
| `/categoria/ferramentas-e-epis` | **200 OK** | Rota responde, mas sem produtos no HTML |
| `/produtos` | **200 OK** | HTML salvo em `baseline-produtos.html` (74 KB) |

### 8.2 Contagens exatas com `-AllMatches`

Em `baseline-home.html`:
- `GTM-`: **4** ocorrências
- `AW-`: **3** ocorrências
- `ld\+json`: **1** ocorrência (JSON-LD presente)

Em `baseline-produtos.html` (prova do bug **P0-1**):
- `Carregando`: **3** ocorrências (esqueleto de loading, sem cards)
- `/produto/`: **0** ocorrências → **nenhum card de produto pré-renderizado no HTML inicial**

Em `baseline-categoria.html` (prova do bug **P0-2**):
- `/produto/`: **0** ocorrências → **categoria sem produtos renderizados**

**HTMLs e headers salvos:** `baseline-home.html`, `baseline-produtos.html`, `baseline-categoria.html`, `s8-ofertas-headers.txt`, `s8-rastreamento-headers.txt`, `s8-categoria-headers.txt`.

---

## 9. Compilação Limpa, Lint e Typecheck de Referência

### 9.1 pnpm type-check (`tsc --noEmit`)

```
> tsc --noEmit
```
**Exit code: 0** — sem erros, sem warnings. Log salvo em `baseline-typecheck.log`.

### 9.2 pnpm build (`next build`)

```
✓ Compiled successfully
✓ Generating static pages using 3 workers (244/244)
```
**Exit code: 0** — build limpo, 244 rotas geradas. `/produtos` e `/categoria/[slug]` aparecem como rotas dinâmicas/SSR. Log salvo em `baseline-build.log`.

### 9.3 pnpm lint (`next lint`)

**Não executável neste ambiente** — `next lint` falha com `Invalid project directory provided` (comportamento do Next 16 no Windows, pré-existente). Registrado como condição de baseline herdada, não como falha introduzida. A validação estática foi feita por `tsc --noEmit` (exit 0).

---

## RESUMO EXECUTIVO

| Item | Status |
|---|---|
| Commit baseline | `60249ef1e1d0562e5d1d6fb465ff4ad7117dc7d4` |
| Tag `baseline-antes-refactor` | Mantida (aponta para 60249ef) |
| Branch `refactor/frontend-v2` | Ativa (resetada para 60249ef) |
| Working tree | Limpo |
| Build de referência | OK (exit 0) |
| Type-check de referência | OK (exit 0) |
| Tracking (GTM/GA4/AW-/dataLayer/fbq/btn-whatsapp) | 100% preservado, não alterado |
| Bug P0-1 (/produtos "Carregando…") | CONFIRMADO: `Carregando`=3, `/produto/`=0 no HTML |
| Bug P0-2 (categoria vazia) | CONFIRMADO: `/produto/`=0 no HTML da categoria |
| Bug P0-3 (/ofertas 404) | CONFIRMADO: HTTP 404 ao vivo |
| Bug P0-4 (/rastreamento 404) | CONFIRMADO: HTTP 404 ao vivo |
| Redirects configurados | Em `next.config.mjs` (/ofertas→/promocoes, /rastreamento→/rastrear-pedido) |

**CRITÉRIO DE PARADA OBRIGATÓRIO:** Nenhuma edição foi feita fora de `docs\diagnostico\`. Aguardando auditoria deste relatório para receber instruções de implementação da FASE 1.

---

## Plano de Rollback (documentado)

**Git:**
```
git reset --hard 60249ef1e1d0562e5d1d6fb465ff4ad7117dc7d4
git checkout main          # branch padrão confirmada com: git branch -r
git branch -D refactor/frontend-v2
```

**Cloudflare:**
Painel Cloudflare Pages → Deployments → versão estável anterior → Rollback.

---

**Arquivos gerados em `docs\diagnostico\`:**
- `relatorio-fase0.md` (este relatório)
- `_coletar.ps1` (script de coleta read-only)
- `diag-slugs.mjs` (script de probing Supabase)
- `s1-package-scripts.txt`, `s1-nextconfig.txt`, `s1-redirects.txt`, `s1-middleware.txt`, `s1-wrangler.txt`
- `s2-envpaths.txt`, `s2-envkeys.txt`
- `s3-tracking.txt`
- `s41-root.txt`, `s42-routes.txt`, `s43-sitemap.txt`
- `s5-produtos.txt`, `s5-categoria.txt`
- `s61-supabase-calls.txt`, `s62-diag-slugs.txt`
- `s7-ofertas.txt`, `s7-rastreamento.txt`
- `s8-contagens.txt`, `s8-ofertas-headers.txt`, `s8-rastreamento-headers.txt`, `s8-categoria-headers.txt`
- `baseline-home.html`, `baseline-produtos.html`, `baseline-categoria.html`
- `baseline-typecheck.log`, `baseline-build.log`
