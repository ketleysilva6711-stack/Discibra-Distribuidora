"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid, ShoppingCart, MessageCircle } from "lucide-react"
import { SITE, waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { cn } from "@/lib/utils"

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        setCartCount(cart.reduce((acc: number, item: { qty: number }) => acc + item.qty, 0))
      } catch {}
    }
    updateCount()
    window.addEventListener("cart-updated", updateCount)
    return () => window.removeEventListener("cart-updated", updateCount)
  }, [])

  if (pathname?.startsWith("/admin")) return null

  const items = [
    { label: "Início", href: "/", icon: Home, active: pathname === "/" },
    { label: "Catálogo", href: "/produtos", icon: Grid, active: pathname?.startsWith("/produtos") },
    {
      label: "WhatsApp",
      href: waLink("Olá! Gostaria de fazer uma cotação de materiais."),
      icon: MessageCircle,
      isWa: true,
    },
    { label: "Orçamento", href: "/carrinho", icon: ShoppingCart, count: cartCount, active: pathname === "/carrinho" },
  ]

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {items.map((item) => {
          if (item.isWa) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick("mobile_bottom_nav")}
                data-track="btn_whatsapp"
                data-button-name="btn_whatsapp"
                data-source="mobile_bottom_nav"
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-[#25D366] active:scale-90 transition-transform btn-whatsapp-track"
              >
                <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500 text-white ring-2 ring-emerald-400/40 animate-pulse shadow-lg">
                  <item.icon className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
              </a>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-95",
                item.active ? "text-[#002D5B]" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-5 h-5", item.active && "stroke-[2.5px]")} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#002D5B] text-white text-[9px] font-black ring-2 ring-white">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] tracking-wider", item.active ? "font-black" : "font-semibold")}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
