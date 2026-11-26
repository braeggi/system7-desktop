-- Besucherzähler für das Fenster „About This Desktop“.
-- Einmal im SQL-Editor von Supabase ausführen. Mehrfaches Ausführen schadet nicht.
-- Gespeichert wird nur eine Zahl: keine IP-Adresse, kein Cookie, nichts über die Besucher.

create table if not exists public.besucher (
  id int primary key check (id = 1),
  anzahl bigint not null default 0 check (anzahl >= 0)
);
insert into public.besucher (id) values (1) on conflict (id) do nothing;

-- Zählt einen Besuch und gibt die neue Zahl zurück.
create or replace function public.besucher_zaehlen() returns bigint
language sql security definer set search_path = public as $$
  update besucher set anzahl = anzahl + 1 where id = 1 returning anzahl;
$$;

-- Gibt die Zahl zurück, ohne zu zählen.
create or replace function public.besucher_anzahl() returns bigint
language sql stable security definer set search_path = public as $$
  select anzahl from besucher where id = 1;
$$;

-- Zugriffsrechte: Besucher kommen nur über die beiden Funktionen an die Zahl.
alter table public.besucher enable row level security;
revoke all on public.besucher from anon, authenticated;

revoke execute on function public.besucher_zaehlen() from public, anon, authenticated;
revoke execute on function public.besucher_anzahl() from public, anon, authenticated;
grant execute on function public.besucher_zaehlen() to anon, authenticated;
grant execute on function public.besucher_anzahl() to anon, authenticated;
