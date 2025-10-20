-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS public.project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  status TEXT CHECK (status IN ('planejamento', 'ativo', 'concluido', 'cancelado')) DEFAULT 'planejamento',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de recursos
CREATE TABLE IF NOT EXISTS public.resource (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('interno', 'cliente', 'fornecedor')) DEFAULT 'interno',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de tarefas do cronograma
CREATE TABLE IF NOT EXISTS public.schedule_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.schedule_task(id) ON DELETE SET NULL,
  order_index INT NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  is_summary BOOLEAN NOT NULL DEFAULT false,
  duration_days NUMERIC(10,2),
  duration_is_estimate BOOLEAN NOT NULL DEFAULT false,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  predecessors TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at)
);

-- Criar tabela de dependências
CREATE TABLE IF NOT EXISTS public.schedule_dependency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES public.schedule_task(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES public.schedule_task(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('FS', 'SS', 'FF', 'SF')) DEFAULT 'FS',
  lag_hours INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (predecessor_id, successor_id, type)
);

-- Criar tabela de atribuições de recursos
CREATE TABLE IF NOT EXISTS public.schedule_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.schedule_task(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resource(id) ON DELETE CASCADE,
  role TEXT,
  allocation_pct INT CHECK (allocation_pct BETWEEN 0 AND 100) DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, resource_id)
);

-- Habilitar RLS
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_dependency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_assignment ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público para usuários autenticados)
CREATE POLICY "Permitir acesso público aos projetos" ON public.project FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público aos recursos" ON public.resource FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público às tarefas do cronograma" ON public.schedule_task FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público às dependências" ON public.schedule_dependency FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público às atribuições" ON public.schedule_assignment FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_project_updated_at
  BEFORE UPDATE ON public.project
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_task_updated_at
  BEFORE UPDATE ON public.schedule_task
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();