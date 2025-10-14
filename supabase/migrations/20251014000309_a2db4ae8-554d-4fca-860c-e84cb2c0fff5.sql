-- Criar tabela retrospectiva
CREATE TABLE public.retrospectiva (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id uuid NOT NULL REFERENCES public.sprint(id) ON DELETE CASCADE,
  bom text[] NOT NULL DEFAULT '{}',
  melhorar text[] NOT NULL DEFAULT '{}',
  acoes text[] NOT NULL DEFAULT '{}',
  data timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.retrospectiva ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver retrospectivas
CREATE POLICY "Permitir acesso público às retrospectivas"
ON public.retrospectiva
FOR SELECT
USING (true);

-- Política: Usuários autenticados podem inserir retrospectivas
CREATE POLICY "Usuários autenticados podem inserir retrospectivas"
ON public.retrospectiva
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Usuários autenticados podem atualizar retrospectivas
CREATE POLICY "Usuários autenticados podem atualizar retrospectivas"
ON public.retrospectiva
FOR UPDATE
TO authenticated
USING (true);

-- Política: Usuários autenticados podem deletar retrospectivas
CREATE POLICY "Usuários autenticados podem deletar retrospectivas"
ON public.retrospectiva
FOR DELETE
TO authenticated
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_retrospectiva_updated_at
BEFORE UPDATE ON public.retrospectiva
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.retrospectiva;