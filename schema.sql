-- Gestão de Serviços · banco de dados (Neon / PostgreSQL)
-- Cole este arquivo inteiro em: Neon > SQL Editor > Run

create table if not exists docs (
  collection text        not null,   -- farms, breeders, tanks, movs, meas, products, pmovs, lotes, fichas
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create table if not exists usuarios (
  email      text primary key,
  nome       text not null,
  senha      text not null,          -- senha criptografada (nunca guardamos a senha em texto)
  criado_em  timestamptz not null default now()
);
