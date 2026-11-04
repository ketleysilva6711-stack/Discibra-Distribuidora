-- ==============================================================================
-- DISCIBRA — Adicionar coluna endereco_complemento em orcamentos
-- ==============================================================================

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;
