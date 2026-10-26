"use client"

import { Phone, Smartphone, Instagram, Youtube, Facebook } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import DynamicBrandLogo from "@/components/store/dynamic-brand-logo"
import { SITE } from "@/lib/site-config"
import { trackWhatsAppClick } from "@/lib/track-whatsapp"

const PaymentCard = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div
    title={label}
    className="h-10 px-3 bg-white rounded-xl flex items-center justify-center shadow-sm border border-white/20 hover:scale-105 transition-all duration-200"
  >
    {children}
  </div>
)

export default function StoreFooter() {
  const currentYear = new Date().getFullYear()

  const institutionalLinks = [
    { label: `Sobre a ${SITE.shortName}`, href: "/sobre" },
    { label: "Nossas Lojas", href: "/nossas-lojas" },
    { label: "Trabalhe Conosco", href: "/carreiras" },
    { label: "Política de Privacidade", href: "/politica-de-privacidade" },
    { label: "Termos de Uso", href: "/termos-de-uso" },
  ]

  const supportLinks = [
    { label: "Central de Ajuda", href: "/faq" },
    { label: "Trocas e Devoluções", href: "/trocas-e-devolucoes" },
    { label: "Política de Frete", href: "/politica-de-frete" },
    { label: "Rastrear Pedido", href: "/rastrear-pedido" },
    { label: "Fale Conosco", href: "/fale-conosco" },
  ]

  return (
    <footer className="bg-gradient-to-b from-[#020B1D] via-[#01081A] to-[#010510] text-white font-sans mt-20 relative overflow-hidden border-t border-[#0055FF]/25 shadow-2xl pb-20 lg:pb-0">

      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#F47920] via-[#FFB347] to-[#F47920]" />

      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F47920] mb-1">Newsletter</p>
            <h4 className="text-base font-bold text-white">Receba ofertas e cotações exclusivas</h4>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto bg-white/5 border border-white/10 rounded-xl p-1.5">
            <input
              type="email"
              placeholder="Seu melhor e-mail..."
              className="bg-transparent px-4 py-2 outline-none text-sm font-medium flex-1 sm:w-64 text-white placeholder:text-white/30"
            />
            <button className="h-9 px-6 rounded-lg bg-[#F47920] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#e06810] transition-colors whitespace-nowrap">
              Cadastrar
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-7">
            <DynamicBrandLogo variant="full" inverted className="h-16 w-auto lg:h-20" />

            <p className="text-sm text-blue-100/55 leading-relaxed max-w-xs">
              Cimento, argamassa e ferragens para construtoras e obras em todo o Brasil. Atacado com logística própria e preços direto da fábrica.
            </p>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${SITE.whatsappE164}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick("footer_whatsapp")}
              data-source="footer_whatsapp"
              data-track="btn_whatsapp"
              data-button-name="btn_whatsapp"
              data-name="btn_whatsapp"
              className="inline-flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all rounded-2xl px-4 py-3 group btn-whatsapp-track"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-md">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#25D366] leading-none mb-1">Televendas via WhatsApp</p>
                <p className="text-lg font-black text-white tracking-tight leading-none">{SITE.phoneDisplay}</p>
              </div>
            </a>

            {/* Social Media */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-3">Redes Sociais</p>
              <div className="flex items-center gap-2">
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-[#E1306C] hover:border-[#E1306C] hover:text-white transition-all">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-white transition-all">
                  <Youtube className="h-4 w-4" />
                </a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white transition-all">
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Institutional links */}
          <div className="lg:col-span-2 space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Institucional</h4>
            <ul className="space-y-3">
              {institutionalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-100/55 hover:text-white hover:translate-x-1 inline-block transition-all duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div className="lg:col-span-2 space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Atendimento</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-100/55 hover:text-white hover:translate-x-1 inline-block transition-all duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment + Trust column */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-8">

            {/* Payment flags */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">Formas de Pagamento</h4>

              {/* Pix + InfinitePay Oficiais */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="h-10 px-3.5 bg-white rounded-xl flex items-center justify-center shadow-sm border border-white/20 hover:scale-105 transition-all" title="Pix à Vista">
                  <Image src="/images/payments/pix.png" alt="Pix" width={80} height={26} className="h-6 w-auto object-contain" />
                </div>
                <div className="h-10 px-3.5 bg-white rounded-xl flex items-center justify-center shadow-sm border border-white/20 hover:scale-105 transition-all" title="InfinitePay">
                  <Image src="/images/payments/infinitepay.png" alt="InfinitePay" width={95} height={26} className="h-5 w-auto object-contain" />
                </div>
              </div>

              {/* Card flags — até 12x */}
              <div>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Cartão de Crédito · até 12x</p>
                <div className="flex flex-wrap gap-2">
                <PaymentCard label="Visa">
                    <Image src="/images/payments/visa.png" alt="Visa" width={48} height={18} className="h-4 w-auto object-contain" />
                  </PaymentCard>
                  <PaymentCard label="Mastercard">
                    <Image src="/images/payments/mastercard.png" alt="Mastercard" width={38} height={24} className="h-6 w-auto object-contain" />
                  </PaymentCard>
                  <PaymentCard label="American Express">
                    <Image src="/images/footer/brands/amex.svg" alt="Amex" width={40} height={40} className="h-5 w-auto" />
                  </PaymentCard>
                  <PaymentCard label="Elo">
                    <Image src="/images/footer/brands/elo.svg" alt="Elo" width={40} height={24} className="h-4 w-auto" />
                  </PaymentCard>
                  <PaymentCard label="Boleto Bancário">
                    <svg viewBox="0 0 36 24" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="2" height="16" fill="#1a1a1a"/>
                      <rect x="6" y="4" width="1" height="16" fill="#1a1a1a"/>
                      <rect x="9" y="4" width="3" height="16" fill="#1a1a1a"/>
                      <rect x="14" y="4" width="1" height="16" fill="#1a1a1a"/>
                      <rect x="17" y="4" width="2" height="16" fill="#1a1a1a"/>
                      <rect x="21" y="4" width="1" height="16" fill="#1a1a1a"/>
                      <rect x="24" y="4" width="3" height="16" fill="#1a1a1a"/>
                      <rect x="29" y="4" width="1" height="16" fill="#1a1a1a"/>
                      <rect x="32" y="4" width="2" height="16" fill="#1a1a1a"/>
                    </svg>
                  </PaymentCard>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">Segurança e Confiança</h4>
              <div className="flex flex-wrap gap-3">
                {/* Reclame Aqui Oficial */}
                <div className="flex items-center gap-2.5 bg-white rounded-xl px-3.5 py-2 shadow-sm border border-white/20 hover:scale-105 transition-all">
                  <Image src="/images/trust/reclame-aqui.png" alt="Reclame Aqui" width={90} height={22} className="h-4 w-auto object-contain" />
                  <div className="border-l border-slate-200 pl-2">
                    <p className="text-[8px] font-black uppercase text-[#00B057] leading-none">RA 1000</p>
                    <p className="text-[11px] font-black text-slate-800 leading-tight">�"timo · 9.8</p>
                  </div>
                </div>
                {/* Certisign Site Seguro Oficial */}
                <div className="flex items-center gap-2.5 bg-white rounded-xl px-3.5 py-2 shadow-sm border border-white/20 hover:scale-105 transition-all">
                  <Image src="/images/trust/certisign.png" alt="Certisign Site Seguro" width={28} height={28} className="h-6 w-auto object-contain" />
                  <div>
                    <p className="text-[8px] font-black uppercase text-purple-700 leading-none">Certisign</p>
                    <p className="text-[11px] font-black text-slate-800 leading-tight">Site Seguro</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Play */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50 flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-[#0055FF]" /> Aplicativo
              </h4>
              <a
                href="#"
                className="inline-block transition-transform hover:scale-105 active:scale-95 shadow-lg"
                title="Disponível no Google Play"
              >
                <Image
                  src="/images/payments/googleplay.png"
                  alt="Disponível no Google Play"
                  width={150}
                  height={45}
                  className="h-10 w-auto object-contain"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30 font-medium">
            © {currentYear} {SITE.legalName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/politica-de-privacidade" className="text-[11px] text-white/40 hover:text-white/60 font-bold uppercase tracking-widest transition-colors">
              Privacidade
            </Link>
            <Link href="/termos-de-uso" className="text-[11px] text-white/40 hover:text-white/60 font-bold uppercase tracking-widest transition-colors">
              Termos
            </Link>
            <Link href="/politica-de-frete" className="text-[11px] text-white/40 hover:text-white/60 font-bold uppercase tracking-widest transition-colors">
              Frete
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
