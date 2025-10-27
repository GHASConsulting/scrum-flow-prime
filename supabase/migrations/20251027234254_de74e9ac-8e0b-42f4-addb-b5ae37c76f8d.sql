-- Criar tabela para registros de acessos de clientes
CREATE TABLE public.client_access_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente TEXT NOT NULL,
  
  -- VPN
  vpn_nome TEXT,
  vpn_executavel_path TEXT,
  vpn_ip_servidor TEXT,
  vpn_usuario TEXT,
  vpn_senha TEXT,
  
  -- Servidor
  servidor_so TEXT,
  servidor_usuario TEXT,
  servidor_senha TEXT,
  
  -- Docker
  docker_so TEXT,
  docker_usuario TEXT,
  docker_senha TEXT,
  
  -- Banco de Dados
  bd_tns TEXT,
  bd_usuario TEXT,
  bd_senha TEXT,
  
  -- Aplicações
  app_nome TEXT,
  app_usuario TEXT,
  app_senha TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_access_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Usuários autenticados podem ver registros de acesso"
ON public.client_access_records
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros de acesso"
ON public.client_access_records
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros de acesso"
ON public.client_access_records
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros de acesso"
ON public.client_access_records
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_access_records_updated_at
BEFORE UPDATE ON public.client_access_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for VPN executables
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vpn-executables', 'vpn-executables', false);

-- Storage policies for VPN executables
CREATE POLICY "Usuários autenticados podem visualizar executáveis"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'vpn-executables');

CREATE POLICY "Usuários autenticados podem fazer upload de executáveis"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vpn-executables');

CREATE POLICY "Usuários autenticados podem deletar executáveis"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vpn-executables');