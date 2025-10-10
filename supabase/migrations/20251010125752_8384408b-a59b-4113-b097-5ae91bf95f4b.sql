-- Criar política para permitir que todos os usuários autenticados vejam os perfis
-- Isso é necessário para que o campo "Responsável" possa mostrar a lista de usuários
CREATE POLICY "Usuários autenticados podem ver todos os perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);