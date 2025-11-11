-- Função para bloquear exclusão de subtarefas quando sprint está encerrada
CREATE OR REPLACE FUNCTION public.prevent_subtarefa_deletion_if_sprint_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sprint_status text;
BEGIN
  -- Buscar o status da sprint através da sprint_tarefa
  SELECT s.status INTO sprint_status
  FROM public.sprint s
  INNER JOIN public.sprint_tarefas st ON st.sprint_id = s.id
  WHERE st.id = OLD.sprint_tarefa_id;
  
  -- Se a sprint está concluída, bloquear a exclusão
  IF sprint_status = 'concluido' THEN
    RAISE EXCEPTION 'Não é possível excluir subtarefas de sprints encerradas';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Criar trigger para executar a função antes de deletar
DROP TRIGGER IF EXISTS prevent_subtarefa_deletion_on_closed_sprint ON public.subtarefas;
CREATE TRIGGER prevent_subtarefa_deletion_on_closed_sprint
  BEFORE DELETE ON public.subtarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_subtarefa_deletion_if_sprint_closed();