"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Package,
  MapPin,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getLocalOrders, type LocalOrder } from "@/lib/local-orders"
import {
  getLocalProfile,
  setLocalProfile,
  getLocalAddresses,
  setLocalAddresses,
  type LocalProfile,
  type LocalAddress,
} from "@/lib/local-profile"
import WhatsAppCta from "@/components/store/whatsapp-cta"
import { waLink } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"

type Section = "resumo" | "dados" | "pedidos" | "enderecos"

const statusLabel: Record<string, string> = {
  received: "Pedido recebido",
  picking: "Em separação",
  shipped: "Em envio",
  delivered: "Entregue",
}

export default function MinhaContaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [section, setSection] = useState<Section>("resumo")
  const [mobileNav, setMobileNav] = useState(false)
  const [orders, setOrders] = useState<LocalOrder[]>([])
  const [profile, setProfile] = useState<LocalProfile>({ fullName: "", phone: "", company: "" })
  const [addresses, setAddresses] = useState<LocalAddress[]>([])
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      if (!data.user) {
        router.replace("/login?redirect=/minha-conta")
        return
      }
      setAuthUserId(data.user.id)
      setUserEmail(data.user.email ?? null)
      const meta = data.user.user_metadata as { full_name?: string; name?: string; phone?: string }
      const name = meta?.full_name ?? meta?.name ?? ""
      setUserName(name)
      const lp = getLocalProfile()
      setProfile(
        lp ?? {
          fullName: name,
          phone: meta?.phone ?? "",
          company: "",
        },
      )
      setAddresses(getLocalAddresses())
      setOrders(getLocalOrders())
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [router, supabase.auth])

  function refreshOrders() {
    setOrders(getLocalOrders())
  }

  useEffect(() => {
    function onStorage() {
      refreshOrders()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setLocalProfile(profile)
    toast.success("Dados salvos neste dispositivo.")
  }

  function addAddress(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const next: LocalAddress = {
      id: `a-${Date.now()}`,
      label: String(fd.get("label") || "Principal"),
      street: String(fd.get("street") || ""),
      number: String(fd.get("number") || ""),
      complement: String(fd.get("complement") || ""),
      district: String(fd.get("district") || ""),
      city: String(fd.get("city") || ""),
      state: String(fd.get("state") || ""),
      zip: String(fd.get("zip") || ""),
    }
    const list = [...addresses, next]
    setAddresses(list)
    setLocalAddresses(list)
    ;(e.target as HTMLFormElement).reset()
  }

  function removeAddress(id: string) {
    const list = addresses.filter((a) => a.id !== id)
    setAddresses(list)
    setLocalAddresses(list)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Carregando" />
      </div>
    )
  }

  const navItems: { id: Section; label: string; icon: typeof User }[] = [
    { id: "resumo", label: "Resumo", icon: User },
    { id: "dados", label: "Dados pessoais", icon: User },
    { id: "pedidos", label: "Meus pedidos", icon: Package },
    { id: "enderecos", label: "Endereços", icon: MapPin },
  ]

  return (
    <div className="min-h-[70vh] bg-muted/20">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Minha conta</h1>
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-[280px] sm:max-w-md">
              {userName || "Cliente"} {userEmail ? `· ${userEmail}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppCta
              source="minha_conta"
              page="/minha-conta"
              userId={authUserId}
              text={`Olá! Sou ${userName || "cliente"} e preciso de ajuda com meu pedido.`}
              label="WhatsApp"
              className="!py-2.5 !px-4"
            />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 flex flex-col md:flex-row gap-6 md:gap-8">
        <aside className="md:w-56 shrink-0">
          <button
            type="button"
            onClick={() => setMobileNav(!mobileNav)}
            className="md:hidden w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
          >
            Menu da conta
            {mobileNav ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <nav
            className={`mt-2 md:mt-0 space-y-1 rounded-xl border border-border bg-card p-2 ${
              mobileNav ? "flex flex-col" : "hidden md:flex md:flex-col"
            }`}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id)
                  setMobileNav(false)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  section === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            ))}
            <Link
              href="/rastrear-pedido"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileNav(false)}
            >
              <ChevronRight className="w-4 h-4" />
              Rastrear pedido
            </Link>
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {section === "resumo" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <h2 className="font-heading font-bold text-lg text-foreground">Olá, {userName || "cliente"}</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Acompanhe pedidos gerados neste aparelho, atualize seus dados e fale com o comercial pelo
                  WhatsApp em um clique.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/produtos"
                    className="inline-flex rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
                  >
                    Ir às compras
                  </Link>
                  <a
                    href={waLink("Olá! Gostaria de um orçamento.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="btn_whatsapp"
                    data-button-name="btn_whatsapp"
                    data-name="btn_whatsapp"
                    data-source="minha_conta"
                    onClick={() => trackWhatsAppClick("minha_conta", "/minha-conta", authUserId)}
                    className="inline-flex items-center gap-2 rounded-[4px] border border-[#15803D] bg-[#15803D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#166534] min-h-[48px] touch-manipulation btn-whatsapp-track"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    Orçamento
                  </a>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Pedidos locais</p>
                  <p className="font-heading text-2xl font-bold text-foreground mt-1">{orders.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Finalizados via carrinho + WhatsApp</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Endereços</p>
                  <p className="font-heading text-2xl font-bold text-foreground mt-1">{addresses.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Salvos para próximas compras</p>
                </div>
              </div>
            </div>
          )}

          {section === "dados" && (
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <h2 className="font-heading font-bold text-lg">Dados pessoais</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                E-mail de login (somente leitura). Demais campos são salvos neste navegador até integração total
                com o sistema.
              </p>
              <form onSubmit={saveProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input
                    readOnly
                    value={userEmail || ""}
                    className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome completo</label>
                  <input
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone / WhatsApp</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Empresa (opcional)</label>
                  <input
                    value={profile.company || ""}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Salvar alterações
                </button>
              </form>
            </div>
          )}

          {section === "pedidos" && (
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="font-heading font-bold text-lg">Meus pedidos</h2>
                <button
                  type="button"
                  onClick={refreshOrders}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Atualizar lista
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mt-3">Nenhum pedido registrado aqui ainda.</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Ao finalizar pelo carrinho com WhatsApp, o pedido aparece automaticamente nesta lista.
                  </p>
                  <Link href="/produtos" className="inline-block mt-4 text-sm font-semibold text-primary">
                    Explorar produtos
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-4"
                    >
                      <div>
                        <p className="font-heading font-bold text-foreground">{o.code}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(o.createdAt).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{o.itemsSummary}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-primary">R$ {Number(o.total).toFixed(2)}</p>
                        <p className="text-xs font-medium text-foreground mt-1">{statusLabel[o.status]}</p>
                        <Link
                          href={`/rastrear-pedido`}
                          className="text-xs text-primary hover:underline mt-2 inline-block"
                        >
                          Rastrear
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {section === "enderecos" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <h2 className="font-heading font-bold text-lg mb-4">Endereços salvos</h2>
                {addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
                ) : (
                  <ul className="space-y-3">
                    {addresses.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 rounded-xl border border-border p-4"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{a.label}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {a.street}, {a.number}
                            {a.complement ? ` — ${a.complement}` : ""}
                            <br />
                            {a.district} — {a.city}/{a.state} — {a.zip}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAddress(a.id)}
                          className="text-xs font-medium text-destructive hover:underline self-start"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <h3 className="font-heading font-bold text-base mb-4">Adicionar endereço</h3>
                <form onSubmit={addAddress} className="grid sm:grid-cols-2 gap-3 max-w-2xl">
                  <input name="label" placeholder="Identificação (ex.: Obra Centro)" className="rounded-xl border border-border px-3 py-2 text-sm" />
                  <input name="zip" placeholder="CEP" className="rounded-xl border border-border px-3 py-2 text-sm" />
                  <input name="street" placeholder="Rua" className="rounded-xl border border-border px-3 py-2 text-sm sm:col-span-2" />
                  <input name="number" placeholder="Número" className="rounded-xl border border-border px-3 py-2 text-sm" />
                  <input name="complement" placeholder="Complemento" className="rounded-xl border border-border px-3 py-2 text-sm" />
                  <input name="district" placeholder="Bairro" className="rounded-xl border border-border px-3 py-2 text-sm" />
                  <input name="city" placeholder="Cidade" className="rounded-xl border border-border px-3 py-2 text-sm" />
                  <input name="state" placeholder="UF" className="rounded-xl border border-border px-3 py-2 text-sm" />
                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
                  >
                    Salvar endereço
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
