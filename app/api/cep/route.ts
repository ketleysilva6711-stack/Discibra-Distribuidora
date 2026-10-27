import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cep = searchParams.get("cep")?.replace(/\D/g, "")

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ erro: true, message: "CEP inválido" }, { status: 400 })
  }

  const formattedCep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`

  // 1. Tentar BrasilAPI (otimizada para Cloudflare Workers e nuvem)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.city) {
        return NextResponse.json({
          cep: formattedCep,
          logradouro: data.street || "",
          bairro: data.neighborhood || "",
          localidade: data.city,
          uf: data.state,
        })
      }
    }
  } catch (_) {
    // Falha silenciosa para tentar fallback
  }

  // 2. Fallback para ViaCEP
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })

    if (res.ok) {
      const data = await res.json()
      if (!data.erro && data.localidade) {
        return NextResponse.json({
          cep: data.cep || formattedCep,
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          localidade: data.localidade,
          uf: data.uf,
        })
      }
    }
  } catch (_) {
    // Falha em ambos
  }

  return NextResponse.json({ erro: true, message: "CEP não encontrado" }, { status: 404 })
}
