import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import Script from 'next/script'
import { SITE } from '@/lib/site-config'
import { BRANDING } from '@/lib/branding'
import { getSiteSettingsServer } from '@/lib/site-settings-server'
import { resolveBusinessName, resolveBusinessMapsUrl } from '@/lib/site-settings'
import { GoogleBusinessSchema } from '@/components/seo/google-business-schema'
import TrackingProvider from '@/components/analytics/TrackingProvider'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  preload: true,
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['600', '700', '800', '900'],
  preload: true,
})

const cspBase = process.env.NODE_ENV === 'production'
  ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://connect.facebook.net https://*.google.com https://connect.facebook.net https://*.google-analytics.com https://*.google.com https://*.doubleclick.net https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https: https://*.google.com https://*.google-analytics.com https://*.doubleclick.net https://*.googletagmanager.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google.com https://*.google.com https://connect.facebook.net https://*.facebook.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://ad.doubleclick.net https://*.doubleclick.net https://stats.g.doubleclick.net https://*.g.doubleclick.net https://*.google.com https://*.google.com.br https://connect.facebook.net https://*.facebook.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://va.vercel-scripts.com; frame-src 'self' https://www.googletagmanager.com https://www.facebook.com https://*.doubleclick.net https://*.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
  : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://connect.facebook.net https://*.google.com https://connect.facebook.net https://*.google-analytics.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google.com https://*.google.com https://connect.facebook.net https://*.facebook.com https://www.googletagmanager.com https://*.google-analytics.com https://*.googletagmanager.com https://ad.doubleclick.net https://*.doubleclick.net https://connect.facebook.net https://www.googleadservices.com https://googleads.g.doubleclick.net https://va.vercel-scripts.com;"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsServer()
  const favUrl = settings?.favicon_url?.trim()
  const googleVerification = settings?.google_site_verification?.trim() || process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION

  return {
    title: {
      default: `${SITE.legalName} — Materiais de construção`,
      template: `%s | ${SITE.shortName}`,
    },
    description: SITE.tagline,
    icons: favUrl
      ? { icon: [{ url: favUrl }] }
      : { icon: [{ url: BRANDING.faviconPath, type: 'image/png', sizes: '32x32' }] },
    other: {
      'Content-Security-Policy': cspBase,
      'X-DNS-Prefetch-Control': 'on',
      'X-UA-Compatible': 'IE=edge',
      ...(googleVerification ? { 'google-site-verification': googleVerification } : {}),
    },
    referrer: 'strict-origin-when-cross-origin',
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettingsServer()
  const gtmId = settings?.gtm_id?.trim() || process.env.NEXT_PUBLIC_GTM_ID || undefined
  const ga4Id = settings?.ga4_id?.trim() || process.env.NEXT_PUBLIC_GA_ID || undefined
  const businessName = resolveBusinessName(settings)
  const googleAdsId = settings?.google_ads_id?.trim() || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || undefined
  const businessMapsUrl = resolveBusinessMapsUrl(settings)

  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta
          httpEquiv="Content-Security-Policy"
          content={cspBase}
        />
        <meta name="theme-color" content="#C2410C" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />
        <GoogleBusinessSchema
          businessName={businessName}
          businessAddress={settings?.business_address || undefined}
          businessPhone={settings?.business_phone || undefined}
          businessHours={settings?.business_hours || undefined}
          businessMapsUrl={businessMapsUrl}
        />
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} font-sans`} suppressHydrationWarning>
        <TrackingProvider
          gtmId={gtmId}
          ga4Id={ga4Id}
          googleAdsId={googleAdsId}
        >
          {children}
          <Toaster position="top-right" richColors />
          <Analytics />

          {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
            <>
              <Script
                id="meta-pixel"
                strategy="lazyOnload"
                dangerouslySetInnerHTML={{
                  __html: `
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                    fbq('track', 'PageView');
                  `,
                }}
              />
              <noscript>
                <img
                  height="1"
                  width="1"
                  style={{ display: 'none' }}
                  src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                  alt=""
                />
              </noscript>
            </>
          )}
        </TrackingProvider>
      </body>
    </html>
  )
}
