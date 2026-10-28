// =============================================================================
// SERVER LAYOUT — app/(store)/carrinho/layout.tsx
// Metadados de SEO para a página de orçamento/carrinho.
// =============================================================================

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meu Orçamento",
  description:
    "Revise sua lista de materiais e envie para cotação de frete e lote direto pelo WhatsApp da Discibra.",
  openGraph: {
    title: "Meu Orçamento — Discibra Distribuidora",
    description:
      "Revise sua lista de materiais e envie para cotação de frete e lote direto pelo WhatsApp da Discibra.",
    type: "website",
    siteName: "Discibra",
    url: "https://www.discibradistribuidora.com/carrinho",
    images: [
      {
        url: "https://www.discibradistribuidora.com/og-default.png",
        width: 1200,
        height: 630,
        alt: "Discibra — Meu Orçamento",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meu Orçamento — Discibra Distribuidora",
    description:
      "Revise sua lista de materiais e envie para cotação de frete e lote direto pelo WhatsApp da Discibra.",
  },
  alternates: {
    canonical: "https://www.discibradistribuidora.com/carrinho",
  },
}

export default function CarrinhoLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
