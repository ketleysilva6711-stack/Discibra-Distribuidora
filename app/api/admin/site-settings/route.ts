import { NextRequest } from "next/server"
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler"
import { isAdmin } from "@/lib/auth/admin"
import {
  SITE_SETTINGS_ROW_ID,
  parseBannerImages,
  parseTestimonials,
} from "@/lib/site-settings"

const MAX_CMS_BANNERS = 6
const MAX_TESTIMONIALS = 24

export async function PATCH(request: NextRequest) {
  const { supabase, jsonWithSession } = createRouteHandlerSupabase(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonWithSession({ error: "Faça login no painel." }, { status: 401 })
  }
  if (!(await isAdmin(supabase, user.id))) {
    return jsonWithSession({ error: "Acesso restrito a administradores." }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonWithSession({ error: "JSON inválido." }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return jsonWithSession({ error: "Corpo inválido." }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  const logo_url =
    b.logo_url === null || b.logo_url === "" ? null : typeof b.logo_url === "string" ? b.logo_url : null
  const favicon_url =
    b.favicon_url === null || b.favicon_url === ""
      ? null
      : typeof b.favicon_url === "string"
        ? b.favicon_url
        : null
  const institutional_title =
    b.institutional_title === null || b.institutional_title === ""
      ? null
      : typeof b.institutional_title === "string"
        ? b.institutional_title
        : null
  const institutional_body =
    b.institutional_body === null || b.institutional_body === ""
      ? null
      : typeof b.institutional_body === "string"
        ? b.institutional_body
        : null
  const chat_header_url =
    b.chat_header_url === null || b.chat_header_url === ""
      ? null
      : typeof b.chat_header_url === "string"
        ? b.chat_header_url
        : null

  // Google Marketing fields
  const gtm_id =
    b.gtm_id === null || b.gtm_id === "" ? null : typeof b.gtm_id === "string" ? b.gtm_id : null
  const ga4_id =
    b.ga4_id === null || b.ga4_id === "" ? null : typeof b.ga4_id === "string" ? b.ga4_id : null
  const google_site_verification =
    b.google_site_verification === null || b.google_site_verification === ""
      ? null
      : typeof b.google_site_verification === "string"
        ? b.google_site_verification
        : null
  const google_ads_id =
    b.google_ads_id === null || b.google_ads_id === ""
      ? null
      : typeof b.google_ads_id === "string"
        ? b.google_ads_id
        : null
  const google_ads_conversion_label =
    b.google_ads_conversion_label === null || b.google_ads_conversion_label === ""
      ? null
      : typeof b.google_ads_conversion_label === "string"
        ? b.google_ads_conversion_label
        : null

  // Google Meu Negócio fields
  const business_name =
    b.business_name === null || b.business_name === ""
      ? null
      : typeof b.business_name === "string"
        ? b.business_name
        : null
  const business_address =
    b.business_address === null || b.business_address === ""
      ? null
      : typeof b.business_address === "string"
        ? b.business_address
        : null
  const business_phone =
    b.business_phone === null || b.business_phone === ""
      ? null
      : typeof b.business_phone === "string"
        ? b.business_phone
        : null
  const business_hours =
    b.business_hours === null || b.business_hours === ""
      ? null
      : typeof b.business_hours === "string"
        ? b.business_hours
        : null
  const business_maps_url =
    b.business_maps_url === null || b.business_maps_url === ""
      ? null
      : typeof b.business_maps_url === "string"
        ? b.business_maps_url
        : null

  // PIX fields
  const pix_chave_padrao =
    b.pix_chave_padrao === null || b.pix_chave_padrao === ""
      ? null
      : typeof b.pix_chave_padrao === "string"
        ? b.pix_chave_padrao
        : null
  const pix_titular_padrao =
    b.pix_titular_padrao === null || b.pix_titular_padrao === ""
      ? null
      : typeof b.pix_titular_padrao === "string"
        ? b.pix_titular_padrao
        : null
  const pix_cidade_padrao =
    b.pix_cidade_padrao === null || b.pix_cidade_padrao === ""
      ? null
      : typeof b.pix_cidade_padrao === "string"
        ? b.pix_cidade_padrao
        : null

  if (!Array.isArray(b.banner_images)) {
    return jsonWithSession({ error: "banner_images deve ser um array." }, { status: 400 })
  }
  const banner_images = parseBannerImages(b.banner_images)
  if (banner_images.length > MAX_CMS_BANNERS) {
    return jsonWithSession(
      { error: `No máximo ${MAX_CMS_BANNERS} banners no CMS.` },
      { status: 400 },
    )
  }

  if (!Array.isArray(b.testimonials)) {
    return jsonWithSession({ error: "testimonials deve ser um array." }, { status: 400 })
  }
  const testimonials = parseTestimonials(b.testimonials)
  if (testimonials.length > MAX_TESTIMONIALS) {
    return jsonWithSession(
      { error: `No máximo ${MAX_TESTIMONIALS} depoimentos.` },
      { status: 400 },
    )
  }

  const payload = {
    id: SITE_SETTINGS_ROW_ID,
    logo_url,
    favicon_url,
    institutional_title,
    institutional_body,
    chat_header_url,
    banner_images,
    testimonials,
    gtm_id,
    ga4_id,
    google_site_verification,
    google_ads_id,
    google_ads_conversion_label,
    business_name,
    business_address,
    business_phone,
    business_hours,
    business_maps_url,
    pix_chave_padrao,
    pix_titular_padrao,
    pix_cidade_padrao,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single()

  if (error) {
    console.error("[site-settings PATCH] Erro:", error.message)
    return jsonWithSession(
      { error: "Falha ao salvar configurações do site." },
      { status: 500 }
    )
  }

  return jsonWithSession({ ok: true, data })
}
