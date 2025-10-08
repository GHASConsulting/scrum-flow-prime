-- Extensões úteis
create extension if not exists "uuid-ossp";

-- =============================================
-- TABELA: backlog
-- =============================================
create table if not exists public.backlog (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  story_points int not null check (story_points >= 0),
  prioridade text not null check (prioridade in ('baixa','media','alta')),
  status text not null check (status in ('todo','doing','done','validated')),
  responsavel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists backlog_status_idx on public.backlog(status);
create index if not exists backlog_prioridade_idx on public.backlog(prioridade);

-- =============================================
-- TABELA: sprint
-- =============================================
create table if not exists public.sprint (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inicio timestamptz not null,
  data_fim timestamptz not null,
  status text not null check (status in ('planejamento','ativo','concluido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sprint_status_idx on public.sprint(status);

-- =============================================
-- TABELA: sprint_tarefas
-- =============================================
create table if not exists public.sprint_tarefas (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references public.sprint(id) on delete cascade,
  backlog_id uuid not null references public.backlog(id) on delete cascade,
  responsavel text,
  status text not null check (status in ('todo','doing','done','validated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sprint_id, backlog_id)
);

create index if not exists st_sprint_idx on public.sprint_tarefas(sprint_id);
create index if not exists st_backlog_idx on public.sprint_tarefas(backlog_id);

-- =============================================
-- TABELA: subtarefas
-- =============================================
create table if not exists public.subtarefas (
  id uuid primary key default gen_random_uuid(),
  sprint_tarefa_id uuid not null references public.sprint_tarefas(id) on delete cascade,
  titulo text not null,
  responsavel text,
  inicio timestamptz not null,
  fim timestamptz not null,
  status text default 'todo' check (status in ('todo','doing','done','validated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subtarefas_st_idx on public.subtarefas(sprint_tarefa_id);

-- =============================================
-- TRIGGERS: updated_at automático
-- =============================================
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

create trigger update_backlog_updated_at before update on public.backlog
  for each row execute function public.update_updated_at_column();

create trigger update_sprint_updated_at before update on public.sprint
  for each row execute function public.update_updated_at_column();

create trigger update_sprint_tarefas_updated_at before update on public.sprint_tarefas
  for each row execute function public.update_updated_at_column();

create trigger update_subtarefas_updated_at before update on public.subtarefas
  for each row execute function public.update_updated_at_column();

-- =============================================
-- TRIGGER: Garantir apenas 1 sprint ativo
-- =============================================
create or replace function public.enforce_single_active_sprint()
returns trigger language plpgsql as $$
begin
  if new.status = 'ativo' then
    update public.sprint 
    set status = 'concluido', updated_at = now()
    where status = 'ativo' and id <> new.id;
  end if;
  return new;
end;$$;

create trigger trg_single_active_sprint
before insert or update on public.sprint
for each row execute function public.enforce_single_active_sprint();

-- =============================================
-- TRIGGER: Validação de datas nas subtarefas
-- =============================================
create or replace function public.validate_subtarefa_dates()
returns trigger language plpgsql as $$
begin
  if new.fim < new.inicio then
    raise exception 'Data fim deve ser maior ou igual à data início';
  end if;
  return new;
end;$$;

create trigger trg_validate_subtarefa_dates
before insert or update on public.subtarefas
for each row execute function public.validate_subtarefa_dates();

-- =============================================
-- TRIGGER: Bloquear validated se subtarefas pendentes
-- =============================================
create or replace function public.block_validate_if_subtasks_open()
returns trigger language plpgsql as $$
declare open_count int;
begin
  if new.status = 'validated' and (old.status is null or old.status <> 'validated') then
    select count(*) into open_count
    from public.subtarefas s
    where s.sprint_tarefa_id = new.id
      and coalesce(s.status, 'todo') not in ('done','validated');
    if open_count > 0 then
      raise exception 'Não é possível validar: existem % subtarefas pendentes.', open_count;
    end if;
  end if;
  return new;
end;$$;

create trigger trg_validate_guard
before update on public.sprint_tarefas
for each row execute function public.block_validate_if_subtasks_open();

-- =============================================
-- RLS: Habilitar Row Level Security
-- =============================================
alter table public.backlog enable row level security;
alter table public.sprint enable row level security;
alter table public.sprint_tarefas enable row level security;
alter table public.subtarefas enable row level security;

-- =============================================
-- RLS POLICIES: Acesso para usuários autenticados
-- =============================================

-- Backlog: todos autenticados podem ler e escrever
create policy "Usuários autenticados podem visualizar backlog"
  on public.backlog for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir no backlog"
  on public.backlog for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar backlog"
  on public.backlog for update
  to authenticated
  using (true);

create policy "Usuários autenticados podem deletar backlog"
  on public.backlog for delete
  to authenticated
  using (true);

-- Sprint: todos autenticados podem ler e escrever
create policy "Usuários autenticados podem visualizar sprints"
  on public.sprint for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir sprints"
  on public.sprint for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar sprints"
  on public.sprint for update
  to authenticated
  using (true);

create policy "Usuários autenticados podem deletar sprints"
  on public.sprint for delete
  to authenticated
  using (true);

-- Sprint Tarefas: todos autenticados podem ler e escrever
create policy "Usuários autenticados podem visualizar sprint_tarefas"
  on public.sprint_tarefas for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir sprint_tarefas"
  on public.sprint_tarefas for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar sprint_tarefas"
  on public.sprint_tarefas for update
  to authenticated
  using (true);

create policy "Usuários autenticados podem deletar sprint_tarefas"
  on public.sprint_tarefas for delete
  to authenticated
  using (true);

-- Subtarefas: todos autenticados podem ler e escrever
create policy "Usuários autenticados podem visualizar subtarefas"
  on public.subtarefas for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir subtarefas"
  on public.subtarefas for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar subtarefas"
  on public.subtarefas for update
  to authenticated
  using (true);

create policy "Usuários autenticados podem deletar subtarefas"
  on public.subtarefas for delete
  to authenticated
  using (true);

-- =============================================
-- SEEDS: Dados de exemplo
-- =============================================

-- Inserir itens no backlog
insert into public.backlog (titulo, descricao, story_points, prioridade, status, responsavel) values
  ('Implementar autenticação', 'Sistema de login e registro de usuários', 8, 'alta', 'todo', 'João Silva'),
  ('Dashboard principal', 'Criar dashboard com métricas principais', 5, 'alta', 'todo', 'Maria Santos'),
  ('API de relatórios', 'Desenvolver endpoints para geração de relatórios', 13, 'media', 'todo', 'Pedro Costa'),
  ('Integração com Stripe', 'Implementar pagamentos com Stripe', 8, 'alta', 'doing', 'Ana Oliveira'),
  ('Testes unitários', 'Criar suite de testes para componentes', 5, 'media', 'todo', 'Carlos Lima'),
  ('Documentação API', 'Documentar todos os endpoints da API', 3, 'baixa', 'todo', 'Julia Fernandes'),
  ('Sistema de notificações', 'Implementar notificações em tempo real', 8, 'media', 'done', 'Roberto Alves'),
  ('Otimização de performance', 'Melhorar tempo de carregamento das páginas', 5, 'media', 'validated', 'Fernanda Rocha');

-- Inserir sprints
insert into public.sprint (nome, data_inicio, data_fim, status) values
  ('Sprint 1 - Fundação', now() - interval '30 days', now() - interval '16 days', 'concluido'),
  ('Sprint 2 - Core Features', now() - interval '14 days', now(), 'ativo'),
  ('Sprint 3 - Refinamento', now() + interval '2 days', now() + interval '16 days', 'planejamento');

-- Inserir tarefas do sprint 1 (concluído)
insert into public.sprint_tarefas (sprint_id, backlog_id, responsavel, status)
select 
  s.id,
  b.id,
  'Roberto Alves',
  'validated'
from public.sprint s
cross join public.backlog b
where s.nome = 'Sprint 1 - Fundação'
  and b.titulo = 'Sistema de notificações';

insert into public.sprint_tarefas (sprint_id, backlog_id, responsavel, status)
select 
  s.id,
  b.id,
  'Fernanda Rocha',
  'validated'
from public.sprint s
cross join public.backlog b
where s.nome = 'Sprint 1 - Fundação'
  and b.titulo = 'Otimização de performance';

-- Inserir tarefas do sprint 2 (ativo)
insert into public.sprint_tarefas (sprint_id, backlog_id, responsavel, status)
select 
  s.id,
  b.id,
  'João Silva',
  'doing'
from public.sprint s
cross join public.backlog b
where s.nome = 'Sprint 2 - Core Features'
  and b.titulo = 'Implementar autenticação';

insert into public.sprint_tarefas (sprint_id, backlog_id, responsavel, status)
select 
  s.id,
  b.id,
  'Maria Santos',
  'todo'
from public.sprint s
cross join public.backlog b
where s.nome = 'Sprint 2 - Core Features'
  and b.titulo = 'Dashboard principal';

-- Inserir subtarefas para a tarefa de autenticação
insert into public.subtarefas (sprint_tarefa_id, titulo, responsavel, inicio, fim, status)
select 
  st.id,
  'Configurar Supabase Auth',
  'João Silva',
  now() - interval '3 days',
  now() - interval '2 days',
  'done'
from public.sprint_tarefas st
join public.backlog b on st.backlog_id = b.id
where b.titulo = 'Implementar autenticação';

insert into public.subtarefas (sprint_tarefa_id, titulo, responsavel, inicio, fim, status)
select 
  st.id,
  'Criar tela de login',
  'João Silva',
  now() - interval '2 days',
  now() + interval '1 day',
  'doing'
from public.sprint_tarefas st
join public.backlog b on st.backlog_id = b.id
where b.titulo = 'Implementar autenticação';

insert into public.subtarefas (sprint_tarefa_id, titulo, responsavel, inicio, fim, status)
select 
  st.id,
  'Criar tela de registro',
  'João Silva',
  now(),
  now() + interval '2 days',
  'todo'
from public.sprint_tarefas st
join public.backlog b on st.backlog_id = b.id
where b.titulo = 'Implementar autenticação';