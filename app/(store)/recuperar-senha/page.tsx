import type { Metadata } from "next"
import Link from "next/link"
import { Lock, ArrowLeft, Headphones } from "lucide-react"
import DynamicBrandLogo from "@/components/store/dynamic-brand-logo"
import WhatsAppCta from "@/components/store/whatsapp-cta"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Recuperar Senha",
}

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-mesh relative overflow-hidden">
      <div className="w-full max-w-[440px] relative z-10">
        <div className="flex justify-center mb-10">
          <Link href="/">
            <DynamicBrandLogo variant="full" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white p-8 md:p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl mb-6">
            <Lock className="w-8 h-8" />
          </div>
          
          <h1 className="text-[24px] font-black tracking-tight text-slate-900 mb-4">
            Recuperação de Senha
          </h1>
          
          <p className="text-[14px] text-slate-600 font-medium mb-8">
            Nossa plataforma de redefinição de senha automática está em manutenção no momento. Para sua segurança, a recuperação de acesso deve ser solicitada diretamente com nossa equipe de suporte.
          </p>

          <WhatsAppCta
            source="contact_page" // Utilizing existing source for analytics
            page="/recuperar-senha"
            text="Olá! Preciso recuperar a senha da minha conta no Discibra Distribuidora."
            label="Falar com o Suporte"
            className="w-full"
          />

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 font-medium text-[13px]">
            <Headphones className="w-4 h-4" />
            Atendimento disponível em horário comercial
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
