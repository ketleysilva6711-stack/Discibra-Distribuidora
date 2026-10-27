/** Origens rastreadas — alinhado ao dashboard admin */

export const WA_CLICK_SOURCES = [
  "floating_button",
  "checkout_finalize",
  "product_page",
  "contact_page",
  "hero_banner",
  "minha_conta",
  "home_cta",
  "product_card",
  "topbar_phone",
  "header_phone",
  // Novos pontos de conversão (Meta Pixel)
  "footer_whatsapp",
  "contact_popup_whatsapp",
  "contact_popup_phone",
  "chat_widget_typed",
  "promocoes_orcamento_relampago",
  "pro_solutions_banner",
  "concierge_flyout",
  "mobile_bottom_nav",
  "cep_freight_calculator",
] as const

export type WaClickSource = (typeof WA_CLICK_SOURCES)[number]

export function isWaClickSource(s: string): s is WaClickSource {
  return (WA_CLICK_SOURCES as readonly string[]).includes(s)
}

export const WA_SOURCE_LABELS: Record<WaClickSource, string> = {
  floating_button: "Botão flutuante",
  checkout_finalize: "Finalizar compra",
  product_page: "Página de produto",
  contact_page: "Página de contato / institucional",
  hero_banner: "Banner / hero",
  minha_conta: "Minha conta",
  home_cta: "Banner CTA Inicial",
  product_card: "Card de Produto",
  topbar_phone: "Topo — Telefone Televendas",
  header_phone: "Menu Mobile — Telefone Televendas",
  // Novos
  footer_whatsapp: "Rodapé — WhatsApp",
  contact_popup_whatsapp: "Popup de contato — WhatsApp",
  contact_popup_phone: "Popup de contato — Telefone",
  chat_widget_typed: "Chat flutuante — Mensagem digitada",
  promocoes_orcamento_relampago: "Promoções — Orçamento Relâmpago",
  pro_solutions_banner: "Banner de Soluções Pro",
  concierge_flyout: "Concierge Executivo B2B",
  mobile_bottom_nav: "Navegação inferior mobile",
  cep_freight_calculator: "Calculadora de Frete por CEP",
}

