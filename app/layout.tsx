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

// CSP nonce gerado por middleware - aqui apenas para referência
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
    // Segurança: metatag CSP
    other: {
      'Content-Security-Policy': cspBase,
      'X-DNS-Prefetch-Control': 'on',
      'X-UA-Compatible': 'IE=edge',
      // Google Search Console verification
      ...(googleVerification ? { 'google-site-verification': googleVerification } : {}),
    },
    // Referrer policy
    referrer: 'strict-origin-when-cross-origin',
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettingsServer()
  const gtmId = settings?.gtm_id?.trim() || process.env.NEXT_PUBLIC_GTM_ID || "GTM-MLK62TBK"
  const ga4Id = settings?.ga4_id?.trim() || process.env.NEXT_PUBLIC_GA_ID
  const businessName = resolveBusinessName(settings)
  const googleAdsId = settings?.google_ads_id?.trim() || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-16526087847"
  const businessMapsUrl = resolveBusinessMapsUrl(settings)

  return (
      <html lang="pt-BR" className={`${plusJakarta.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        {/* Segurança: Meta tags de segurança */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        {/* Segurança: CSP via meta tag (fallback para inline) */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={cspBase}
        />
        <meta name="theme-color" content="#C2410C" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />
        {/* Google Business Schema JSON-LD (Server Component) */}
        <GoogleBusinessSchema
          businessName={businessName}
          businessAddress={settings?.business_address || undefined}
          businessPhone={settings?.business_phone || undefined}
          businessHours={settings?.business_hours || undefined}
          businessMapsUrl={businessMapsUrl}
        />
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} font-sans`} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        {children}
        <Toaster position="top-right" richColors />
        <Analytics />

{/* Google Ads Consent Mode v2 — Conformidade LGPD */}
        <Script
          id="consent-mode"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              // Consent Mode v2 para Google Ads compliance
              window.dataLayer = window.dataLayer || [];
              function gtagConsent(consentFlags) {
                dataLayer.push(consentFlags);
              }
              function updateConsentMode() {
                var consentFlags = {
                  ad_storage: 'denied',
                  analytics_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  wait_for_update: 500
                };
                try {
                  var consent = localStorage.getItem('cookie_consent');
                  if (consent === 'granted' || consent === 'marketing-granted') {
                    consentFlags.ad_storage = 'granted';
                    consentFlags.analytics_storage = 'granted';
                    consentFlags.ad_user_data = 'granted';
                    consentFlags.ad_personalization = 'granted';
                  }
                } catch(e) {}
                gtagConsent(consentFlags);
              }
              updateConsentMode();
              if (typeof window.__tcfapi === 'function') {
                window.__tcfapi('addEventListener', 2, function(stackId, success) {
                  if (success) {
                    window.__tcfapi('getTCData', 2, function(tcData) {
                      var flags = {
                        ad_storage: tcData.gdprApplies ? (tcData.purposeConsents['1'] ? 'granted' : 'denied') : 'granted',
                        analytics_storage: tcData.gdprApplies ? (tcData.purposeConsents['1'] ? 'granted' : 'denied') : 'granted',
                        ad_user_data: tcData.gdprApplies ? (tcData.purposeConsents['3'] ? 'granted' : 'denied') : 'granted',
                        ad_personalization: tcData.gdprApplies ? (tcData.purposeConsents['4'] ? 'granted' : 'denied') : 'granted',
                        wait_for_update: 500
                      };
                      dataLayer.push(flags);
                    });
                  }
                });
              }
            `,
          }}
        />

        {/* Google Tag Manager - carregamento assíncrono */}
        {gtmId && (
          <Script
            id="gtm-script"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
        )}

        {/* Google Analytics (gtag.js) - carregamento preguiçoso */}
        {ga4Id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="lazyOnload"
            />
            <Script
              id="gtag-init"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${ga4Id}', {
                    'cookie_flags': 'SameSite=None;Secure',
                    'ads_data_redaction': false,
                    'url_passthrough': true,
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted',
                  });
                `,
              }}
            />
          </>
        )}

        {/* Facebook Meta Pixel - carregamento preguiçoso */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <>
            <Script
              id="meta-pixel"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
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

      </body>
    </html>
  )
}