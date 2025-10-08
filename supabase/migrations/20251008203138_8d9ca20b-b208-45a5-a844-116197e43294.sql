-- Limpar todos os dados existentes das tabelas

-- Deletar na ordem correta respeitando as foreign keys
DELETE FROM public.subtarefas;
DELETE FROM public.sprint_tarefas;
DELETE FROM public.sprint;
DELETE FROM public.backlog;