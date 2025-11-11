-- Habilitar extensão pgcrypto para hash
create extension if not exists pgcrypto;

-- Tabela de eventos do AVA
create table if not exists public.ava_evento (
  id uuid primary key default gen_random_uuid(),
  nm_cliente text not null,
  dt_registro timestamptz not null,
  ds_tipo text not null,
  ds_descricao text,
  ie_status text not null check (ie_status in ('success','error','pending','info','other')),
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_ava_evento_cliente on public.ava_evento(nm_cliente);
create index if not exists idx_ava_evento_data on public.ava_evento(dt_registro);
create index if not exists idx_ava_evento_tipo on public.ava_evento(ds_tipo);
create index if not exists idx_ava_evento_status on public.ava_evento(ie_status);

-- RLS (usuários autenticados podem CRUD)
alter table public.ava_evento enable row level security;

create policy "auth read ava_evento" 
on public.ava_evento 
for select 
using (auth.role() = 'authenticated');

create policy "auth insert ava_evento" 
on public.ava_evento 
for insert 
with check (auth.role() = 'authenticated');

create policy "auth update ava_evento" 
on public.ava_evento 
for update 
using (auth.role() = 'authenticated');

create policy "auth delete ava_evento" 
on public.ava_evento 
for delete 
using (auth.role() = 'authenticated');

-- Tabela para armazenar configurações de integração (webhook token)
create table if not exists public.integracao_config (
  id uuid primary key default gen_random_uuid(),
  webhook_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir que só exista uma configuração
create unique index if not exists idx_integracao_config_singleton on public.integracao_config ((true));

-- RLS para configurações (apenas administradores)
alter table public.integracao_config enable row level security;

create policy "admin read integracao_config" 
on public.integracao_config 
for select 
using (has_role(auth.uid(), 'administrador'));

create policy "admin write integracao_config" 
on public.integracao_config 
for all 
using (has_role(auth.uid(), 'administrador'));

-- Trigger para atualizar updated_at
create trigger update_integracao_config_updated_at
before update on public.integracao_config
for each row
execute function public.update_updated_at_column();

-- Habilitar realtime para ava_evento
alter publication supabase_realtime add table public.ava_evento;