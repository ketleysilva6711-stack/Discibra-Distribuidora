"use client"

import { cn } from "@/lib/utils"

type Variant = "full" | "compact" | "mono"

/**
 * Logo oficial Discibra Distribuidora.
 * Arquivos em /public/brand (logo.png, logo-dark.png, icon-trim.png).
 */
export default function DynamicBrandLogo({
  variant = "full",
  className,
  inverted = false,
}: {
  variant?: Variant
  className?: string
  inverted?: boolean
}) {
  if (variant === "mono") {
    return (
      <img
        src="/brand/icon-trim.png"
        alt="Discibra"
        width={64}
        height={64}
        className={cn("h-9 w-9 shrink-0 object-contain", className)}
      />
    )
  }

  return (
    <img
      src={inverted ? "/brand/logo-dark-trim.png" : "/brand/logo-trim.png"}
      alt="Discibra Distribuidora"
      className={cn("h-9 w-auto shrink-0 object-contain", className)}
    />
  )
}