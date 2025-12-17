-- Adicionar coluna backlog_id na tabela subtarefas
ALTER TABLE public.subtarefas 
ADD COLUMN backlog_id uuid REFERENCES public.backlog(id) ON DELETE CASCADE;

-- Migrar dados existentes: popular backlog_id a partir de sprint_tarefas
UPDATE public.subtarefas s
SET backlog_id = st.backlog_id
FROM public.sprint_tarefas st
WHERE s.sprint_tarefa_id = st.id;

-- Tornar backlog_id NOT NULL após migração
ALTER TABLE public.subtarefas 
ALTER COLUMN backlog_id SET NOT NULL;

-- Manter sprint_tarefa_id como opcional (histórico)
ALTER TABLE public.subtarefas 
ALTER COLUMN sprint_tarefa_id DROP NOT NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_subtarefas_backlog_id ON public.subtarefas(backlog_id);