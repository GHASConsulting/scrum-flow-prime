-- Criar tabela daily
CREATE TABLE public.daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id uuid NOT NULL REFERENCES public.sprint(id) ON DELETE CASCADE,
  usuario text NOT NULL,
  data timestamp with time zone NOT NULL DEFAULT now(),
  ontem text NOT NULL,
  hoje text NOT NULL,
  impedimentos text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.daily ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver dailies
CREATE POLICY "Permitir acesso público aos dailies"
ON public.daily
FOR SELECT
USING (true);

-- Política: Usuários autenticados podem inserir dailies
CREATE POLICY "Usuários autenticados podem inserir dailies"
ON public.daily
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Usuários autenticados podem atualizar dailies
CREATE POLICY "Usuários autenticados podem atualizar dailies"
ON public.daily
FOR UPDATE
TO authenticated
USING (true);

-- Política: Usuários autenticados podem deletar dailies
CREATE POLICY "Usuários autenticados podem deletar dailies"
ON public.daily
FOR DELETE
TO authenticated
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_daily_updated_at
BEFORE UPDATE ON public.daily
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily;