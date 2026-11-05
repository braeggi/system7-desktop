# Gästebuch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein gemeinsames, live bearbeitbares Gästebuch-Dokument auf dem Schreibtisch, gespeichert in Supabase.

**Architecture:** Ein neuer Inhaltstyp `guestbook` entsteht aus `inhalt/*.gaestebuch`, nur wenn Supabase-Zugangsdaten gebaut wurden. Die Synchronisierung (`GuestbookSync`) kennt Supabase nicht, sondern spricht mit einer schmalen `GuestbookTransport`-Schnittstelle; die Supabase-Umsetzung wird erst beim Öffnen per dynamischem Import geladen. Die Datenbank schützt sich selbst: Versionsnummer, Zeichengrenze, Fassungen per Trigger, Speichern nur über eine Funktion mit Versionsprüfung.

**Tech Stack:** Svelte 5 (Runes), Vite 8, TypeScript, Vitest + Testing Library, Playwright, `@supabase/supabase-js` 2.x, Postgres (Supabase) mit `pg_cron`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-04-gaestebuch-design.md` (ergänzt `docs/superpowers/specs/2026-11-03-system7-desktop-design.md`)

## Global Constraints

- Nicht committen: Der Besitzer hat entschieden, dass auf `feat/desktop` vorerst nichts committet wird. Commit-Schritte entfallen.
- Oberflächentexte und Code-Kommentare auf Deutsch, im Ton des bestehenden Codes.
- System-6-Stil: nur Schwarz-Weiß, 1-Pixel-Linien, Punktmuster, Pixel-Icons 16×16. Schrift im Textfeld wie Lesetext (`var(--font-text)`), Statuszeile in `var(--font-ui)` 12 px.
- Höchstens 20'000 Zeichen (`MAX_LENGTH = 20_000`), in Seite und Datenbank.
- Live-Übertragung höchstens alle 200 ms (`BROADCAST_MS = 200`), Speichern nach 1 s Tipp-Pause (`SAVE_DELAY_MS = 1000`).
- Höchstens eine Fassung pro Minute. Aufräumen täglich: alle der letzten 24 h, eine pro Stunde für 30 Tage, eine pro Tag für immer.
- Kein Supabase-Code und keine Anfrage an Supabase, bevor jemand das Gästebuch öffnet. Beim Schließen wird die Verbindung getrennt.
- Ohne `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` gibt es kein Gästebuch-Icon und der Build schlägt nicht fehl.
- Statustexte exakt: `Lädt …`, `Speichert …`, `Gespeichert`, `Keine Verbindung`, `Inzwischen geändert, neu geladen`, `Voll: höchstens 20'000 Zeichen`. Hinweis ohne Verbindung beim Öffnen: `Das Gästebuch ist gerade nicht erreichbar. Versuch es später noch einmal.`

## Review Focus

1. Gleichzeitiges Tippen: B tippt direkt nachdem A's Live-Text angekommen ist, aber bevor A's gespeicherte Version bei B ist. Erwartet: B's Speichern baut auf A's Version auf und gelingt, statt als Kollision zu enden. Test in Task 3 („baut nach fremdem Live-Text auf dessen Version auf“).
2. Wiederherstellung im Dashboard, während ein Fenster ungespeicherte Eingaben hat. Erwartet: Die Wiederherstellung gewinnt und bleibt, das Fenster meldet `Inzwischen geändert, neu geladen`. Test in Task 3.
3. Das eigene Speichern kommt als Datenbank-Änderung zurück. Erwartet: Text, Schreibmarke und Status bleiben unverändert. Test in Task 3 („eigenes Speichern als Echo ändert nichts“).
4. Fenster wird geschlossen, bevor das Laden fertig ist. Erwartet: kein Fehler, kein verbleibendes Abo. Test in Task 3.
5. Einfügen von Text über die Grenze. Erwartet: auf 20'000 Zeichen gekürzt, Status voll, Datenbank lehnt nichts ab. Test in Task 3.

Nicht automatisch testbar, beim Abschluss von Hand zu prüfen: das SQL-Skript gegen ein echtes Supabase-Projekt (Task 4), die Bildschirmtastatur auf dem iPhone (Task 5), und dass GitHub geplante Workflows nach 60 Tagen ohne Aktivität im Repository abschaltet (im README dokumentiert, Task 6).

---

### Task 1: Inhaltstyp Gästebuch und Icon

**Files:**
- Modify: `src/lib/content/types.ts` (`ItemKind` um `'guestbook'`)
- Modify: `src/lib/content/catalog.ts` (`buildCatalog` erkennt `.gaestebuch`)
- Modify: `src/lib/content/load.ts` (übergibt `guestbook`)
- Create: `src/lib/guestbook/config.ts`
- Create: `src/lib/ui/icons/GuestbookIcon.svelte`
- Modify: `src/lib/ui/Icon.svelte` (Icon für `guestbook`)
- Create: `inhalt/Gästebuch.gaestebuch` (leer), Modify: `inhalt/schreibtisch.json` (`"Gästebuch.gaestebuch": { "x": 1320, "y": 488 }`)
- Create: `.env.example`
- Modify: `.gitignore` (`.env.local` ergänzen, damit Zugangsdaten nicht ins Repository kommen)
- Test: `tests/content/catalog.test.ts`, `tests/guestbook/config.test.ts`

**Interfaces:**
- Produces: `ItemKind = 'text' | 'image' | 'folder' | 'guestbook'`
- Produces: `buildCatalog(input: { markdown; images; layout; guestbook?: boolean }): Catalog` – Dateien auf `/\.gaestebuch$/i` werden zu `{ kind: 'guestbook', title: <Dateiname ohne Endung>, folder }`, nur wenn `guestbook === true`; sonst ignoriert.
- Produces: `interface GuestbookConfig { url: string; anonKey: string }`, `readGuestbookConfig(env: Record<string, unknown>): GuestbookConfig | null` (beide Werte nicht-leere Strings, sonst `null`), `guestbookConfig: GuestbookConfig | null` (aus `import.meta.env`).

- [ ] **Step 1: Failing tests schreiben**

In `tests/content/catalog.test.ts`:
```ts
it('macht .gaestebuch-Dateien zum Gästebuch, wenn es eingerichtet ist', () => {
  const c = buildCatalog({ markdown: {}, images: { '/inhalt/Gästebuch.gaestebuch': '/assets/g' }, layout, guestbook: true })
  expect(c.items['Gästebuch.gaestebuch']).toMatchObject({ kind: 'guestbook', title: 'Gästebuch', folder: null })
})
it('ignoriert .gaestebuch-Dateien ohne Zugangsdaten', () => {
  const c = buildCatalog({ markdown: {}, images: { '/inhalt/Gästebuch.gaestebuch': '/assets/g' }, layout })
  expect(c.items['Gästebuch.gaestebuch']).toBeUndefined()
})
```
In `tests/guestbook/config.test.ts`:
```ts
it('liest URL und Schlüssel', () => {
  expect(readGuestbookConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'k' }))
    .toEqual({ url: 'https://x.supabase.co', anonKey: 'k' })
})
it('gibt null zurück, wenn etwas fehlt oder leer ist', () => {
  expect(readGuestbookConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull()
  expect(readGuestbookConfig({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: 'k' })).toBeNull()
})
```

- [ ] **Step 2: Tests laufen lassen**

Run: `npx vitest run tests/content/catalog.test.ts tests/guestbook/config.test.ts`
Expected: FAIL (Modul `config` fehlt, Gästebuch-Eintrag undefined)

- [ ] **Step 3: Umsetzen**

`types.ts`, `catalog.ts`, `config.ts` wie in Interfaces. `load.ts` ruft `buildCatalog({ …, guestbook: guestbookConfig !== null })`. `GuestbookIcon.svelte`: aufgeschlagenes Buch, 16×16, gleicher Aufbau wie `TextIcon.svelte` (weiße Fläche, schwarze Kontur, `aria-hidden`). `Icon.svelte` zeigt es für `kind === 'guestbook'`. `.env.example` mit beiden Variablen leer und einem deutschen Kommentar. Leere Datei und Position anlegen.

- [ ] **Step 4: Tests und Prüfung**

Run: `npx vitest run tests/content tests/guestbook && npm run check`
Expected: PASS, 0 Fehler

---

### Task 2: Schreibmarke halten

**Files:**
- Create: `src/lib/guestbook/caret.ts`
- Test: `tests/guestbook/caret.test.ts`

**Interfaces:**
- Produces: `keepCaret(oldText: string, newText: string, caret: number): number` – liegt die Marke im gemeinsamen Anfang, bleibt sie; liegt sie im gemeinsamen Ende, behält sie den Abstand zum Textende; sonst wird sie auf `[0, newText.length]` begrenzt.

- [ ] **Step 1: Failing test**
```ts
it('bleibt stehen, wenn hinter der Marke eingefügt wird', () => expect(keepCaret('Hallo', 'Hallo Welt', 3)).toBe(3))
it('rückt mit, wenn vor der Marke eingefügt wird', () => expect(keepCaret('Welt', 'Hallo Welt', 2)).toBe(8))
it('rückt zurück, wenn vor der Marke gelöscht wird', () => expect(keepCaret('Hallo Welt', 'Welt', 8)).toBe(2))
it('bleibt im Text, wenn alles ersetzt wird', () => expect(keepCaret('abcdef', 'xy', 5)).toBe(2))
```
- [ ] **Step 2:** Run `npx vitest run tests/guestbook/caret.test.ts` – Expected: FAIL (Modul fehlt)
- [ ] **Step 3:** `keepCaret` umsetzen (gemeinsames Präfix und Suffix bestimmen, Suffix nicht über das Präfix hinaus).
- [ ] **Step 4:** Run wie Step 2 – Expected: PASS

---

### Task 3: Synchronisierung

**Files:**
- Create: `src/lib/guestbook/transport.ts` (nur Typen)
- Create: `src/lib/guestbook/sync.svelte.ts`
- Create: `tests/fixtures/guestbook.ts` (Ersatz-Server)
- Test: `tests/guestbook/sync.test.ts`

**Interfaces:**
- Produces in `transport.ts`:
```ts
export interface Snapshot { text: string; version: number }
export type SaveResult = { ok: true; version: number } | { ok: false; current: Snapshot }
export interface TransportEvents {
  broadcast(text: string): void          // Live-Text eines anderen Fensters (nie das eigene)
  row(snapshot: Snapshot): void          // Datenbank-Zeile hat sich geändert (auch durch eigenes Speichern)
  connection(online: boolean): void
}
export interface GuestbookTransport {
  load(): Promise<Snapshot>                                    // wirft, wenn nicht erreichbar
  save(text: string, baseVersion: number): Promise<SaveResult> // wirft, wenn nicht erreichbar
  broadcast(text: string): void
  subscribe(events: TransportEvents): () => void               // Rückgabe trennt die Verbindung
}
```
- Produces in `sync.svelte.ts`:
```ts
export const MAX_LENGTH = 20_000
export const BROADCAST_MS = 200
export const SAVE_DELAY_MS = 1000
export const DRAFT_KEY = 'schreibtisch:gaestebuch-entwurf'
export type SyncStatus = 'loading' | 'saving' | 'saved' | 'offline' | 'unavailable'
export class GuestbookSync {
  text: string            // $state
  status: SyncStatus      // $state
  notice: 'conflict' | null  // $state, wird bei der nächsten Eingabe gelöscht
  get full(): boolean     // text.length >= MAX_LENGTH
  get editable(): boolean // status === 'saving' || status === 'saved'
  constructor(transport: GuestbookTransport, storage: Storage | null)
  open(): Promise<void>
  edit(text: string): void
  close(): void
}
```
- Produces in `tests/fixtures/guestbook.ts`: `class FakeServer { text: string; version: number; saves: { text: string; baseVersion: number }[]; transport(): GuestbookTransport; sendBroadcast(text: string): void; ownerEdit(text: string): void; setOnline(online: boolean): void; holdSaves(): () => void }`. Jedes `transport()` ist ein eigener Client. `save` gelingt nur bei passender `baseVersion`, erhöht die Version und meldet `row` an alle Clients. `ownerEdit` ändert direkt (Version +1) und meldet `row`. Offline werfen `load`/`save`, und alle Clients bekommen `connection(false)`. `holdSaves()` hält Speicher-Antworten zurück, bis die zurückgegebene Funktion aufgerufen wird.

**Algorithmus (nicht aus Signatur und Tests ableitbar):**
- Die Sync merkt sich `version` (Serverstand, auf dem sie aufbaut) und `origin` (der Text, von dem die aktuelle ungespeicherte Eingabe ausging: Servertext oder zuletzt übernommener Live-Text).
- `edit(t)`: auf `MAX_LENGTH` kürzen, `text = t`, `notice = null`, Entwurf `{ text, baseVersion: version, origin }` unter `DRAFT_KEY` speichern, Live-Senden drosseln (`BROADCAST_MS`), Speichern entprellen (`SAVE_DELAY_MS`), `status = 'saving'`. Ohne Verbindung (`!editable`) ignorieren.
- Höchstens ein Speichern gleichzeitig. Erfolg: `version` übernehmen, `origin` = gespeicherter Text; hat sich `text` inzwischen geändert, erneut speichern, sonst Entwurf löschen und `status = 'saved'`.
- Kollision mit `current`: Ist `current.text === origin`, mit `current.version` erneut speichern (die Eingabe baute schon auf diesem Text auf). Sonst `text = current.text`, `version`/`origin` übernehmen, Ausstehendes verwerfen, Entwurf löschen, `notice = 'conflict'`, `status = 'saved'`.
- `broadcast(t)`: `text = origin = t`, ausstehendes Speichern und Entwurf verwerfen. `version` bleibt.
- `row(s)`: ignorieren, wenn `s.version <= version`. Ist `s.text === text` oder `s.text === origin`: nur `version` und `origin` übernehmen, Text und Ausstehendes bleiben. Sonst wie eine Kollision behandeln (Server gewinnt; `notice = 'conflict'` nur, wenn eine ungespeicherte Eingabe verworfen wurde).
- Fehler beim Laden in `open()`: `status = 'unavailable'`. Fehler beim Speichern oder `connection(false)`: `status = 'offline'`, Ausstehendes behalten. `connection(true)`: neu laden, das Ergebnis wie `row` behandeln, dann Ausstehendes speichern.
- `open()`: laden, abonnieren. Liegt ein Entwurf mit `baseVersion === snapshot.version` und `origin === snapshot.text`, dessen Text übernehmen und sofort speichern; sonst Entwurf löschen.
- `close()`: Timer stoppen; steht ein Speichern aus, sofort starten. Das Abo erst trennen, wenn laufendes Speichern fertig ist. Wurde `close()` vor dem Ende von `open()` aufgerufen, nach dem Laden nichts mehr übernehmen und sofort trennen.

- [ ] **Step 1: Failing tests schreiben** (alle mit `vi.useFakeTimers()`, `localStorage` vor jedem Test leeren)

```ts
it('lädt den Text und meldet Gespeichert')                       // status 'loading' → 'saved', text = server.text
it('speichert eine Sekunde nach der letzten Eingabe')             // edit; 999 ms: saves.length 0; 1000 ms: saves[0] = { text, baseVersion: 1 }
it('überträgt Eingaben höchstens alle 200 ms live')               // 5 edits in 100 ms → beim anderen Client höchstens 1 broadcast in 200 ms, der letzte Text kommt an
it('übernimmt Live-Text anderer')                                 // b.text === a's text nach sendBroadcast
it('baut nach fremdem Live-Text auf dessen Version auf')          // A tippt+speichert gehalten; B bekommt broadcast, tippt; A's save freigeben; B speichert → ok, B.notice null, server.text === B.text
it('lädt bei echter Kollision den Servertext und meldet sie')     // A und B tippen Verschiedenes ohne Live-Text dazwischen → einer endet mit notice 'conflict' und text === server.text
it('zeigt eine Wiederherstellung im Dashboard sofort, auch mit ungespeicherter Eingabe') // edit; ownerEdit('alt') → text 'alt', notice 'conflict'; nach 1 s kein save, server.text 'alt'
it('eigenes Speichern als Echo ändert nichts')                     // nach eigenem save: text gleich, notice null, status 'saved'
it('ist ohne Verbindung nur lesbar und speichert danach nach')     // edit; setOnline(false) → status 'offline', editable false, text bleibt; setOnline(true) → server.text === eigener Text
it('meldet unavailable, wenn beim Öffnen keine Verbindung besteht')
it('kürzt auf 20000 Zeichen und meldet voll')                      // edit('x'.repeat(20_005)) → text.length 20000, full true
it('speichert beim Schließen sofort und bricht laufendes Speichern nicht ab') // edit; close() vor 1 s → saves.length 1; mit holdSaves: close, dann freigeben → server.text gespeichert
it('hinterlässt nach Schließen vor dem Laden kein Abo')           // close() vor await open → keine Events mehr verarbeitet, kein Fehler
it('schickt einen Entwurf beim nächsten Öffnen nach, wenn der Server unverändert ist')
it('verwirft einen Entwurf, wenn der Server sich inzwischen geändert hat')
```
Die Kommentare sind die Assertions; jeder Test prüft genau diese Werte.

- [ ] **Step 2:** Run `npx vitest run tests/guestbook/sync.test.ts` – Expected: FAIL (Modul fehlt)
- [ ] **Step 3:** `transport.ts`, `FakeServer`, `GuestbookSync` nach Interfaces und Algorithmus umsetzen.
- [ ] **Step 4:** Run wie Step 2 – Expected: 15/15 PASS. Danach `npm test` – Expected: alles grün.

---

### Task 4: Supabase anbinden

**Files:**
- Create: `src/lib/guestbook/supabase.ts`
- Create: `src/lib/guestbook/connect.ts`
- Create: `supabase/gaestebuch.sql`
- Modify: `package.json` (Dependency `@supabase/supabase-js` ^2)

**Interfaces:**
- Consumes: `GuestbookTransport`, `Snapshot`, `SaveResult` (Task 3), `GuestbookConfig`, `guestbookConfig` (Task 1)
- Produces: `createSupabaseTransport(config: GuestbookConfig): GuestbookTransport` in `supabase.ts`
- Produces: `connectGuestbook(): Promise<GuestbookTransport>` in `connect.ts` – `import('./supabase')` dynamisch, wirft, wenn `guestbookConfig === null`. Das ist die einzige Stelle, die `supabase.ts` importiert.

**SQL (`supabase/gaestebuch.sql`, idempotent, deutsch kommentiert):**
- Tabelle `gaestebuch (id int primary key check (id = 1), text text not null default '' check (char_length(text) <= 20000), version bigint not null default 1, geaendert timestamptz not null default now())`, eine Zeile `id = 1` anlegen.
- Tabelle `gaestebuch_fassungen (id bigserial primary key, text text not null, version bigint not null, erstellt timestamptz not null default now())`.
- `before update`-Trigger auf `gaestebuch`: `version = old.version + 1`, `geaendert = now()` (gilt auch für Änderungen im Dashboard).
- `after update`-Trigger: Fassung mit dem **alten** Text und der alten Version anlegen, wenn die jüngste Fassung älter als 1 Minute ist oder keine existiert. So bleibt der Stand vor einer Änderungswelle erhalten.
- Funktion `gaestebuch_speichern(neuer_text text, basis_version bigint) returns table (ok boolean, version bigint, text text)`, `security definer`, `set search_path = public`: Update nur `where id = 1 and version = basis_version`; Erfolg → `ok = true` mit neuer Version; sonst `ok = false` mit aktuellem Stand.
- RLS auf beiden Tabellen an. Policy: `anon` darf `gaestebuch` lesen. Keine Policy auf `gaestebuch_fassungen`. `insert/update/delete` auf beiden Tabellen für `anon, authenticated` entziehen. `execute` auf `gaestebuch_speichern` an `anon` geben.
- Realtime: `gaestebuch` zur Publication `supabase_realtime` hinzufügen.
- Funktion `gaestebuch_aufraeumen()`: Fassungen löschen, die nicht zu den Behaltenen gehören (jünger als 24 h; erste je Stunde der letzten 30 Tage; erste je Tag). `pg_cron` aktivieren und täglich um 03:00 UTC einplanen (`cron.schedule('gaestebuch-aufraeumen', …)`, vorher gleichnamigen Job entfernen).

**Transport:** `load` = `select text, version from gaestebuch where id = 1`. `save` = `rpc('gaestebuch_speichern', …)`. Ein Kanal `gaestebuch` mit Broadcast-Ereignis `text` (`self: false`) und `postgres_changes` (`UPDATE` auf `gaestebuch`). `connection` aus dem Kanalstatus (`SUBSCRIBED` → true; `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED` → false) und aus `online`/`offline`-Ereignissen des Fensters. Die Rückgabe von `subscribe` entfernt Kanal und Listener.

- [ ] **Step 1:** Dependency installieren: `npm i @supabase/supabase-js@^2`
- [ ] **Step 2:** `supabase.ts`, `connect.ts`, SQL schreiben.
- [ ] **Step 3:** Run `npm run check && npm run build` – Expected: 0 Fehler; im Build-Log ein eigener Chunk für Supabase.
- [ ] **Step 4:** Prüfen, dass der Haupt-Chunk Supabase nicht enthält: `grep -L "supabase" dist/assets/index-*.js` – Expected: gibt den Dateinamen aus (kein Treffer im Haupt-Chunk).
- [ ] **Step 5:** SQL von Hand prüfen lassen: im Abschluss den Besitzer bitten, das Skript in einem Supabase-Projekt auszuführen, und dann im Browser ein Speichern, eine Kollision und eine Wiederherstellung durchspielen. Bis dahin gilt die Supabase-Anbindung als ungetestet.

---

### Task 5: Gästebuch-Fenster

**Files:**
- Create: `src/lib/ui/GuestbookView.svelte`
- Modify: `src/lib/ui/WindowContent.svelte`
- Test: `tests/ui/guestbook.test.ts`

**Interfaces:**
- Consumes: `GuestbookSync`, `MAX_LENGTH` (Task 3), `connectGuestbook` (Task 4), `keepCaret` (Task 2), `safeStorage()` aus `src/lib/state/persist.ts`
- Produces: `<GuestbookView />` ohne Props. Beim Einhängen `connectGuestbook()` → `new GuestbookSync(transport, safeStorage())` → `open()`; beim Aushängen `close()`. Schlägt `connectGuestbook` fehl: Hinweis wie bei `unavailable`.

Aufbau: `textarea` (Label „Gästebuch“, `maxlength={MAX_LENGTH}`, `readonly` wenn nicht `editable`, füllt das Fenster, eigene Rollbalken `scroll-retro`) und darunter eine Statuszeile (1-Pixel-Linie oben, 12 px Chicago, `role="status"`). Statuszeile zeigt `notice`/`full` vor dem Status. Bei `unavailable` statt des Textfelds der Hinweistext. Wird `sync.text` von außen geändert, während das Feld fokussiert ist, setzt die Komponente die Auswahl mit `keepCaret` neu. `WindowContent` zeigt `GuestbookView` für `item.kind === 'guestbook'`.

- [ ] **Step 1: Failing tests** (`vi.mock('../../src/lib/guestbook/connect')` liefert `FakeServer.transport()`)
```ts
it('kontaktiert Supabase erst beim Öffnen')       // App mit Katalog inkl. Gästebuch rendern: connectGuestbook nicht aufgerufen; Doppelklick auf „Gästebuch“: einmal aufgerufen
it('zeigt den Text und speichert Eingaben')       // Textfeld hat server.text; tippen; 1 s → server.text enthält Eingabe; Status „Gespeichert“
it('zeigt Keine Verbindung und ist dann schreibgeschützt') // setOnline(false) → Status „Keine Verbindung“, Textfeld readonly
it('zeigt den Hinweis, wenn beim Öffnen nichts erreichbar ist')
it('hält die Schreibmarke bei Live-Text anderer') // Marke auf 3 in „Hallo“, sendBroadcast('Oh Hallo') → selectionStart 6
it('trennt die Verbindung beim Schließen')        // Fenster schließen → Abo beendet (FakeServer zählt aktive Abos: 0)
```
Dafür `FakeServer` um `activeSubscriptions: number` ergänzen.
- [ ] **Step 2:** Run `npx vitest run tests/ui/guestbook.test.ts` – Expected: FAIL
- [ ] **Step 3:** Umsetzen.
- [ ] **Step 4:** Run wie Step 2, dann `npm test && npm run check` – Expected: alles grün, 0 Fehler.
- [ ] **Step 5:** Im Browser ansehen (Dev-Server auf 5173 mit `.env.local`, falls der Besitzer schon Zugangsdaten hat; sonst mit einem temporär auf `FakeServer` umgebogenen `connect.ts`, das danach zurückgesetzt wird): Desktop-Fenster und Handy-Blatt (iPhone 13 in Playwright, WebKit). Auf dem Handy prüfen, dass das Textfeld beim Tippen sichtbar bleibt; sonst Höhe des Blatts an `visualViewport` koppeln.

---

### Task 6: Wach-Job, Veröffentlichung und README

**Files:**
- Create: `.github/workflows/wach-halten.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `README.md`

- [ ] **Step 1:** `deploy.yml`: im Build-Schritt `VITE_SUPABASE_URL: ${{ vars.SUPABASE_URL }}` und `VITE_SUPABASE_ANON_KEY: ${{ vars.SUPABASE_ANON_KEY }}` ergänzen.
- [ ] **Step 2:** `wach-halten.yml`: Name „Gästebuch wach halten“, `on: schedule: cron '17 5 */3 * *'` und `workflow_dispatch`, `permissions: {}`. Ein Schritt: fehlen die Variablen, mit Hinweis und Exit 0 beenden; sonst `curl -fsS "$URL/rest/v1/gaestebuch?select=version&id=eq.1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"`. Liest nur.
- [ ] **Step 3:** README, neuer Abschnitt „Gästebuch“ nach „Inhalte pflegen“: was es ist; Einrichtung in den fünf Schritten aus Spec 4.5 (Konto und EU-Projekt, SQL-Skript im SQL-Editor ausführen, URL und anon key in `.env.local` und als Repository-Variablen `SUPABASE_URL`/`SUPABASE_ANON_KEY`, Fassung wiederherstellen per Kopieren aus `gaestebuch_fassungen` in `gaestebuch.text`, schlafendes Projekt aufwecken); Hinweis, dass GitHub geplante Workflows nach 60 Tagen ohne Aktivität im Repository abschaltet und man den Wach-Job dann unter „Actions“ wieder einschaltet; Datenschutz-Hinweis aus Spec 5; Abschnitt „Gästebuch abschalten“ (Datei `inhalt/Gästebuch.gaestebuch` löschen).
- [ ] **Step 4:** Workflows auf gültiges YAML prüfen: `ruby -ryaml -e 'ARGV.each { |f| YAML.load_file(f) }' .github/workflows/wach-halten.yml .github/workflows/deploy.yml` – Expected: keine Ausgabe, Exit 0. Ob GitHub die Workflows wirklich ausführt, zeigt sich erst nach dem Hochladen; im Abschluss vermerken.

---

### Abschluss

- [ ] `npm test`, `npm run check`, `npm run build`, `npx playwright test` – Expected: alles grün; die bestehenden 12 Browser-Tests laufen unverändert, weil ohne Zugangsdaten kein Gästebuch-Icon erscheint.
- [ ] Dem Besitzer die Einrichtungsschritte aus dem README geben und um den Praxistest aus Task 4 Step 5 bitten.
