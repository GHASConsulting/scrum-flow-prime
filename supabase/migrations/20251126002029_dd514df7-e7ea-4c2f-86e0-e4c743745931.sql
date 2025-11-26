-- Adicionar campo tipo_produto à tabela schedule_task
ALTER TABLE public.schedule_task 
ADD COLUMN tipo_produto text CHECK (tipo_produto IN ('Produto', 'Projeto GHAS', 'Projeto Inovemed'));