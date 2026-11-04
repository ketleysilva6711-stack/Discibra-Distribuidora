-- ==============================================================================
-- DISCIBRA — Correção de Preços Divergentes
-- Idempotente: pode ser re-executada sem erro
-- Aplicar no SQL Editor: https://supabase.com/dashboard/project/mvgwgzzaiamxddydrclt/sql
-- ==============================================================================

BEGIN;

-- 1. Garantir que nenhum produto fique com preco_avulso zerado ou nulo
UPDATE public.products p
  SET preco_avulso = COALESCE(
    NULLIF(p.preco_avulso, 0),
    NULLIF(p.price, 0),
    NULLIF(p.original_price, 0)
  )
WHERE p.preco_avulso IS NULL OR p.preco_avulso = 0;

-- 2. Preço de lista (10% acima do avulso)
UPDATE public.products
  SET preco_lista = ROUND(preco_avulso * 1.10, 2)
WHERE preco_lista IS NULL AND preco_avulso IS NOT NULL;

UPDATE public.products
  SET preco_lista = preco_avulso
WHERE preco_lista < preco_avulso;

-- 3. Tabela de preços divergentes (página vs LP /cimento)
CREATE TABLE IF NOT EXISTS public.precos_divergentes (
  produto_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  preco_pagina NUMERIC,
  preco_lp NUMERIC,
  preco_canonico NUMERIC GENERATED ALWAYS AS (LEAST(preco_pagina, preco_lp)) STORED,
  PRIMARY KEY (produto_id)
);

-- 4. Atualizar apenas produtos divergentes: menor preço sempre vence
UPDATE public.products p
  SET preco_avulso = d.preco_canonico
FROM public.precos_divergentes d
WHERE d.produto_id = p.id
  AND d.preco_canonico < p.preco_avulso;

COMMIT;
