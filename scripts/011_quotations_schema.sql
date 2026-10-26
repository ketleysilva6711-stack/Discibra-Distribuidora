-- =====================================================================
-- DISCIBRA — Sistema de Orçamentos Profissionais
-- Execute no Supabase SQL Editor (idempotente)
-- =====================================================================

-- LEADS (clientes pré-cadastrados via WhatsApp)
CREATE TABLE IF NOT EXISTS public.quotation_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cpf_cnpj TEXT,
  company TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'SP',
  address_zip TEXT,
  type TEXT DEFAULT 'pessoa_fisica',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_contact_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quotation_leads_phone_idx ON public.quotation_leads (phone);
CREATE INDEX IF NOT EXISTS quotation_leads_name_idx ON public.quotation_leads (name);

-- ORÇAMENTOS
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.quotation_leads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  discount_pct NUMERIC DEFAULT 0,
  shipping_value NUMERIC DEFAULT 0,
  notes TEXT,
  notes_client TEXT,
  valid_until DATE,
  payment_terms TEXT DEFAULT 'A definir pelo atendente',
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by TEXT,
  converted_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quotations_status_idx ON public.quotations (status);
CREATE INDEX IF NOT EXISTS quotations_lead_idx ON public.quotations (lead_id);
CREATE INDEX IF NOT EXISTS quotations_token_idx ON public.quotations (token);
CREATE INDEX IF NOT EXISTS quotations_created_idx ON public.quotations (created_at DESC);

-- ITENS DO ORÇAMENTO
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  sku TEXT,
  unit TEXT DEFAULT 'un',
  qty NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_pct NUMERIC DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quotation_items_quotation_idx ON public.quotation_items (quotation_id);

-- RLS: service role ignora RLS; admin autenticado lê
ALTER TABLE public.quotation_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- Admins autenticados podem ler e escrever
CREATE POLICY IF NOT EXISTS "admins_all_leads" ON public.quotation_leads
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "admins_all_quotations" ON public.quotations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "admins_all_items" ON public.quotation_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Leitura pública para token (link do cliente)
CREATE POLICY IF NOT EXISTS "public_read_quotation_by_token" ON public.quotations
  FOR SELECT TO anon
  USING (token IS NOT NULL);
CREATE POLICY IF NOT EXISTS "public_read_items_by_token" ON public.quotation_items
  FOR SELECT TO anon
  USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.token IS NOT NULL)
  );
CREATE POLICY IF NOT EXISTS "public_read_lead_by_token" ON public.quotation_leads
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.lead_id = public.quotation_leads.id AND q.token IS NOT NULL
    )
  );
