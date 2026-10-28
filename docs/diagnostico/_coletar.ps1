# Script de coleta forense Fase 0.5 - read-only, grava em docs\diagnostico\
$ErrorActionPreference = "Continue"
$r = "docs\diagnostico\relatorio-fase0.md"
Push-Location $PSScriptRoot

function Sec($t) { "`n## $t`n" | Add-Content $r }
function Sub($t) { "`n### $t`n" | Add-Content $r }
function Code($label, $sb) {
    "`n$label`n```powershell`n" | Add-Content $r
    $out = & $sb 2>&1
    if ($null -eq $out) { "(sem saída)" | Add-Content $r }
    else { $out | Add-Content $r }
    "```" | Add-Content $r
}

# ============ SECAO 1 ============
Sec "1. Scripts e Arquivos de Configuracao / Camada de Servidor"
Sub "1.1 package.json (scripts)"
Code "Get-Content package.json | Select-String -Pattern 'scripts' -Context 0,25" {
    Get-Content package.json | Select-String -Pattern "scripts" -Context 0,25
}
Sub "1.2 next.config.*"
Code "Get-ChildItem next.config.*" { Get-ChildItem next.config.* -ErrorAction SilentlyContinue }
Sub "1.3 public__redirects / public__headers"
Code "Get-ChildItem public__redirects, public__headers" {
    Get-ChildItem -LiteralPath "public__redirects", "public__headers" -ErrorAction SilentlyContinue
}
Sub "1.4 middleware.ts / proxy.ts / src*"
Code "Get-ChildItem middleware.ts, proxy.ts, src\middleware.ts, src\proxy.ts" {
    Get-ChildItem -LiteralPath "middleware.ts", "proxy.ts", "src\middleware.ts", "src\proxy.ts" -ErrorAction SilentlyContinue
}
Sub "1.5 wrangler.* / open-next.config.*"
Code "Get-ChildItem wrangler.*, open-next.config.*" {
    Get-ChildItem wrangler.*, open-next.config.* -ErrorAction SilentlyContinue
}

# ============ SECAO 2 ============
Sec "2. Variaveis de Ambiente (Supabase)"
Sub "2.1 Test-Path .env.local / .env.production"
Code "" {
    "Test-Path .env.local => " + (Test-Path .env.local)
    "Test-Path .env.production => " + (Test-Path .env.production)
}
Sub "2.2 Chaves de ambiente em .env.local (nomes, sem valores)"
Code "Get-Content .env.local | Select-String '^[A-Za-z0-9_]+=' | ForEach-Object { ($_ -split '=')[0] }" {
    if (Test-Path .env.local) {
        Get-Content .env.local | Select-String -Pattern '^[A-Za-z0-9_]+=' | ForEach-Object { ($_ -split '=')[0] }
    } else {
        ".env.local nao encontrado"
    }
}

# ============ SECAO 3 ============
Sec "3. Rastreamento e Tags de Conversao"
Code "git grep -nE 'data-track|dataLayer|gtag|AW-|GTM-|G-[A-Z0-9]{6,}|fbq|wa.me|whatsapp'" {
    git grep -nE 'data-track|dataLayer|gtag|AW-|GTM-|G-[A-Z0-9]{6,}|fbq|wa.me|whatsapp' 2>&1
}

# ============ SECAO 4 ============
Sec "4. Detecao de Raiz (app vs src/app) e Inventario de Rotas"
Sub "4.1 Test-Path app / src\app"
Code "" {
    "Test-Path app => " + (Test-Path app)
    "Test-Path src\app => " + (Test-Path "src\app")
}
Sub "4.2 Inventario de arquivos de rota"
Code "Get-ChildItem -Recurse -LiteralPath app -Include page.tsx,layout.tsx,route.ts,loading.tsx,not-found.tsx,sitemap.ts,robots.ts,manifest.ts -File | Select-Object FullName" {
    $appPath = if (Test-Path "src\app") { "src\app" } else { "app" }
    Get-ChildItem -Recurse -LiteralPath $appPath -Include page.tsx,layout.tsx,route.ts,loading.tsx,not-found.tsx,sitemap.ts,robots.ts,manifest.ts -File | Select-Object FullName
}
Sub "4.3 sitemap/robots publicos"
Code "Get-ChildItem public\sitemap.xml, public\robots.txt" {
    Get-ChildItem -LiteralPath "public\sitemap.xml", "public\robots.txt" -ErrorAction SilentlyContinue
}

# ============ SECAO 5 ============
Sec "5. Codigo das Rotas Criticas"
Sub "5.1 app/produtos/page.tsx"
Code "Get-Content -LiteralPath app/produtos/page.tsx" {
    Get-Content -LiteralPath "app/(store)/produtos/page.tsx"
}
Sub "5.2 app/categoria/[slug]/page.tsx"
Code "Get-Content -LiteralPath app/categoria/[slug]/page.tsx" {
    Get-Content -LiteralPath "app/(store)/categoria/[slug]/page.tsx"
}

# ============ SECAO 6 ============
Sec "6. Slugs Reais & Mecanismo de Consulta no Supabase"
Sub "6.1 git grep chamadas Supabase"
Code "git grep -nE '\.from|\.eq|\.select|category_id|slug'" {
    git grep -nE '\.from|\.eq|\.select|category_id|slug' 2>&1
}
Sub "6.2 Script de probing diag-slugs.mjs (execucao direta)"
Code "node --env-file=.env.local docs\diagnostico\diag-slugs.mjs" {
    if (Test-Path .env.local) {
        & node --env-file=.env.local docs\diagnostico\diag-slugs.mjs 2>&1
    } else {
        ".env.local nao encontrado; pulando execucao do diag-slugs.mjs"
    }
}

# ============ SECAO 7 ============
Sec "7. Referencias Internas aos Links Obsoletos"
Sub "7.1 git grep ofertas"
Code "git grep -n 'ofertas'" { git grep -n 'ofertas' 2>&1 }
Sub "7.2 git grep rastreamento"
Code "git grep -n 'rastreamento'" { git grep -n 'rastreamento' 2>&1 }

Pop-Location
Write-Host "COLETA DAS SEC 1-7 CONCLUIDA. Arquivo: $r"