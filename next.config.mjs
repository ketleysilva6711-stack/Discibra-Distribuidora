/** @type {import('next').NextConfig} */
// Env: Next.js carrega .env, .env.local, .env.development.local, etc. na raiz deste projeto.
// Turbopack (next dev --turbo) usa as mesmas regras; reinicie o dev server após mudar variáveis.
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://atacadodeconstrucao.com"

const nextConfig = {
  output: "standalone",
  typescript: {
    // NUNCA ignore erros TypeScript em produção - isso mascara bugs reais
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'recharts',
    ],
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.333obra.com.br" },
      { protocol: "https", hostname: "**.leroymerlin.com.br" },
      { protocol: "https", hostname: "**.tcdn.com.br" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Permite fotos locais com ou sem cache-bust (?v=N) — equivale ao
    // comportamento padrão do Next mais query strings em /images/**
    localPatterns: [
      { pathname: "/**" },
      { pathname: "/**", search: "?*" },
    ],
  },
  // Desativar header X-Powered-By para segurança
  poweredByHeader: false,
  // Performance: habilitar compressão e cache
  compress: true,
  // Redirects forenses — elimina 404 nas rotas de anúncios (Google Ads)
  async redirects() {
    return [
      { source: '/categoria/cimento', destination: '/categoria/cimentos', permanent: true },
      { source: '/cimento/atacado', destination: '/cimento', permanent: false },
    ]
  },
  // Segurança: configurar headers de resposta
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Segurança básica
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // CORS dinâmico via NEXT_PUBLIC_SITE_URL
          { key: "Access-Control-Allow-Origin", value: origin },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          // HSTS — HTTPS obrigatório por 2 anos
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://*.google-analytics.com https://*.google.com https://*.doubleclick.net https://www.googleadservices.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https: https://*.google.com https://*.google-analytics.com https://*.doubleclick.net https://*.googletagmanager.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://ad.doubleclick.net https://*.doubleclick.net https://stats.g.doubleclick.net https://*.g.doubleclick.net https://*.google.com https://*.google.com.br https://connect.facebook.net https://*.facebook.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://va.vercel-scripts.com; frame-src 'self' https://www.googletagmanager.com https://www.facebook.com https://*.doubleclick.net https://*.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
      {
        source: "/produto/:slug*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=7200" },
        ],
      },
      {
        source: "/categoria/:slug*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=1200" },
        ],
      },
      {
        source: "/produtos",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: origin },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ]
  },
}

export default nextConfig
