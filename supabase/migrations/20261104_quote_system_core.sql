-- ==============================================================================
-- DISCIBRA — Fase 1: Migração Core de Orçamentos, Frete e Precificação (B2C)
-- Idempotente: pode ser re-executada sem erro
-- ==============================================================================

-- 1. Função de atualização de timestamp (atualizado_em)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Enum de status em PT-BR
DO $$
BEGIN
  CREATE TYPE public.orcamento_status AS ENUM (
    'rascunho', 'enviado', 'negociando', 'aprovado',
    'separando', 'em_transporte', 'entregue', 'cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Tabela principal: orcamentos (B2C — sem CNPJ, sem empresa)
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  endereco_cep TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT DEFAULT 'SP',
  metodo_entrega TEXT DEFAULT 'entrega' CHECK (metodo_entrega IN ('entrega','retirada')),
  distancia_km NUMERIC,
  requer_munck BOOLEAN DEFAULT false,
  subtotal NUMERIC DEFAULT 0,
  desconto_volume NUMERIC DEFAULT 0,
  desconto_pix NUMERIC DEFAULT 0,
  valor_frete NUMERIC DEFAULT 0,
  frete_a_confirmar BOOLEAN DEFAULT false,
  total NUMERIC DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'pix' CHECK (forma_pagamento IN ('pix','cartao')),
  parcelas_cartao INTEGER DEFAULT 1,
  pix_key TEXT,
  status public.orcamento_status DEFAULT 'rascunho',
  peso_total_kg NUMERIC DEFAULT 0,
  token_acesso TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  visualizado_em TIMESTAMPTZ,
  ip_origem TEXT,
  valido_ate DATE,
  observacoes TEXT,
  observacoes_cliente TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orcamentos_codigo_idx ON public.orcamentos (codigo);
CREATE INDEX IF NOT EXISTS orcamentos_status_idx ON public.orcamentos (status);
CREATE INDEX IF NOT EXISTS orcamentos_token_idx ON public.orcamentos (token_acesso);
CREATE INDEX IF NOT EXISTS orcamentos_criado_idx ON public.orcamentos (criado_em DESC);

-- Trigger de updated_at para orcamentos
DROP TRIGGER IF EXISTS set_timestamp_orcamentos ON public.orcamentos;
CREATE TRIGGER set_timestamp_orcamentos
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. Itens do orçamento
CREATE TABLE IF NOT EXISTS public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  produto_id UUID,
  sku TEXT,
  nome_produto TEXT NOT NULL,
  unidade TEXT DEFAULT 'sc',
  quantidade NUMERIC NOT NULL DEFAULT 1,
  preco_tabela NUMERIC NOT NULL,
  preco_aplicado NUMERIC NOT NULL,
  tipo_preco TEXT DEFAULT 'avulso' CHECK (tipo_preco IN ('avulso','palete','carga_fechada')),
  peso_unitario_kg NUMERIC DEFAULT 1,
  peso_total_kg NUMERIC GENERATED ALWAYS AS (quantidade * peso_unitario_kg) STORED,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orcamento_itens_orcamento_idx ON public.orcamento_itens (orcamento_id);

-- 5. Auditoria de mudanças de status
CREATE TABLE IF NOT EXISTS public.orcamento_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  usuario_id UUID,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 6. Configurações de frete (editável pelo admin)
CREATE TABLE IF NOT EXISTS public.configuracoes_frete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  km_max NUMERIC NOT NULL,
  km_faixa_anterior NUMERIC DEFAULT 0,
  valor_base NUMERIC NOT NULL,
  valor_km_adicional NUMERIC DEFAULT 0,
  valor_minimo_frete_gratis NUMERIC,
  multiplicador_volume_medio NUMERIC DEFAULT 1.4,
  multiplicador_volume_grande NUMERIC DEFAULT 1.8,
  taxa_munck NUMERIC DEFAULT 250,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_configuracoes_frete ON public.configuracoes_frete;
CREATE TRIGGER set_timestamp_configuracoes_frete
  BEFORE UPDATE ON public.configuracoes_frete
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Seed das faixas de frete (apenas se a tabela estiver vazia)
INSERT INTO public.configuracoes_frete
  (km_max, km_faixa_anterior, valor_base, valor_km_adicional, valor_minimo_frete_gratis, taxa_munck)
SELECT * FROM (VALUES
  (20::numeric,  0::numeric,  60::numeric,   0::numeric,   2500::numeric, 250::numeric),
  (50::numeric, 20::numeric, 130::numeric,   0::numeric,   4000::numeric, 250::numeric),
  (70::numeric, 50::numeric, 240::numeric,   3::numeric,  NULL::numeric, 250::numeric),
  (90::numeric, 70::numeric, 320::numeric,   4::numeric,  NULL::numeric, 250::numeric)
) AS v(km_max, km_faixa_anterior, valor_base, valor_km_adicional, valor_minimo_frete_gratis, taxa_munck)
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_frete LIMIT 1);

-- 7. CEP base e endereço do CD em site_settings (estrutura existente)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cep_base TEXT DEFAULT '14060000',
  ADD COLUMN IF NOT EXISTS logradouro_base TEXT DEFAULT 'Rua Igarapava',
  ADD COLUMN IF NOT EXISTS numero_base TEXT DEFAULT '73',
  ADD COLUMN IF NOT EXISTS bairro_base TEXT DEFAULT 'Vila Albertina',
  ADD COLUMN IF NOT EXISTS cidade_base TEXT DEFAULT 'Ribeirão Preto',
  ADD COLUMN IF NOT EXISTS uf_base TEXT DEFAULT 'SP';

INSERT INTO public.site_settings (id, cep_base, logradouro_base, numero_base, bairro_base, cidade_base, uf_base)
VALUES ('default', '14060000', 'Rua Igarapava', '73', 'Vila Albertina', 'Ribeirão Preto', 'SP')
ON CONFLICT (id) DO UPDATE SET
  cep_base = COALESCE(public.site_settings.cep_base, '14060000'),
  logradouro_base = COALESCE(public.site_settings.logradouro_base, 'Rua Igarapava'),
  numero_base = COALESCE(public.site_settings.numero_base, '73'),
  bairro_base = COALESCE(public.site_settings.bairro_base, 'Vila Albertina'),
  cidade_base = COALESCE(public.site_settings.cidade_base, 'Ribeirão Preto'),
  uf_base = COALESCE(public.site_settings.uf_base, 'SP');

-- 8. Colunas de preço multi-faixa e peso em products (idempotente)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS preco_avulso NUMERIC,
  ADD COLUMN IF NOT EXISTS preco_palete NUMERIC,
  ADD COLUMN IF NOT EXISTS preco_carga_fechada NUMERIC,
  ADD COLUMN IF NOT EXISTS preco_lista NUMERIC,
  ADD COLUMN IF NOT EXISTS custo NUMERIC,
  ADD COLUMN IF NOT EXISTS peso_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS revisao_custo BOOLEAN DEFAULT false;

-- Backfill de peso utilizando weight real do produto
UPDATE public.products
  SET peso_kg = weight
WHERE peso_kg IS NULL AND weight IS NOT NULL;

UPDATE public.products
  SET peso_kg = 1
WHERE peso_kg IS NULL;

-- Backfill de preços (escada: menor preço sempre vence)
UPDATE public.products
  SET
    preco_avulso = price,
    preco_palete = ROUND(price * 0.97, 2),
    preco_carga_fechada = ROUND(price * 0.97 * 0.98, 2),
    preco_lista = ROUND(price * 1.10, 2)
WHERE preco_avulso IS NULL;

-- 9. Transição e Compatibilidade de Quotations
-- Se quotations e quotation_items existirem como tabelas antigas (vazias), removemos com segurança para virarem views
DROP TABLE IF EXISTS public.quotation_items CASCADE;
DROP TABLE IF EXISTS public.quotations CASCADE;
DROP TABLE IF EXISTS public.quotation_leads CASCADE;
DROP VIEW IF EXISTS public.quotation_items CASCADE;
DROP VIEW IF EXISTS public.quotations CASCADE;

CREATE OR REPLACE VIEW public.quotations AS
  SELECT
    id,
    codigo AS code,
    status::TEXT,
    subtotal,
    desconto_volume,
    desconto_pix,
    valor_frete AS shipping_value,
    total,
    valido_ate AS valid_until,
    observacoes AS notes,
    observacoes_cliente AS notes_client,
    token_acesso AS token,
    cliente_telefone,
    cliente_nome,
    pix_key,
    criado_em AS created_at,
    atualizado_em AS updated_at
  FROM public.orcamentos;

CREATE OR REPLACE VIEW public.quotation_items AS
  SELECT
    id,
    orcamento_id AS quotation_id,
    produto_id AS product_id,
    nome_produto AS product_name,
    sku,
    unidade AS unit,
    quantidade AS qty,
    preco_aplicado AS unit_price,
    ordem AS sort_order,
    criado_em AS created_at
  FROM public.orcamento_itens;

-- 10. RLS (Row Level Security)
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_frete ENABLE ROW LEVEL SECURITY;

-- Políticas de administradores (acesso total)
DROP POLICY IF EXISTS "admins_all_orcamentos" ON public.orcamentos;
CREATE POLICY "admins_all_orcamentos" ON public.orcamentos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "admins_all_itens" ON public.orcamento_itens;
CREATE POLICY "admins_all_itens" ON public.orcamento_itens
  FOR ALL TO authenticated
  USING (true);

-- Políticas de leitura pública por token (cliente visualiza orçamento)
DROP POLICY IF EXISTS "public_read_by_token" ON public.orcamentos;
CREATE POLICY "public_read_by_token" ON public.orcamentos
  FOR SELECT TO anon
  USING (token_acesso IS NOT NULL);

DROP POLICY IF EXISTS "public_read_itens" ON public.orcamento_itens;
CREATE POLICY "public_read_itens" ON public.orcamento_itens
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_id AND o.token_acesso IS NOT NULL
    )
  );

-- Configurações de frete: leitura pública
DROP POLICY IF EXISTS "public_read_frete" ON public.configuracoes_frete;
CREATE POLICY "public_read_frete" ON public.configuracoes_frete
  FOR SELECT TO anon
  USING (ativo = true);

-- Comentários para documentação
COMMENT ON TABLE public.orcamentos IS 'Orçamentos B2C — nascem da aprovação do orçamento no admin.';
COMMENT ON TABLE public.orcamento_itens IS 'Itens do orçamento com preço travado server-side.';
COMMENT ON TABLE public.orcamento_auditoria IS 'Auditoria de transição de status de orçamentos.';
COMMENT ON TABLE public.configuracoes_frete IS 'Faixas de frete por distância e valor mínimo de gratuidade.';
