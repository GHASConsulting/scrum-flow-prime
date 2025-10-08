-- Corrigir search_path nas funções para segurança

-- =============================================
-- TRIGGER: updated_at automático
-- =============================================
create or replace function public.update_updated_at_column()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;$$;

-- =============================================
-- TRIGGER: Garantir apenas 1 sprint ativo
-- =============================================
create or replace function public.enforce_single_active_sprint()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ativo' then
    update public.sprint 
    set status = 'concluido', updated_at = now()
    where status = 'ativo' and id <> new.id;
  end if;
  return new;
end;$$;

-- =============================================
-- TRIGGER: Validação de datas nas subtarefas
-- =============================================
create or replace function public.validate_subtarefa_dates()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fim < new.inicio then
    raise exception 'Data fim deve ser maior ou igual à data início';
  end if;
  return new;
end;$$;

-- =============================================
-- TRIGGER: Bloquear validated se subtarefas pendentes
-- =============================================
create or replace function public.block_validate_if_subtasks_open()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
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