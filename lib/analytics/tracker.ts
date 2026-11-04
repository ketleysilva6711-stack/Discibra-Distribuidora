/**
 * DISCIBRA — Helper de rastreamento unificado de eventos (GA4 / GTM / Google Ads)
 * Protegido contra SSR e adblockers. Toda a lógica roda apenas no cliente.
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export type AnalyticsParams = Record<string, unknown>

/**
 * Verifica se o ambiente permite disparo de eventos (client-side apenas).
 */
function isClient(): boolean {
  return typeof window !== "undefined" && typeof window.document !== "undefined"
}

/**
 * Função genérica segura para disparar eventos de analytics.
 * Sem efeito se executado no servidor ou se não houver dataLayer/gtag.
 */
export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (!isClient()) return

  try {
    const w = window as unknown as { dataLayer?: Array<Record<string, unknown>>; gtag?: (...args: unknown[]) => void }

    if (w.dataLayer) {
      w.dataLayer.push({ event: eventName, ...params })
    }

    if (w.gtag) {
      w.gtag("event", eventName, params)
    }
  } catch (e) {
    // Silencioso: não quebrar a jornada do usuário por causa de analytics
    console.warn("[Analytics] Falha ao registrar evento:", e)
  }
}

/**
 * Dispara evento add_to_cart do GA4.
 */
export function trackAddToCart(item: {
  id: string
  name: string
  price: number
  quantity: number
  currency?: string
}): void {
  trackEvent("add_to_cart", {
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        currency: item.currency ?? "BRL",
      },
    ],
  })
}

/**
 * Dispara evento begin_checkout do GA4.
 */
export function trackBeginCheckout(params: {
  total: number
  itemsCount: number
  currency?: string
}): void {
  trackEvent("begin_checkout", {
    value: params.total,
    currency: params.currency ?? "BRL",
    items_count: params.itemsCount,
  })
}

/**
 * Dispara evento quote_created e generate_lead quando um orçamento é gravado.
 */
export function trackQuoteCreated(params: {
  codigo: string
  total: number
  formaPagamento: string
  items?: Array<{ id: string; name: string; price: number; quantity: number }>
}): void {
  trackEvent("quote_created", {
    quote_code: params.codigo,
    value: params.total,
    currency: "BRL",
    forma_pagamento: params.formaPagamento,
    items: params.items?.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  })

  trackEvent("generate_lead", {
    value: params.total,
    currency: "BRL",
    quote_code: params.codigo,
  })
}

/**
 * Dispara evento whatsapp_click quando o usuário abre o WhatsApp pelo CTA.
 */
export function trackWhatsAppClick(params: {
  codigo?: string
  total?: number
  origem: string
  items?: Array<{ id: string; name: string; price: number; quantity: number }>
}): void {
  trackEvent("whatsapp_click", {
    quote_code: params.codigo,
    value: params.total,
    currency: "BRL",
    origem: params.origem,
    items: params.items?.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  })

  // Conversão do Google Ads (se houver label configurado via gtag)
  if (isClient()) {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    if (w.gtag) {
      w.gtag("event", "conversion", {
        send_to: params.origem || "",
        value: params.total,
        currency: "BRL",
      })
    }
  }
}
