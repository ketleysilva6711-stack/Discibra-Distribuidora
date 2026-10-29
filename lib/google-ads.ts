// =============================================================================
// GOOGLE ADS CONVERSION TRACKING — DISTRIBUIDORA DE CIMENTO
// =============================================================================
// Configuração completa para rastreamento de conversões do Google Ads
// nos botões de WhatsApp, formulários e outras ações do usuário.
//
// Instruções:
// 1. Crie conversões no Google Ads: Ferramentas > Conversões
// 2. Copie os IDs de conversão para as variáveis de ambiente
// 3. Configure o Google Tag Manager com as tags de conversão
// 4. Use as funções exportadas neste módulo para disparar eventos
// =============================================================================

// IDs de conversão do Google Ads (configuráveis via .env)
export const GOOGLE_ADS = {
  // Conversão "WhatsApp Click" — cada clique no WhatsApp
  whatsappConversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_ID || "AW-16526087847/KtiYCLC_9_coEketoMg9",

  // Conversão "Lead Form" — preenchimento de formulário de contato
  leadFormConversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_FORM_ID || "",

  // Conversão "Purchase" — finalização de pedido (se aplicável)
  purchaseConversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID || "",

  // Conversão "Phone Call" — clique em telefone
  phoneCallConversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_PHONE_ID || "",

  // Conversão "View Item" — visualização de produto
  viewItemConversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_VIEW_ITEM_ID || "",

  // Conversão "Add to Cart" — adicionar ao orçamento
  addToCartConversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ADD_TO_CART_ID || "",

  // Tag Manager Container ID
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || "GTM-K6K78L54",
}

// Tipos de eventos de conversão suportados
export type ConversionType =
  | "whatsapp_click"
  | "lead_form"
  | "purchase"
  | "phone_call"
  | "view_item"
  | "add_to_cart"
  | "custom"

// Configuração de uma conversão
export interface ConversionConfig {
  id: string
  label: string
  value?: number
  currency?: string
  customParams?: Record<string, string>
  sendToGTM?: boolean
}

/**
 * Verifica se o Google Ads está configurado no projeto
 */
export function isGoogleAdsConfigured(): boolean {
  return GOOGLE_ADS.whatsappConversionId.length > 0
}

/**
 * Dispara um evento de conversão do Google Ads
 * Usa o gtag.js se disponível, ou notifica o dataLayer do GTM
 */
export function fireConversion(config: ConversionConfig): void {
  if (typeof window === "undefined") return

  const { id, label, value = 0, currency = "BRL", customParams = {} } = config

  // Dispara no gtag.js (Google Ads direto)
  if (typeof (window as any).gtag === "function") {
    ;(window as any).gtag("event", "conversion", {
      send_to: id,
      value: value,
      currency: currency,
      label: label,
      ...customParams,
    })
  }

  // Dispara no dataLayer do Google Tag Manager
  if (typeof (window as any).dataLayer !== "undefined") {
    ;(window as any).dataLayer.push({
      event: "conversion",
      conversionId: id,
      conversionLabel: label,
      conversionValue: value,
      conversionCurrency: currency,
      ...customParams,
    })
  }
}

/**
 * Dispara conversão de clique no WhatsApp
 * Uso: fireWhatsappConversion("home_cta", "Button CTA")
 */
export function fireWhatsappConversion(
  source: string,
  page: string = "",
  value: number = 1.0 // Valor estimado do lead em BRL
): void {
  const id = GOOGLE_ADS.whatsappConversionId || "AW-16526087847/O9LwCKLG96odEKetoMg9"
  if (!id) {
    console.warn("[GoogleAds] WhatsApp conversion ID not configured")
    return
  }

  fireConversion({
    id,
    label: "btn_whatsapp",
    value,
    currency: "BRL",
    customParams: {
      button_name: "btn_whatsapp",
      source,
      page,
    },
  })
}

/**
 * Dispara conversão de lead pelo formulário
 */
export function fireLeadFormConversion(
  formName: string,
  page: string = "",
  value: number = 10.0
): void {
  const id = GOOGLE_ADS.leadFormConversionId
  if (!id) {
    console.warn("[GoogleAds] Lead form conversion ID not configured")
    return
  }

  fireConversion({
    id,
    label: `lead_${formName}`,
    value,
    currency: "BRL",
    customParams: {
      form_name: formName,
      page,
    },
  })
}

/**
 * Dispara conversão de visualização de produto
 */
export function fireViewItemConversion(
  productId: string,
  productName: string,
  category: string = ""
): void {
  const id = GOOGLE_ADS.viewItemConversionId
  if (!id) return

  fireConversion({
    id,
    label: `view_item_${productId}`,
    value: 0,
    currency: "BRL",
    customParams: {
      product_id: productId,
      product_name: productName,
      product_category: category,
    },
  })
}

/**
 * Dispara conversão de adicionar ao orçamento (add to cart)
 */
export function fireAddToCartConversion(
  productId: string,
  productName: string,
  price: number,
  unit: string = "un"
): void {
  const id = GOOGLE_ADS.addToCartConversionId
  if (!id) return

  fireConversion({
    id,
    label: `add_to_cart_${productId}`,
    value: price,
    currency: "BRL",
    customParams: {
      product_id: productId,
      product_name: productName,
      product_price: String(price),
      product_unit: unit,
    },
  })
}

/**
 * Configura evento de remarketing — rastreia usuários que clicaram no WhatsApp
 * mas não conversaram ainda (para remarketing posterior)
 */
export function fireRemarketingEvent(source: string): void {
  if (typeof window === "undefined") return

  if (typeof (window as any).dataLayer !== "undefined") {
    ;(window as any).dataLayer.push({
      event: "whatsapp_remarketing",
      whatsapp_source: source,
      timestamp: Date.now(),
    })
  }
}

// =============================================================================
// CONVERSIONS API (CAPI) — Integração servidor-a-servidor
// Mais precisa que o pixel tracking, funciona mesmo com bloqueadores de ads
// =============================================================================

export interface CapiEvent {
  event_name: string
  event_time: number
  user_data: {
    em?: string
    ph?: string
    fn?: string
    ln?: string
    ct?: string
    country?: string
  }
  custom_data?: Record<string, unknown>
  event_source_url: string
}

/**
 * Envia evento de conversão diretamente para o Google Ads Conversions API
 * Isso contorna bloqueadores de terceiros e melhora a precisão do tracking
 */
export async function sendCapiEvent(event: CapiEvent): Promise<boolean> {
  try {
    const apiKey = process.env.GOOGLE_ADS_CAPI_API_KEY
    const accountId = process.env.GOOGLE_ADS_CAPI_ACCOUNT_ID
    const conversionAction = process.env.GOOGLE_ADS_CAPI_ACTION

    if (!apiKey || !accountId || !conversionAction) {
      console.warn("[CAPI] Credentials not configured")
      return false
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v1/customers/${accountId}/conversions:sendThirdPartySessionAttributionData`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          event_id: `${event.event_name}_${Date.now()}`,
          event_timestamp_us: event.event_time * 1000,
          conversion_action: conversionAction,
          value: event.custom_data?.value?.toString() || "0",
          currency_code: event.custom_data?.currency || "BRL",
          user_identifier: event.user_data.em || event.user_data.ph || undefined,
        }),
        keepalive: true,
      }
    )

    return response.ok
  } catch {
    return false
  }
}

/**
 * Helper para criar o payload completo de CAPI para WhatsApp
 */
export function createWhatsappCapiEvent(
  source: string,
  phone?: string,
  email?: string
): CapiEvent {
  return {
    event_name: "whatsapp_conversion",
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      ph: phone,
      em: email,
      country: "BR",
    },
    custom_data: {
      source,
      page: typeof window !== "undefined" ? window.location.pathname : "",
    },
    event_source_url:
      typeof window !== "undefined" ? window.location.href : "",
  }
}
