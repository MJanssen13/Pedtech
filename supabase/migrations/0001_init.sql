-- Evolução Alojamento Conjunto RN — esquema inicial
-- Login único da equipe: RLS habilitado, acesso total para usuários autenticados.
-- Retenção: registros são apagados 7 dias após a alta (discharged_at).

create extension if not exists "pgcrypto";

-- ───────────────────────────── PACIENTES (mãe + RN) ─────────────────────────────
create table if not exists patients (
  id                       uuid primary key default gen_random_uuid(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  discharged_at            timestamptz,                       -- carimbo do botão "Dar alta"

  -- Identificação
  mae_nome                 text not null,
  mae_rg                   text,
  mae_idade                int,
  leito                    text,
  procedencia              text,
  paridade                 text,                              -- ex.: G4C4
  rn_nome                  text,
  rn_rg                    text,
  sexo                     text check (sexo in ('feminino','masculino','indeterminada')),
  nascimento_em            timestamptz,                       -- DN + HN (p/ horas de vida)

  -- Sala de parto
  nascimento_via           text check (nascimento_via in ('vaginal','cesarea')),
  indicacao_cesarea        text,
  clampeamento             text,
  liquido_amniotico        text,
  apresentacao             text,
  cordao                   text,
  nascimento_descricao     text,                              -- "Evolução do nascimento"
  peso_nascimento_g        int,
  pc_nascimento_cm         numeric(4,1),
  comprimento_nascimento_cm numeric(4,1),
  apgar                    jsonb default '[]'::jsonb,         -- [{tempo:1,valor:9},{tempo:5,valor:9}]

  -- Idade gestacional (em dias completos)
  ig_dum_dias              int,
  ig_dum_data              date,
  ig_usg_dias              int,                               -- IG calculada p/ o nascimento
  ig_usg_ref_data          date,                              -- data do US
  ig_usg_ref_dias          int,                               -- IG no momento do US

  -- Tipagem / sorologias / risco / diagnósticos
  tipagem                  jsonb default '{}'::jsonb,         -- {maeABO,maeRh,ci,rnABO,rnRh,cd}
  sorologias_maternas      text,
  risco                    jsonb default '{}'::jsonb,         -- {tempoBR, gbs, profilaxia:{medicamento,data,hora}}
  diagnosticos             text,

  created_by               text
);

create index if not exists idx_patients_discharged on patients (discharged_at);
create index if not exists idx_patients_leito on patients (leito);

-- ───────────────────────────── EVOLUÇÕES (uma por dia) ──────────────────────────
create table if not exists evolutions (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null references patients(id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  data                date not null,
  horas_vida          int,
  corte_horario       text default '08:00',

  peso_atual_g        int,
  evolucao            jsonb default '{}'::jsonb,  -- acompanhantes, vinculo, pega, succao, producao,
                                                  -- desconfortoResp, complementacao, outrasQueixas,
                                                  -- diurese, meconio, alimentacao
  intercorrencias     text,
  glucotestes         jsonb default '[]'::jsonb,  -- [{hora:'08h', valor:54}]
  triagem             jsonb default '{}'::jsonb,  -- olhinho, coracaozinho{status,data,satMSD,satMID}, linguinha, orelhinha, pezinho
  vacinacao           jsonb default '{}'::jsonb,  -- hepB{status,data}, bcg{status,data}
  fototerapia         jsonb default '{}'::jsonb,  -- {status, inicio, fim}
  bilirrubina         jsonb default '{}'::jsonb,  -- {bilicheck:{valor,data,hora}, bt, bd, bi, serie:[...]}
  exame_fisico        jsonb default '{}'::jsonb,  -- fc, fr, peso, sistemas, ictericia, reflexos
  exames_complementares text,
  condutas            text,
  texto_prontuario    text,                       -- render final em cache p/ copiar
  created_by          text,

  unique (patient_id, data)
);

create index if not exists idx_evolutions_patient on evolutions (patient_id, data desc);

-- ───────────────────────────── SÉRIE DE PESO ────────────────────────────────────
create table if not exists weights (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  data        date not null,
  gramas      int not null,
  nascimento  boolean not null default false,
  unique (patient_id, data)
);

create index if not exists idx_weights_patient on weights (patient_id, data);

-- ───────────────────────────── updated_at trigger ───────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_patients_updated on patients;
create trigger trg_patients_updated before update on patients
  for each row execute function set_updated_at();

drop trigger if exists trg_evolutions_updated on evolutions;
create trigger trg_evolutions_updated before update on evolutions
  for each row execute function set_updated_at();

-- ───────────────────────────── RLS (login único da equipe) ──────────────────────
alter table patients   enable row level security;
alter table evolutions enable row level security;
alter table weights    enable row level security;

create policy "equipe_full_patients"   on patients   for all to authenticated using (true) with check (true);
create policy "equipe_full_evolutions" on evolutions for all to authenticated using (true) with check (true);
create policy "equipe_full_weights"    on weights    for all to authenticated using (true) with check (true);

-- ───────────────────────────── Expurgo 7 dias após alta ─────────────────────────
-- Executado pelo Vercel Cron (rota /api/cron/purge) com a service role,
-- ou diretamente via pg_cron se preferir agendar no banco.
create or replace function purge_discharged() returns int as $$
declare n int;
begin
  delete from patients
   where discharged_at is not null
     and discharged_at < now() - interval '7 days';
  get diagnostics n = row_count;
  return n;
end;
$$ language plpgsql security definer;
