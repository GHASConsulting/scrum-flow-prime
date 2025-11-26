-- Create roadmap table
CREATE TABLE IF NOT EXISTS public.roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kr TEXT NOT NULL,
  descricao TEXT,
  atores TEXT,
  tipo_produto TEXT NOT NULL CHECK (tipo_produto IN ('Produto', 'Projeto GHAS', 'Projeto Inovemed')),
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  status TEXT CHECK (status IN (
    'NAO_INICIADO',
    'EM_DESENVOLVIMENTO',
    'TESTES',
    'DESENVOLVIDO',
    'CANCELADO'
  )) DEFAULT 'NAO_INICIADO',
  backlog_ids UUID[],
  sprint_tarefa_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roadmap ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Permitir acesso público ao roadmap"
ON public.roadmap
FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_roadmap_updated_at
BEFORE UPDATE ON public.roadmap
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap;