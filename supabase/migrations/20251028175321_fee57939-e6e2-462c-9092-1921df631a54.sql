-- Criar tabela para múltiplos registros de VPN
CREATE TABLE public.client_vpn_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_record_id UUID NOT NULL REFERENCES public.client_access_records(id) ON DELETE CASCADE,
  vpn_nome TEXT,
  vpn_executavel_path TEXT,
  vpn_ip_servidor TEXT,
  vpn_usuario TEXT,
  vpn_senha TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para múltiplos registros de Servidor
CREATE TABLE public.client_server_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_record_id UUID NOT NULL REFERENCES public.client_access_records(id) ON DELETE CASCADE,
  servidor_so TEXT,
  servidor_ip TEXT,
  servidor_usuario TEXT,
  servidor_senha TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para múltiplos registros de Docker
CREATE TABLE public.client_docker_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_record_id UUID NOT NULL REFERENCES public.client_access_records(id) ON DELETE CASCADE,
  docker_so TEXT,
  docker_usuario TEXT,
  docker_senha TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para múltiplos registros de Banco de Dados
CREATE TABLE public.client_database_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_record_id UUID NOT NULL REFERENCES public.client_access_records(id) ON DELETE CASCADE,
  bd_host TEXT,
  bd_service_name TEXT,
  bd_porta TEXT,
  bd_usuario TEXT,
  bd_senha TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para múltiplos registros de Aplicação
CREATE TABLE public.client_app_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_record_id UUID NOT NULL REFERENCES public.client_access_records(id) ON DELETE CASCADE,
  app_nome TEXT,
  app_usuario TEXT,
  app_senha TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.client_vpn_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_server_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_docker_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_database_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_app_access ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para client_vpn_access
CREATE POLICY "Usuários autenticados podem ver registros VPN"
ON public.client_vpn_access FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros VPN"
ON public.client_vpn_access FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros VPN"
ON public.client_vpn_access FOR UPDATE
USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros VPN"
ON public.client_vpn_access FOR DELETE
USING (true);

-- Criar políticas RLS para client_server_access
CREATE POLICY "Usuários autenticados podem ver registros Servidor"
ON public.client_server_access FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros Servidor"
ON public.client_server_access FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros Servidor"
ON public.client_server_access FOR UPDATE
USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros Servidor"
ON public.client_server_access FOR DELETE
USING (true);

-- Criar políticas RLS para client_docker_access
CREATE POLICY "Usuários autenticados podem ver registros Docker"
ON public.client_docker_access FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros Docker"
ON public.client_docker_access FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros Docker"
ON public.client_docker_access FOR UPDATE
USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros Docker"
ON public.client_docker_access FOR DELETE
USING (true);

-- Criar políticas RLS para client_database_access
CREATE POLICY "Usuários autenticados podem ver registros BD"
ON public.client_database_access FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros BD"
ON public.client_database_access FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros BD"
ON public.client_database_access FOR UPDATE
USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros BD"
ON public.client_database_access FOR DELETE
USING (true);

-- Criar políticas RLS para client_app_access
CREATE POLICY "Usuários autenticados podem ver registros App"
ON public.client_app_access FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros App"
ON public.client_app_access FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros App"
ON public.client_app_access FOR UPDATE
USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros App"
ON public.client_app_access FOR DELETE
USING (true);

-- Remover campos antigos da tabela principal (agora estão nas tabelas relacionadas)
ALTER TABLE public.client_access_records 
DROP COLUMN IF EXISTS vpn_nome,
DROP COLUMN IF EXISTS vpn_executavel_path,
DROP COLUMN IF EXISTS vpn_ip_servidor,
DROP COLUMN IF EXISTS vpn_usuario,
DROP COLUMN IF EXISTS vpn_senha,
DROP COLUMN IF EXISTS servidor_so,
DROP COLUMN IF EXISTS servidor_usuario,
DROP COLUMN IF EXISTS servidor_senha,
DROP COLUMN IF EXISTS docker_so,
DROP COLUMN IF EXISTS docker_usuario,
DROP COLUMN IF EXISTS docker_senha,
DROP COLUMN IF EXISTS bd_tns,
DROP COLUMN IF EXISTS bd_usuario,
DROP COLUMN IF EXISTS bd_senha,
DROP COLUMN IF EXISTS app_nome,
DROP COLUMN IF EXISTS app_usuario,
DROP COLUMN IF EXISTS app_senha;