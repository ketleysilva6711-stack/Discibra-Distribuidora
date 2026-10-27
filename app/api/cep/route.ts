import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cep = searchParams.get("cep")?.replace(/\D/g, "")
  if (!cep || cep.length !== 8) {
    return NextResponse.json({ erro: true, message: "CEP inválido" }, { status: 400 })
  }
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { "User-Agent": "Discibra-Distribuidora/1.0" },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ erro: true, message: "Erro ao consultar CEP" }, { status: 500 })
  }
}
