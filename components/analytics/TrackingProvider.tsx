"use client"

import Script from "next/script"
import { useEffect } from "react"

type TrackingProviderProps = {
  gtmId?: string | null
  ga4Id?: string | null
  googleAdsId?: string | null
  children?: React.ReactNode
}

/**
 * Componente que injeta dinamicamente os scripts de rastreamento (GTM, GA4, Google Ads)
 * a partir dos IDs fornecidos pelo CMS (site_settings). Sem IDs hardcoded no código-fonte.
 */
export default function TrackingProvider({
  gtmId,
  ga4Id,
  googleAdsId,
  children,
}: TrackingProviderProps) {
  // Inicializa dataLayer no cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as { dataLayer?: unknown[] }).dataLayer = (window as { dataLayer?: unknown[] }).dataLayer || []
    }
  }, [])

  return (
    <>
      {/* Google Tag Manager (noscript fallback) */}
      {gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      )}

      {/* Consent Mode v2 (LGPD) — inicializa dataLayer com padrões negados */}
      <Script
        id="consent-mode"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
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

      {/* GTM script assíncrono */}
      {gtmId && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');
            `,
          }}
        />
      )}

      {/* GA4 (gtag.js) */}
      {ga4Id && (
        <>
          <Script
            id="gtag-ga4"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script
            id="gtag-ga4-init"
            strategy="afterInteractive"
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

      {/* Google Ads (gtag.js) */}
      {googleAdsId && (
        <>
          <Script
            id="gtag-ads"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
            strategy="afterInteractive"
          />
          <Script
            id="gtag-ads-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAdsId}', {
                  allow_enhanced_conversions: true
                });
              `,
            }}
          />
        </>
      )}

      {children}
    </>
  )
}
