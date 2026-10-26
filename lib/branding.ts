import { SITE } from "@/lib/site-config"

/**
 * Pontos únicos para marca e assets — favicon vem de app/icon.tsx (troque lá para atualizar site + abas).
 */
export const BRANDING = {
  siteName: SITE.shortName,
  legalName: SITE.legalName,
  tagline: SITE.tagline,
  faviconPath: "/icon.png" as const,
  /** Logo React: @/components/store/brand-logo */
  logoImportPath: "@/components/store/brand-logo",
} as const
