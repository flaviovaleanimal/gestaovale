-- Gestão de Serviços · banco de dados (Supabase / PostgreSQL)
-- JÁ APLICADO no projeto "gestao-vale-animal". Guardado aqui só como registro/cópia.

create table if not exists public.docs (
  collection text        not null,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists docs_collection_idx on public.docs (collection);
alter table public.docs enable row level security;

-- Lista de e-mails autorizados (fora da API pública). Só quem está nela lê/grava.
create schema if not exists private;
create table if not exists private.allowed_users (email text primary key);
alter table private.allowed_users enable row level security;
create or replace function private.is_allowed() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.allowed_users u where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email','')));
$$;
revoke all on function private.is_allowed() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_allowed() to authenticated;

drop policy if exists "usuarios autorizados" on public.docs;
create policy "usuarios autorizados" on public.docs for all to authenticated
  using ((select private.is_allowed())) with check ((select private.is_allowed()));

do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null;
end $$;

-- Para autorizar alguém (depois de criar o usuário em Authentication > Users):
-- insert into private.allowed_users (email) values ('pessoa@exemplo.com');

-- Administrador (JÁ APLICADO): is_admin libera Zerar dados, Importar e excluir cadastros
-- alter table private.allowed_users add column is_admin boolean not null default false;
-- update private.allowed_users set is_admin = true where lower(email) = 'seu@email.com';
-- Funções private.is_admin() e public.me_admin() e a política "apagar" (farms, contacts, breeders,
-- products, tanks, estacoes só podem ser apagados por administrador) já estão no projeto.

-- Anexos das Tarefas (JÁ APLICADO): bucket privado "anexos", até 10 MB por arquivo,
-- só usuários autorizados leem/gravam (links temporários de 1 hora).
-- insert into storage.buckets (id,name,public,file_size_limit) values ('anexos','anexos',false,10485760);
-- create policy "anexos autorizados" on storage.objects for all to authenticated
--   using (bucket_id='anexos' and (select private.is_allowed())) with check (bucket_id='anexos' and (select private.is_allowed()));
