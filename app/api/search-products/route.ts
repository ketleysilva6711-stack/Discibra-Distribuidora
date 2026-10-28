import { NextRequest, NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const supabase = createPublicClient()
    let query = supabase
      .from("products")
      .select("id, name, sku, price, unit, stock, image_url")
      .eq("active", true)
    if (q) {
      query = query.ilike("name", `%${q}%`)
    } else {
      query = query.order("name", { ascending: true })
    }
    const { data, error } = await query.limit(25)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ products: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
