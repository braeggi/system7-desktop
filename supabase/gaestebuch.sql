-- Gästebuch für den Schreibtisch.
-- Einmal im SQL-Editor von Supabase ausführen. Mehrfaches Ausführen schadet nicht.

-- Der aktuelle Text: genau eine Zeile. Die Datenbank selbst begrenzt die Länge.
create table if not exists public.gaestebuch (
  id int primary key check (id = 1),
  text text not null default '' check (char_length(text) <= 20000),
  version bigint not null default 1,
  geaendert timestamptz not null default now()
);
insert into public.gaestebuch (id) values (1) on conflict (id) do nothing;

-- Frühere Fassungen zum Wiederherstellen. Besucher haben darauf keinerlei Zugriff.
create table if not exists public.gaestebuch_fassungen (
  id bigserial primary key,
  text text not null,
  version bigint not null,
  erstellt timestamptz not null default now()
);
create index if not exists gaestebuch_fassungen_erstellt on public.gaestebuch_fassungen (erstellt);

-- Jede Änderung erhöht die Version, auch Änderungen im Dashboard.
create or replace function public.gaestebuch_vor_aenderung() returns trigger
language plpgsql as $$
begin
  new.version := old.version + 1;
  new.geaendert := now();
  return new;
end $$;

drop trigger if exists gaestebuch_version on public.gaestebuch;
create trigger gaestebuch_version
  before update on public.gaestebuch
  for each row execute function public.gaestebuch_vor_aenderung();

-- Höchstens einmal pro Minute den Stand VOR der Änderung sichern.
-- So bleibt der Text vor einer Welle von Änderungen erhalten.
create or replace function public.gaestebuch_fassung_sichern() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.text is distinct from new.text
     and not exists (select 1 from gaestebuch_fassungen where erstellt > now() - interval '1 minute') then
    insert into gaestebuch_fassungen (text, version) values (old.text, old.version);
  end if;
  return null;
end $$;

drop trigger if exists gaestebuch_fassung on public.gaestebuch;
create trigger gaestebuch_fassung
  after update on public.gaestebuch
  for each row execute function public.gaestebuch_fassung_sichern();

-- Speichern nur auf dem aktuellen Stand. Sonst kommt der aktuelle Stand zurück.
create or replace function public.gaestebuch_speichern(neuer_text text, basis_version bigint)
returns table (ok boolean, version bigint, text text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
    update gaestebuch g set text = neuer_text
    where g.id = 1 and g.version = basis_version
    returning true, g.version, g.text;
  if not found then
    return query select false, g.version, g.text from gaestebuch g where g.id = 1;
  end if;
end $$;

-- Zugriffsrechte: Besucher dürfen den Text lesen und nur über gaestebuch_speichern ändern.
alter table public.gaestebuch enable row level security;
alter table public.gaestebuch_fassungen enable row level security;

drop policy if exists "Alle dürfen lesen" on public.gaestebuch;
create policy "Alle dürfen lesen" on public.gaestebuch for select to anon, authenticated using (true);
grant select on public.gaestebuch to anon, authenticated;

revoke insert, update, delete, truncate on public.gaestebuch from anon, authenticated;
revoke all on public.gaestebuch_fassungen from anon, authenticated;

revoke execute on function public.gaestebuch_speichern(text, bigint) from public, anon, authenticated;
grant execute on function public.gaestebuch_speichern(text, bigint) to anon, authenticated;

-- Live-Änderungen der Zeile an offene Fenster schicken.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gaestebuch'
  ) then
    alter publication supabase_realtime add table public.gaestebuch;
  end if;
end $$;

-- Alte Fassungen ausdünnen: alle der letzten 24 Stunden, eine pro Stunde für 30 Tage, eine pro Tag für immer.
create or replace function public.gaestebuch_aufraeumen() returns void
language sql security definer set search_path = public as $$
  delete from gaestebuch_fassungen
  where id in (
    select id from (
      select id, erstellt,
        row_number() over (partition by date_trunc('hour', erstellt) order by erstellt) as je_stunde,
        row_number() over (partition by date_trunc('day', erstellt) order by erstellt) as je_tag
      from gaestebuch_fassungen
    ) x
    where erstellt < now() - interval '24 hours'
      and not (erstellt >= now() - interval '30 days' and je_stunde = 1)
      and je_tag <> 1
  );
$$;

revoke execute on function public.gaestebuch_aufraeumen() from public, anon, authenticated;
revoke execute on function public.gaestebuch_vor_aenderung() from public, anon, authenticated;
revoke execute on function public.gaestebuch_fassung_sichern() from public, anon, authenticated;

-- Täglich um 03:00 UTC aufräumen. Falls pg_cron hier nicht angelegt werden darf:
-- in Supabase unter „Integrations → Cron“ aktivieren und das Skript erneut ausführen.
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'gaestebuch-aufraeumen';
  perform cron.schedule('gaestebuch-aufraeumen', '0 3 * * *', 'select public.gaestebuch_aufraeumen()');
end $$;
