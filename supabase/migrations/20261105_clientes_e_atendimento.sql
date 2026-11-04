-- ==============================================================================
-- DISCIBRA — BLOCO 1: Clientes, Atendimento e SLA
-- Idempotente: pode ser re-executada sem erro
-- Aplicar no SQL Editor: https://supabase.com/dashboard/project/mvgwgzzaiamxddydrclt/sql
-- ==============================================================================

-- ── 1. Tabela de Clientes ──
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  documento TEXT,
  aceita_whatsapp BOOLEAN DEFAULT true,
  consentimento_lgpd_em TIMESTAMPTZ,
  bloqueado BOOLEAN DEFAULT false,
  motivo_bloqueio TEXT,
  total_orcamentos INT DEFAULT 0,
  total_aprovados INT DEFAULT 0,
  receita_total NUMERIC(12,2) DEFAULT 0,
  primeira_compra_em TIMESTAMPTZ,
  ultima_compra_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clientes_telefone_idx ON public.clientes (telefone);

-- ── 2. Tabela de Endereços do Cliente ──
CREATE TABLE IF NOT EXISTS public.cliente_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  cep TEXT NOT NULL,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  distancia_km NUMERIC,
  principal BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cliente_enderecos_cliente_idx ON public.cliente_enderecos (cliente_id);

-- ── 3. Colunas de atendimento em orcamentos ──
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id),
  ADD COLUMN IF NOT EXISTS atendente_id UUID,
  ADD COLUMN IF NOT EXISTS assumido_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prazo_resposta_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS primeira_resposta_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tempo_resposta_min INT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS pagina_origem TEXT;

-- ── 4. Função de prazo de resposta (SLA comercial 15 min) ──
CREATE OR REPLACE FUNCTION public.define_prazo_resposta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  agora TIMESTAMPTZ := now() AT TIME ZONE 'America/Sao_Paulo';
  base TIMESTAMPTZ;
BEGIN
  IF EXTRACT(ISODOW FROM agora) BETWEEN 1 AND 5
     AND agora::time BETWEEN '06:00' AND '19:00' THEN
    base := agora;
  ELSIF EXTRACT(ISODOW FROM agora) = 6
        AND agora::time < '12:00' THEN
    base := agora;
  ELSE
    base := (date_trunc('day', agora) + interval '1 day') + interval '6 hours';
    WHILE EXTRACT(ISODOW FROM base) = 7 LOOP
      base := base + interval '1 day';
    END LOOP;
  END IF;

  NEW.prazo_resposta_em := (base + interval '15 minutes') AT TIME ZONE 'America/Sao_Paulo';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prazo_resposta ON public.orcamentos;
CREATE TRIGGER trg_prazo_resposta
  BEFORE INSERT ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.define_prazo_resposta();

-- ── 5. RLS ──
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_enderecos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_clientes" ON public.clientes;
CREATE POLICY "admins_clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admins_enderecos" ON public.cliente_enderecos;
CREATE POLICY "admins_enderecos" ON public.cliente_enderecos
  FOR ALL TO authenticated
  USING (true);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Cadastro de clientes com histórico de orçamentos e receita.';
COMMENT ON TABLE public.cliente_enderecos IS 'Endereços de entrega dos clientes.';
COMMENT ON FUNCTION public.define_prazo_resposta() IS 'Calcula prazo de resposta SLA de 15 minutos dentro do expediente comercial.';
