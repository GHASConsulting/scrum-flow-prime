-- Adicionar coluna responsavel na tabela schedule_task
ALTER TABLE public.schedule_task 
ADD COLUMN IF NOT EXISTS responsavel text;