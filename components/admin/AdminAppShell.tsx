"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, FolderTree, Layers, ShoppingCart, Star,
  Image as ImageIcon, LogOut, Menu, X, ChevronRight, MessageCircle,
  BarChart3, ExternalLink, PieChart, User, Settings, Globe, FileText,
} from "lucide-react"

const groups = [
  {
    title: "Visão geral",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Analytics WhatsApp", href: "/admin/analytics-whatsapp", icon: PieChart },
    ],
  },
  {
    title: "Vendas",
    items: [
      { label: "Orçamentos", href: "/admin/orcamentos", icon: FileText },
      { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
      { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageCircle },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { label: "Produtos", href: "/admin/produtos", icon: Package },
      { label: "Categorias", href: "/admin/categorias", icon: FolderTree },
      { label: "Subcategorias", href: "/admin/subcategorias", icon: Layers },
      { label: "Banners", href: "/admin/banners", icon: ImageIcon },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { label: "Avaliações", href: "/admin/avaliacoes", icon: Star },
      { label: "CMS / Aparência", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    title: "Marketing",
    items: [{ label: "Google / GTM", href: "/admin/google", icon: Globe }],
  },
] as const

const allItems = groups.flatMap((g) => g.items as readonly { label: string; href: string; icon: any }[])

type Props = {
  children: React.ReactNode
  adminEmail: string
  adminName: string | null
}

export default function AdminAppShell({ children, adminEmail, adminName }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const current = allItems.find((m) => pathname === m.href || (m.href !== "/admin" && pathname.startsWith(m.href)))

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    window.location.href = "/admin/login"
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#08152E] text-slate-300 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link href="/admin" className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-[#12A06A]">Discibra</span>
            <span className="block text-sm font-bold text-white">Painel de controle</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#12A06A] text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {isActive && <ChevronRight className="ml-auto h-4 w-4 shrink-0" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-[18px] w-[18px]" />
            Ver a loja
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            {current && <current.icon className="h-5 w-5 shrink-0 text-[#12A06A]" />}
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900">{current?.label || "Dashboard"}</h1>
              <p className="hidden text-xs text-slate-500 sm:block">Discibra Distribuidora · administração</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="max-w-[200px] truncate">{adminName || adminEmail}</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
