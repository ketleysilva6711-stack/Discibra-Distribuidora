"use client"

import { useState } from "react"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AUTH_SCOPE_ADMIN } from "@/lib/auth/scopes"
import { loginSchema } from "@/lib/security/validation"

function messageForLoginFailure(status: number, apiError: string): string {
  if (status === 403) {
    return apiError || "Acesso negado: este usuário não está autorizado no painel admin."
  }
  return apiError || "Erro ao fazer login"
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const parseResult = loginSchema.safeParse({ email, password })
    if (!parseResult.success) {
      setError(parseResult.error.errors[0]?.message || "Dados inválidos")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password, scope: AUTH_SCOPE_ADMIN }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(messageForLoginFailure(res.status, typeof data.error === "string" ? data.error : ""))
        return
      }

      if (data.session?.access_token && data.session?.refresh_token) {
        const supabase = createClient()
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        if (sessionErr) {
          setError(sessionErr.message)
          return
        }
      }

      const errorParam = searchParams.get("error")
      if (errorParam === "acesso_negado") {
        setError("Acesso negado: usuário não é administrador.")
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      setError("Erro de conexão. Verifique sua internet.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#12A06A] mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-foreground">Painel Administrativo</h1>
          <p className="text-secondary-foreground/60 mt-1">Discibra Distribuidora</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-destructive/20 rounded-lg text-red-600 text-sm text-left whitespace-pre-line">
              {error}
            </div>
          )}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-900 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] focus:border-transparent outline-none transition"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#12A06A] focus:border-transparent outline-none transition"
                placeholder="Sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#12A06A] text-white rounded-lg font-semibold hover:bg-[#0e8a5b] transition disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
