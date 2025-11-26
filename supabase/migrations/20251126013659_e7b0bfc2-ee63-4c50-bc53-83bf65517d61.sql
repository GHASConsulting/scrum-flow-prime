-- Adicionar coluna tipo_produto à tabela backlog
ALTER TABLE public.backlog 
ADD COLUMN tipo_produto text 
CHECK (tipo_produto IN ('Produto', 'Projeto GHAS', 'Projeto Inovemed'));