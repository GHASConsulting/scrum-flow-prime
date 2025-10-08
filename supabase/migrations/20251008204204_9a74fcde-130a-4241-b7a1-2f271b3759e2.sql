-- Atualizar políticas RLS para permitir acesso público temporariamente
-- (Idealmente seria implementado autenticação, mas para MVP permitiremos acesso público)

-- Políticas para backlog
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar backlog" ON public.backlog;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir no backlog" ON public.backlog;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar backlog" ON public.backlog;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar backlog" ON public.backlog;

CREATE POLICY "Permitir acesso público ao backlog"
ON public.backlog FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para sprint
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar sprints" ON public.sprint;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir sprints" ON public.sprint;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar sprints" ON public.sprint;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar sprints" ON public.sprint;

CREATE POLICY "Permitir acesso público às sprints"
ON public.sprint FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para sprint_tarefas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar sprint_tarefas" ON public.sprint_tarefas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir sprint_tarefas" ON public.sprint_tarefas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar sprint_tarefas" ON public.sprint_tarefas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar sprint_tarefas" ON public.sprint_tarefas;

CREATE POLICY "Permitir acesso público às sprint_tarefas"
ON public.sprint_tarefas FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para subtarefas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar subtarefas" ON public.subtarefas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir subtarefas" ON public.subtarefas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar subtarefas" ON public.subtarefas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar subtarefas" ON public.subtarefas;

CREATE POLICY "Permitir acesso público às subtarefas"
ON public.subtarefas FOR ALL
USING (true)
WITH CHECK (true);