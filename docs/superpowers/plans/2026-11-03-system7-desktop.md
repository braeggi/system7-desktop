# System-7-Desktop – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine statische persönliche Webseite, die als modernisierter System-7-Schreibtisch funktioniert. Besucher öffnen Text- und Bilddokumente und Ordner und richten den Schreibtisch per Drag and Drop ein. Die Einrichtung wird im `localStorage` gespeichert.

**Architecture:** Die gesamte Logik liegt in reinen TypeScript-Modulen, die mit Vitest getestet werden: Inhaltskatalog, Schreibtisch-Zustand, Speicherung, Geometrie, Gesten, Drop-Regeln und Fensterverwaltung. Die Svelte-5-Komponenten sind dünn darüber gelegt und lesen den Zustand aus Rune-Stores (`*.svelte.ts`). Inhalte aus `inhalt/` werden zur Build-Zeit per `import.meta.glob` eingelesen. Es gibt zwei Darstellungen, die nur von der Breite abhängen: einen freien Schreibtisch und ein Handy-Raster mit Vollbild-Fenstern.

**Tech Stack:** Svelte 5 (Runes), Vite, TypeScript, `marked` (Markdown), Vitest + jsdom + @testing-library/svelte, Playwright (E2E), GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-03-system7-desktop-design.md`

## Global Constraints

- Oberfläche auf Deutsch mit diesen exakten Texten: „Ablage“, „Spezial“, „Öffnen“, „Fenster schließen“, „Über diesen Schreibtisch …“, „Papierkorb entleeren …“, „Schreibtisch aufräumen“, „Papierkorb“.
- Rückfragetext: „Möchtest du den Papierkorb wirklich entleeren?“ mit den Buttons „Abbrechen“ und „Entleeren“.
- Kein Apple-Logo und keine Apple-Grafiken. „System 7“ erscheint nicht als Titel oder Branding. Ganz links im Menü steht ein eigenes Monogramm aus `inhalt/seite.json`.
- Kein Backend, kein Tracking, kein Analytics, keine Cookies. `localStorage` dient nur der Funktion. Schriften werden selbst gehostet, es gibt keine externen Font-CDNs.
- Svelte 5 + Vite + TypeScript, rein statischer Build.
- Drag and Drop nur über Pointer Events, niemals über die HTML5-Drag-and-Drop-API.
- Touch: Gedrückthalten von **400 ms** startet das Ziehen. Toleranz vorher **8 px**, bei Maus startet das Ziehen ab **4 px** Bewegung.
- Kompakte Handy-Darstellung bei Fensterbreite **< 700 px**, und zwar nur abhängig von der Breite.
- Ordner haben genau eine Ebene. Ordner lassen sich nicht in Ordner ziehen.
- `prefers-reduced-motion: reduce` → Zoom-Übergänge und Startbildschirm-Animation aus (Dauer 0).
- Ziel sind aktuelle Versionen von Chrome, Safari, Firefox und Edge. Ohne `backdrop-filter` gibt es einen halbtransparenten Hintergrund als Ersatz.
- Startbildschirm unter 1,5 s (1200 ms), nur einmal pro Browser-Sitzung, per Klick überspringbar.
- Keine Systemtöne.
- Inhaltsformate: `.md` → Textdokument. `.jpg .jpeg .png .webp .gif .svg` → Bilddokument. `.svg` ist eine Ergänzung, damit Platzhalterbilder ohne Binärdateien auskommen.
- Externe Links in Textdokumenten öffnen mit `target="_blank" rel="noopener noreferrer"`.

## Review Focus

1. **Inhalt hat sich zwischen zwei Besuchen geändert:** Ein Dokument wurde hinzugefügt, gelöscht oder in einen anderen Ordner verschoben, oder ein Ordner wurde gelöscht. Die gespeicherte Einrichtung wird abgeglichen, nichts stürzt ab, und Neues erscheint. *Test: Task 3, `reconcile`.*
2. **`localStorage` ist kaputt oder nicht verfügbar:** fremdes oder kaputtes JSON, falsche Version, oder `setItem` wirft einen Fehler (Safari privat). Die Seite startet dann mit der Ausgangsordnung und stürzt beim Speichern nicht ab. *Test: Task 4.*
3. **Der Bildschirm wird kleiner, nachdem Icons oder Fenster platziert wurden** (Handy drehen, Browserfenster verkleinern). Icons bleiben dann vollständig sichtbar, und Fenster-Titelleisten bleiben erreichbar. *Tests: Task 5 `clampPoint`/`computeDeskLayout`, Task 7 `clampWindow`.*
4. **Schnelles Wischen über ein Icon auf dem Handy:** Die Seite scrollt, und es startet nie ein Ziehen. Bewegt sich der Finger vor 400 ms mehr als 8 px, wird abgebrochen. *Test: Task 6, `createGesture`.*
5. **Loslassen auf einem ungültigen Ziel:** zum Beispiel ein Ordner auf einem Ordner, ein Dokument auf seinem eigenen Ordner, auf der Menüleiste oder außerhalb des Fensters. Das Element kehrt dann zurück, und der Zustand ändert sich nicht. *Test: Task 6, `resolveDrop`.*

---

## Dateistruktur

```
index.html, package.json, vite.config.ts, svelte.config.js, tsconfig.json, playwright.config.ts
.gitignore                         node_modules, dist, .superpowers/, test-results, playwright-report
inhalt/                            Inhalte des Besitzers (Platzhalter)
  seite.json                       { "titel": string, "monogramm": string }
  schreibtisch.json                Referenzgröße + Anfangspositionen
  Über mich.md, Kontakt.md
  Projekte/Erstes Projekt.md, Projekte/Zweites Projekt.md
  Fotos/Berg.svg, Fotos/See.svg
public/fonts/                      selbst gehostete Chicago-artige Schrift (woff2) + LICENSE
src/
  main.ts                          mountet App mit echtem Katalog und safeStorage()
  App.svelte                       wählt Desktop oder MobileDesk, Splash, MenuBar
  lib/content/types.ts             ItemId, ItemKind, CatalogItem, Catalog, Point, Size
  lib/content/frontmatter.ts       parseFrontmatter
  lib/content/markdown.ts          renderMarkdown
  lib/content/catalog.ts           buildCatalog (rein)
  lib/content/load.ts              import.meta.glob → buildCatalog (Glue, ungetestet)
  lib/state/desk.ts                Schreibtisch-Zustand + Übergänge (rein)
  lib/state/persist.ts             loadState / saveState / safeStorage
  lib/state/desk.svelte.ts         DeskStore (Runes, speichert bei jeder Änderung)
  lib/geometry/layout.ts           Icon-Geometrie, Platzierung, Raster
  lib/drag/gesture.ts              createGesture (reiner Zustandsautomat)
  lib/drag/drop.ts                 DropTarget, resolveDrop (rein), readDropTarget
  lib/drag/draggable.ts            Svelte-Action, die Gesture + Ghost + Hit-Test verbindet
  lib/windows/windows.svelte.ts    WindowManager (Desktop-Liste + Handy-Stapel)
  lib/viewport.svelte.ts           viewport.size, viewport.compact
  lib/ui/theme.css                 Tokens aus Mockup B
  lib/ui/icons/*.svelte            FolderIcon, TextIcon, ImageIcon, TrashIcon, MonogramIcon
  lib/ui/Icon.svelte, Desktop.svelte, Window.svelte, zoom.ts
  lib/ui/TextViewer.svelte, ImageViewer.svelte, FolderView.svelte, TrashView.svelte, AboutView.svelte
  lib/ui/MenuBar.svelte, Menu.svelte, Clock.svelte, clock.ts, ConfirmDialog.svelte, Splash.svelte
  lib/ui/mobile/MobileDesk.svelte, MobileSheet.svelte
tests/fixtures/catalog.ts          Test-Katalog (siehe Task 2)
tests/**/*.test.ts                 Vitest
e2e/*.spec.ts, e2e/touch.ts        Playwright
.github/workflows/deploy.yml
README.md                          Inhalte pflegen, Entwicklung, Veröffentlichen (Deutsch)
```

Zuständigkeiten:
- `App.svelte` hat zum Testen die Props `catalog: Catalog`, `storage: Storage | null` und `site: SiteConfig`. Nur `main.ts` verwendet `load.ts`.

---

### Task 1: Projektgerüst und Stil-Tokens

**Files:**
- Create: Projekt per `npm create vite@latest . -- --template svelte-ts` (im bestehenden Ordner, die vorhandenen `docs/` und `.superpowers/` bleiben)
- Create: `.gitignore`, `src/lib/ui/theme.css`, `tests/setup.ts`
- Modify: `vite.config.ts`, `src/App.svelte`, `src/main.ts`, `package.json`
- Test: `tests/app.test.ts`

**Interfaces:**
- Produces: `npm test` (Vitest, jsdom), `npm run build`, `npm run dev`. CSS-Variablen aus `theme.css`, die global verfügbar sind.

- [ ] **Step 1:** `git init -b main`, Vite-Template anlegen, `npm i -D vitest jsdom @testing-library/svelte @testing-library/jest-dom @testing-library/user-event`, `npm i marked`. `.gitignore` mit `node_modules`, `dist`, `.superpowers/`, `test-results`, `playwright-report`, `.DS_Store`.
- [ ] **Step 2:** Vitest in `vite.config.ts` einrichten: `test: { environment: 'jsdom', setupFiles: ['tests/setup.ts'], include: ['tests/**/*.test.ts'] }`, Plugin `svelteTesting()` aus `@testing-library/svelte/vite`. In `tests/setup.ts` steht `import '@testing-library/jest-dom/vitest'`. Script `"test": "vitest run"`.
- [ ] **Step 3: Failing test** `tests/app.test.ts` → `it('zeigt den Schreibtisch')`: `render(App, { props: { catalog: emptyCatalog, storage: null, site: { titel: 'Test', monogramm: 'T' } } })`, dann `expect(screen.getByRole('main', { name: 'Schreibtisch' })).toBeInTheDocument()`. `emptyCatalog` = `{ items: {}, order: [], initial: { reference: { w: 1440, h: 900 }, positions: {} } }` (inline, bis Task 2 die Typen liefert).
- [ ] **Step 4:** `npm test`, erwartet: FAIL.
- [ ] **Step 5:** `App.svelte` rendert `<main aria-label="Schreibtisch" class="desk">` mit dem Hintergrund. `theme.css` enthält diese Tokens exakt:
  - `--wallpaper: radial-gradient(circle at 20% 15%, #ffc8a8 0, transparent 45%), radial-gradient(circle at 85% 80%, #9f8cff 0, transparent 50%), linear-gradient(135deg, #2f6f86, #4c3c8f)`
  - `--glass: rgba(250,250,252,.82)`, `--glass-strong: rgba(250,250,252,.95)`, `--glass-blur: 18px`, `--menubar-bg: rgba(255,255,255,.55)`, `--menubar-blur: 14px`
  - `--win-radius: 10px`, `--win-shadow: 0 18px 40px rgba(20,10,60,.35)`, `--close: #ff6b5e`, `--stripe: rgba(0,0,0,.08)`
  - `--ink: #1d1d24`, `--icon-stroke: #2a2a40`, `--fill-folder: #8fc6ff`, `--fill-text: #fff`, `--fill-image: #ffd9c2`, `--fill-trash: #e8e8f0`
  - `--label-shadow: 0 1px 3px rgba(0,0,0,.5)`
  - Ersatz: `@supports not (backdrop-filter: blur(1px))` → `--glass: rgba(250,250,252,.96)`.
  - Schrift: `--font-ui: 'Chicago', Geneva, system-ui, sans-serif` (für Menü und Titel) und `--font-text: system-ui, -apple-system, 'Segoe UI', sans-serif`. Die Schrift-Datei liegt in `public/fonts/` mit Lizenzdatei. Verwendet wird eine frei lizenzierte Chicago-Nachbildung, z. B. ChicagoFLF. **Lizenz vor dem Einbinden prüfen.** Ist keine eindeutig frei, bleibt es beim Ersatz-Stack.
- [ ] **Step 6:** `npm test` → PASS, `npm run build` → erfolgreich.
- [ ] **Step 7: Commit** (inklusive `docs/`): `git add -A && git commit -m "chore: Projektgerüst mit Svelte, Vite und Vitest"`

---

### Task 2: Inhalte einlesen

**Files:**
- Create: `src/lib/content/types.ts`, `frontmatter.ts`, `markdown.ts`, `catalog.ts`, `load.ts`
- Create: `inhalt/` mit den Platzhaltern aus der Dateistruktur, `tests/fixtures/catalog.ts`
- Test: `tests/content/frontmatter.test.ts`, `markdown.test.ts`, `catalog.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ItemId = string;            // Pfad relativ zu inhalt/, ohne führendes '/': "Über mich.md", "Projekte", "Projekte/Erstes Projekt.md"
  export type ItemKind = 'text' | 'image' | 'folder';
  export interface Point { x: number; y: number }
  export interface Size { w: number; h: number }
  export interface CatalogItem { id: ItemId; kind: ItemKind; title: string; folder: ItemId | null; html?: string; src?: string }
  export interface Catalog {
    items: Record<ItemId, CatalogItem>;
    order: ItemId[];                       // stabile Reihenfolge: zuerst Einträge aus schreibtisch.json, dann alphabetisch (localeCompare 'de')
    initial: { reference: Size; positions: Record<ItemId, Point> };
  }
  export interface SiteConfig { titel: string; monogramm: string }
  export function parseFrontmatter(raw: string): { title?: string; body: string }
  export function renderMarkdown(md: string): string
  export function buildCatalog(input: { markdown: Record<string, string>; images: Record<string, string>; layout: LayoutFile }): Catalog
  export interface LayoutFile { referenz: { breite: number; hoehe: number }; positionen: Record<string, { x: number; y: number }> }
  ```
  `markdown` und `images` haben als Schlüssel Pfade wie `/inhalt/Projekte/Erstes Projekt.md`, im Fall von `images` mit der URL als Wert.
- Fixture `tests/fixtures/catalog.ts` exportiert `fixtureCatalog: Catalog` mit:
  - `"Über mich.md"` (Text, oben, Position {x:1200,y:60})
  - `"Projekte"` (Ordner, {x:1200,y:160}) mit `"Projekte/App.md"` (Text)
  - `"Fotos"` (Ordner, keine Position) mit `"Fotos/Berg.svg"` (Bild)
  - `reference: {w:1440,h:900}`
  - `order: ['Über mich.md','Projekte','Fotos','Fotos/Berg.svg','Projekte/App.md']`

  Spätere Tasks verwenden diese IDs.

- [ ] **Step 1: Failing tests**
  - `parseFrontmatter('---\ntitle: Hallo\n---\nText')` → `{ title: 'Hallo', body: 'Text' }`. Ohne Frontmatter → `{ body: raw }`. Titel in Anführungszeichen `title: "A: B"` → `'A: B'`.
  - `renderMarkdown('[x](https://a.de)')` enthält `target="_blank"` und `rel="noopener noreferrer"`. `renderMarkdown('[x](#y)')` enthält kein `target`. `renderMarkdown('# T')` enthält `<h1`.
  - `buildCatalog`:
    - Unterordner wird `kind:'folder'` mit `folder:null`, und seine Dateien bekommen `folder:'Projekte'`.
    - Der Titel kommt aus dem Frontmatter, sonst aus dem Dateinamen ohne Endung (`'Über mich'`).
    - Bilder bekommen `src` mit der URL.
    - `inhalt/Projekte/Unter/X.md` (zweite Ebene) wird dem obersten Ordner `Projekte` zugeordnet, mit ID `Projekte/Unter/X.md`. Es gibt keine zweite Ordner-Ebene.
    - Dateien `seite.json` und `schreibtisch.json` werden keine Items.
    - `initial.positions` enthält nur IDs, die existieren.
    - `order` beginnt mit den Einträgen aus `positionen`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Module implementieren. `parseFrontmatter` ist eigener Code ohne Abhängigkeit: Es liest nur `key: value`-Zeilen zwischen `---`. `renderMarkdown` verwendet `marked` mit eigenem `link`-Renderer. Externe Links erkennt es an `^https?://`. `load.ts` sieht so aus:
  ```ts
  import.meta.glob('/inhalt/**/*.md', { query: '?raw', import: 'default', eager: true })
  import.meta.glob('/inhalt/**/*.{jpg,jpeg,png,webp,gif,svg}', { query: '?url', import: 'default', eager: true })
  ```
  Dazu kommt ein JSON-Import von `schreibtisch.json` und `seite.json`. Exportiert werden `catalog` und `site`.
- [ ] **Step 4:** Platzhalter in `inhalt/` anlegen. `schreibtisch.json` mit `referenz {breite:1440,hoehe:900}` und Positionen für „Über mich.md“, „Projekte“, „Fotos“ und „Kontakt.md“ entlang der rechten Seite. `seite.json` → `{ "titel": "Mein Schreibtisch", "monogramm": "M" }`. Die SVG-Platzhalter sind einfache Verläufe mit Berg- bzw. Seesilhouette.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6: Commit** `feat: Inhalte aus inhalt/ als Katalog einlesen`

---

### Task 3: Schreibtisch-Zustand

**Files:**
- Create: `src/lib/state/desk.ts`
- Test: `tests/state/desk.test.ts`

**Interfaces:**
- Consumes: `Catalog`, `ItemId`, `Point` (Task 2), `fixtureCatalog`
- Produces:
  ```ts
  export type Location = { in: 'desk' } | { in: 'folder'; folder: ItemId } | { in: 'trash' } | { in: 'gone' };
  export interface DeskState {
    version: 1;
    locations: Record<ItemId, Location>;
    positions: Record<ItemId, Point>;   // nur vom Besucher gesetzte Desktop-Positionen (Overrides)
    gridOrder: ItemId[];                // Handy-Reihenfolge der Schreibtisch-Elemente
  }
  export function initialState(c: Catalog): DeskState
  export function reconcile(saved: DeskState, c: Catalog): DeskState
  export function moveToFolder(s: DeskState, c: Catalog, id: ItemId, folder: ItemId): DeskState
  export function moveToTrash(s: DeskState, id: ItemId): DeskState
  export function moveToDesk(s: DeskState, id: ItemId, opts?: { point?: Point; gridIndex?: number }): DeskState
  export function emptyTrash(s: DeskState): DeskState
  export function itemsOnDesk(s: DeskState): ItemId[]          // in gridOrder-Reihenfolge
  export function itemsInFolder(s: DeskState, folder: ItemId, c: Catalog): ItemId[]   // in c.order-Reihenfolge
  export function itemsInTrash(s: DeskState, c: Catalog): ItemId[]
  export function isTrashFull(s: DeskState): boolean
  ```
  „Schreibtisch aufräumen“ ist `initialState(c)`. Alle Funktionen sind unveränderlich und geben einen neuen Zustand zurück. Bei ungültigen Aufrufen geben sie denselben `s` zurück (`toBe`).

- [ ] **Step 1: Failing tests** mit `fixtureCatalog`:
  - `initialState`: Locations sind `"Über mich.md"`→desk, `"Projekte/App.md"`→folder Projekte, `positions` ist `{}`. `gridOrder` ist `['Über mich.md','Projekte','Fotos']` (Katalog-Reihenfolge der Schreibtisch-Elemente).
  - `moveToFolder(s,c,'Über mich.md','Projekte')`: Location wird folder Projekte, das Element ist nicht mehr in `gridOrder` und erscheint in `itemsInFolder`.
  - `moveToFolder` mit einem Ordner als `id` oder einem Nicht-Ordner als `folder` gibt `s` zurück (`toBe`).
  - `moveToTrash(s,'Projekte')`: `isTrashFull` ist true, `itemsInTrash` ist `['Projekte']`, und die Location von `Projekte/App.md` bleibt folder Projekte. So kommt der Ordner mit seinem Inhalt zurück.
  - `moveToDesk(s,id,{point:{x:5,y:40}})`: setzt `positions[id]` und die Location desk. Mit `gridIndex:0` wird das Element vorne in `gridOrder` eingefügt.
  - `emptyTrash`: Alles mit Location trash wird gone. `isTrashFull` ist danach false.
  - `initialState` nach `emptyTrash` stellt alles wieder her, auch gone-Elemente (gleich `initialState(c)`).
  - **Review Focus 1 – `reconcile`:**
    1. Eine gespeicherte ID, die es nicht mehr gibt, wird entfernt (aus `locations`, `positions` und `gridOrder`).
    2. Ein neues Katalog-Item bekommt seine Ausgangs-Location. Liegt es auf dem Schreibtisch, wird es an `gridOrder` angehängt.
    3. Eine Location `folder:'Weg'`, deren Ordner nicht mehr existiert, wird desk und an `gridOrder` angehängt.
    4. Wenn der Besitzer ein Dokument in einen anderen Ordner verschoben hat, ändert sich seine ID (der Pfad). Es gilt dann als neu (Fall 2), und die alte ID verschwindet (Fall 1).
    5. Ein `gridOrder`-Eintrag, dessen Location nicht desk ist, wird entfernt.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: Schreibtisch-Zustand mit Ordnern, Papierkorb und Abgleich`

---

### Task 4: Speicherung und DeskStore

**Files:**
- Create: `src/lib/state/persist.ts`, `src/lib/state/desk.svelte.ts`
- Test: `tests/state/persist.test.ts`, `tests/state/store.test.ts`

**Interfaces:**
- Consumes: Task 3
- Produces:
  ```ts
  export const STORAGE_KEY = 'schreibtisch:v1';
  export function safeStorage(): Storage | null                       // probt setItem/removeItem, null bei Fehler
  export function loadState(storage: Storage | null): DeskState | null // null bei fehlend, JSON-Fehler, falscher Form/Version, Exception
  export function saveState(storage: Storage | null, s: DeskState): void  // schluckt Exceptions
  export class DeskStore {
    constructor(catalog: Catalog, storage: Storage | null)  // state = reconcile(loadState(...)) ?? initialState
    readonly catalog: Catalog;
    state: DeskState;                                        // $state
    moveToFolder(id: ItemId, folder: ItemId): void
    moveToTrash(id: ItemId): void
    moveToDesk(id: ItemId, opts?: { point?: Point; gridIndex?: number }): void
    emptyTrash(): void
    cleanUp(): void
  }
  ```
  Jede Methode setzt `state` und ruft danach `saveState` auf.

- [ ] **Step 1: Failing tests (Review Focus 2):**
  - `loadState` liefert `null` für: kein Eintrag, `'{kaputt'`, `'{"version":2}'`, `'[]'`, `'{"version":1,"locations":null}'`, und wenn `getItem` wirft.
  - Ein Roundtrip `saveState` → `loadState` ist gleich (`toEqual`).
  - `saveState` mit einem `setItem`, das `QuotaExceededError` wirft, wirft selbst nicht.
  - `safeStorage()` liefert `null`, wenn `localStorage.setItem` wirft (mit `vi.spyOn(Storage.prototype,'setItem')`).
  - `new DeskStore(fixtureCatalog, storageMitKaputtemJSON).state` ist gleich `initialState(fixtureCatalog)`.
  - `store.moveToTrash('Über mich.md')` schreibt den neuen Zustand unter `STORAGE_KEY`.
  - Ein neuer `DeskStore` auf demselben Storage hat das Element wieder im Papierkorb.
  - `store.cleanUp()` → `state` ist gleich `initialState`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren (die Formprüfung in `loadState` ist handgeschrieben, ohne Schema-Bibliothek). **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: Einrichtung im localStorage speichern`

---

### Task 5: Geometrie der Icons

**Files:**
- Create: `src/lib/geometry/layout.ts`
- Test: `tests/geometry/layout.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const ICON_BOX: Size = { w: 80, h: 72 };
  export const MENU_BAR_H = 22;
  export const MARGIN = 16;
  export const GAP = 8;
  export function trashPosition(vp: Size): Point                        // { x: vp.w - 80 - 16, y: vp.h - 72 - 16 }
  export function scaleInitial(p: Point, ref: Size, vp: Size): Point    // je Achse Faktor min(1, vp/ref), gerundet
  export function clampPoint(p: Point, vp: Size): Point                 // x ∈ [0, vp.w-80], y ∈ [22, vp.h-72]
  export function overlaps(a: Point, b: Point): boolean                 // ICON_BOX-Rechtecke schneiden sich
  export function findFreeSpot(occupied: Point[], vp: Size): Point
  export function computeDeskLayout(ids: ItemId[], initial: Record<ItemId, Point>, overrides: Record<ItemId, Point>, ref: Size, vp: Size): Record<ItemId, Point>
  export function moveInGrid(order: ItemId[], id: ItemId, index: number): ItemId[]
  ```
  `findFreeSpot` sucht Spalten von rechts nach links ab. Die erste Spalte hat `x = vp.w - MARGIN - 80`, jede weitere liegt um `80 + GAP` weiter links. Innerhalb einer Spalte geht es von oben nach unten, beginnend bei `y = MENU_BAR_H + MARGIN` mit Schritt `72 + GAP`. Die erste Position, die weder `occupied` noch den Papierkorb überlappt, wird zurückgegeben. Ist nichts frei, gilt `{x: MARGIN, y: MENU_BAR_H + MARGIN}`.
  `computeDeskLayout` legt die Positionen in dieser Reihenfolge fest:
  1. Overrides (geklemmt), sie werden nie verschoben.
  2. Anfangspositionen (skaliert und geklemmt). Wenn eine davon etwas bereits Platziertes oder den Papierkorb überlappt, wird `findFreeSpot` verwendet.
  3. Alles ohne Position bekommt `findFreeSpot`.

- [ ] **Step 1: Failing tests:**
  - `scaleInitial({x:1200,y:60},{w:1440,h:900},{w:720,h:900})` → `{x:600,y:60}`. Bei größerem Viewport bleibt es unverändert.
  - `clampPoint({x:2000,y:-5},{w:1024,h:768})` → `{x:944,y:22}`.
  - `findFreeSpot([], {w:1024,h:768})` → `{x:928,y:38}`. Mit `[{x:928,y:38}]` → `{x:928,y:118}`.
  - **Review Focus 3:** `computeDeskLayout` mit einem Override `{x:1300,y:850}` im Viewport `{w:800,h:600}` liefert `{x:720,y:528}`.
  - Nach `computeDeskLayout` mit drei IDs und identischen Anfangspositionen überlappen sich keine zwei Ergebnisse, und keines überlappt `trashPosition`.
  - `moveInGrid(['a','b','c'],'c',0)` → `['c','a','b']`. Ein Index über der Länge hängt das Element hinten an.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: Icon-Platzierung, Klemmen und Raster`

---

### Task 6: Gesten und Drop-Regeln

**Files:**
- Create: `src/lib/drag/gesture.ts`, `src/lib/drag/drop.ts`, `src/lib/drag/draggable.ts`
- Test: `tests/drag/gesture.test.ts`, `tests/drag/drop.test.ts`

**Interfaces:**
- Consumes: `CatalogItem`, `Location`, `Point`
- Produces:
  ```ts
  // gesture.ts
  export type GesturePhase = 'idle' | 'pending' | 'dragging' | 'cancelled';
  export type GestureEnd = 'tap' | 'drop' | 'none';
  export const LONG_PRESS_MS = 400, TOUCH_TOLERANCE = 8, MOUSE_THRESHOLD = 4;
  export function createGesture(pointerType: string): {
    readonly phase: GesturePhase;
    down(t: number, x: number, y: number): void;
    move(t: number, x: number, y: number): GesturePhase;
    tick(t: number): GesturePhase;     // vom Timer aufgerufen
    up(): GestureEnd;                  // 'tap' wenn nie dragging/cancelled, 'drop' wenn dragging
  }
  // drop.ts
  export type DropTarget = { type: 'desk'; point?: Point; gridIndex?: number } | { type: 'folder'; folder: ItemId } | { type: 'trash' } | null;
  export type DropAction =
    | { type: 'moveToDesk'; id: ItemId; point?: Point; gridIndex?: number }
    | { type: 'moveToFolder'; id: ItemId; folder: ItemId }
    | { type: 'moveToTrash'; id: ItemId } | null;
  export function resolveDrop(item: CatalogItem, from: Location, target: DropTarget): DropAction
  export function readDropTarget(el: Element | null): DropTarget   // liest data-drop="desk|folder|trash", data-folder-id, data-grid-index
  // draggable.ts
  export function draggable(node: HTMLElement, opts: DraggableOptions): { update(o: DraggableOptions): void; destroy(): void }
  export interface DraggableOptions {
    id: ItemId;
    canDrop: (target: DropTarget) => boolean;   // Aufrufer: t => resolveDrop(item, location, t) !== null
    onTap?: (pointerType: string) => void;
    onDragStart?: () => void;
    onDrop: (target: DropTarget, pointer: Point) => void;
    onDragEnd?: () => void;
  }
  ```
  Für `pointerType` `'touch'` und `'pen'` gelten Long-Press und Toleranz. Alles andere verhält sich wie Maus: `dragging` ab einer Bewegung über 4 px, ohne Long-Press.

- [ ] **Step 1: Failing tests:**
  - Maus: `down(0,0,0)`, dann `move(10,3,0)` → `pending`, dann `move(20,5,0)` → `dragging`, dann `up()` → `drop`.
  - Maus ohne Bewegung: `up()` → `tap`.
  - **Review Focus 4:** Touch: `down(0,0,0)`, dann `move(100,10,0)` → `cancelled`, dann `tick(500)` → `cancelled`, dann `up()` → `none`.
  - Touch: `down(0,0,0)`, `tick(399)` → `pending`, `tick(400)` → `dragging`, dann `move(450,60,0)` → `dragging`.
  - Touch mit kleiner Bewegung: `move(200,5,0)` → `pending`, dann `tick(400)` → `dragging`.
  - Touch: kurzes Tippen `down`, dann `up()` vor 400 ms → `tap`.
  - **Review Focus 5 – `resolveDrop`:**
    - Ordner auf Ordner → `null`.
    - `"Projekte/App.md"` aus folder Projekte auf folder Projekte → `null`.
    - Etwas aus trash auf trash → `null`.
    - Ziel `null` → `null`.
    - Text auf folder Fotos → `moveToFolder`.
    - Ordner auf trash → `moveToTrash`.
    - Desk mit point → `moveToDesk` mit point.
    - Ein Ordner auf sich selbst (`folder === item.id`) → `null`.
  - `readDropTarget`: ein Element mit `data-drop="folder" data-folder-id="Fotos"` → `{type:'folder',folder:'Fotos'}`. Ein Element ohne Attribut, dessen Vorfahre `data-drop="trash"` hat → trash (`closest('[data-drop]')`). `null` → `null`.
- [ ] **Step 2:** FAIL. **Step 3:** `gesture.ts`, `drop.ts` implementieren.
- [ ] **Step 4:** `draggable.ts` implementieren (Glue, wird per E2E in Task 8/10 geprüft).
  - **Pointer-Ereignisse:** Bei `pointerdown` wird ein Gesture erstellt, und für Touch startet ein Timer über `LONG_PRESS_MS`. Bei `dragging` wird `setPointerCapture` aufgerufen.
  - **Ghost:** Es wird ein Klon des Icons erzeugt, `position:fixed`, `pointer-events:none`, `scale(1.12)`, mit Schatten. Das Original bekommt währenddessen `opacity:.25`.
  - **Hit-Test:** Auf jedem `pointermove` wird `readDropTarget(document.elementFromPoint(x,y))` aufgerufen. Das aktuelle Ziel bekommt `data-drop-hover`, aber nur wenn `canDrop(target)` gilt. So wird ein Ordner beim Ziehen eines Ordners nicht hervorgehoben. Das alte Ziel verliert das Attribut.
  - **Ziehen auf Touch:** Am Node hängt ein `touchmove`-Listener mit `{ passive: false }`, der `preventDefault()` aufruft, solange die Phase `dragging` ist. Ohne ihn bricht der Browser beim ersten Wischen mit `pointercancel` ab.
  - **`pointercancel`:** Er beendet das Ziehen ohne Drop.
  - **Kontextmenü:** `contextmenu` wird während `pending`/`dragging` verhindert (Long-Press-Menü auf Android/iOS). Icons haben `-webkit-touch-callout:none; user-select:none`.
- [ ] **Step 5:** PASS.
- [ ] **Step 6: Commit** `feat: Gesten-Erkennung und Drop-Regeln`

---

### Task 7: Fensterverwaltung

**Files:**
- Create: `src/lib/windows/windows.svelte.ts`, `src/lib/viewport.svelte.ts`
- Test: `tests/windows/windows.test.ts`

**Interfaces:**
- Consumes: `ItemId`, `Size`, `Point`, `MENU_BAR_H`
- Produces:
  ```ts
  export type WindowContent = { kind: 'item'; id: ItemId } | { kind: 'trash' } | { kind: 'about' };
  export function contentKey(c: WindowContent): string   // 'item:<id>' | 'trash' | 'about'
  export interface Rect { x: number; y: number; w: number; h: number }
  export interface WinState extends Rect { key: string; content: WindowContent; z: number; from?: Rect }
  export const MIN_WIN: Size = { w: 220, h: 140 };
  export function clampWindow(r: Rect, vp: Size): Rect
  export class WindowManager {
    windows: WinState[];               // $state, Desktop
    stack: WindowContent[];            // $state, Handy, max. 2
    readonly frontmost: WinState | null;
    open(c: WindowContent, size: Size, vp: Size, from?: Rect): void
    focus(key: string): void
    close(key: string): void
    closeFrontmost(): void
    move(key: string, x: number, y: number, vp: Size): void
    resize(key: string, w: number, h: number, vp: Size): void
    openMobile(c: WindowContent, isDocument: boolean): void
    closeMobile(): void
    closeForItems(ids: ItemId[]): void   // schließt Desktop-Fenster und entfernt Einträge aus stack
    closeAll(): void
  }
  export const viewport: { readonly size: Size; readonly compact: boolean }   // compact = size.w < 700, aktualisiert per resize
  ```
  `clampWindow` setzt zuerst `w`/`h` mindestens auf `MIN_WIN` und höchstens auf `vp`. Danach wird `x` auf `[80 - w, vp.w - 80]` geklemmt und `y` auf `[MENU_BAR_H, vp.h - 24]`, damit ein Teil der Titelleiste immer greifbar bleibt. Neue Fenster werden kaskadiert: `x = 40 + 24·n`, `y = MENU_BAR_H + 30 + 24·n` (n = Anzahl offener Fenster, modulo 8), dann `clampWindow`. Für `openMobile` gilt: Ist das oberste Element des Stapels ein Ordner oder der Papierkorb und `isDocument` wahr, wird das Dokument darauf gelegt. Sonst wird der Stapel durch `[c]` ersetzt.

- [ ] **Step 1: Failing tests:**
  - `open` zweimal mit demselben Inhalt → `windows.length === 1`, und der zweite Aufruf macht das Fenster zum `frontmost`.
  - `focus` gibt dem Fenster den höchsten `z`.
  - **Review Focus 3:** `move(key, 5000, -50, {w:1024,h:768})` → `x === 944`, `y === 22`. `resize(key, 50, 50, vp)` → `w === 220`, `h === 140`. `clampWindow({x:0,y:0,w:2000,h:2000},{w:800,h:600})` → `w === 800`, `h === 600`.
  - `closeFrontmost` schließt das Fenster mit dem höchsten `z`.
  - `closeForItems(['Projekte','Projekte/App.md'])` schließt beide Fenster und lässt andere stehen.
  - `openMobile({kind:'item',id:'Projekte'}, false)`, danach `openMobile({kind:'item',id:'Projekte/App.md'}, true)` → `stack.length === 2`. `closeMobile()` → Ordner oben. Ein weiteres `openMobile` mit einem Dokument, wenn das oberste ein Dokument ist, ersetzt den Stapel (`length === 1`).
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: Fensterverwaltung für Desktop und Handy`

---

### Task 8: Desktop-Oberfläche

**Files:**
- Create: `src/lib/ui/icons/{FolderIcon,TextIcon,ImageIcon,TrashIcon}.svelte` (Prop `full?: boolean` nur bei TrashIcon), `Icon.svelte`, `Desktop.svelte`, `Window.svelte`, `zoom.ts`, `TextViewer.svelte`, `ImageViewer.svelte`, `FolderView.svelte`, `TrashView.svelte`
- Create: `playwright.config.ts`, `e2e/desktop.spec.ts`
- Modify: `src/App.svelte`
- Test: `tests/ui/desktop.test.ts`

**Interfaces:**
- Consumes: `DeskStore` (Task 4), `computeDeskLayout`, `trashPosition` (Task 5), `draggable`, `resolveDrop` (Task 6), `WindowManager`, `viewport` (Task 7)
- Produces: `App.svelte` legt `DeskStore` und `WindowManager` an und stellt sie per `setContext('desk')` und `setContext('windows')` bereit. Außerdem gibt es eine Auswahl `selection: ItemId | null` per `setContext('selection')`, ein `$state`-Objekt `{ id }`. Task 9 und 10 verwenden diese Kontexte.

Verhalten nach Spec Abschnitt 5:
- **Icon:**
  - `<button>` mit `aria-label`, gleich dem Titel.
  - `aria-pressed` zeigt die Auswahl an. Ausgewählt heißt: Die Beschriftung hat einen dunklen, abgerundeten Hintergrund und das Icon wird abgedunkelt.
  - Klick wählt aus, Doppelklick öffnet, Enter öffnet.
  - `onTap('touch'|'pen')` öffnet sofort (Touch auf dem freien Schreibtisch, z. B. iPad). `onTap('mouse')` wählt nur aus.
  - Doppelklick auf den Papierkorb öffnet `{kind:'trash'}`.
  - Ordner-Icons haben `data-drop="folder" data-folder-id`.
  - Der Papierkorb ist ein Icon mit `data-drop="trash"`. Er liegt bei `trashPosition` und hat das `aria-label` „Papierkorb“ bzw. „Papierkorb (voll)“.
- **Schreibtisch:**
  - Die Fläche hat `data-drop="desk"`. Ein Klick auf die leere Fläche hebt die Auswahl auf.
  - Die Positionen kommen aus `computeDeskLayout(itemsOnDesk, catalog.initial.positions, state.positions, catalog.initial.reference, viewport.size)`.
- **Drop:**
  - Ziel `desk` → `point` = Zeigerposition minus Greif-Offset.
  - Ziel `trash` → zusätzlich wird `windows.closeForItems([id, ...itemsInFolder(desk.state, id, desk.catalog)])` aufgerufen.
  - Jede Aktion wird über die `DeskStore`-Methode ausgeführt. Bei `null` fliegt der Ghost zurück (150 ms).
- **Window:**
  - Die Titelleiste hat Nadelstreifen (`repeating-linear-gradient(transparent 0 2px, var(--stripe) 2px 3px)`) und einen mittigen Titel auf `--glass-strong`. Links sitzt das Schließfeld (`aria-label="Schließen"`, `--close`, 12 px, Radius 3 px).
  - Die Titelleiste ist per Pointer verschiebbar, bei Touch sofort.
  - Unten rechts sitzt das Größenfeld (`aria-label="Größe ändern"`).
  - `role="dialog"`, `aria-label` gleich dem Titel. `pointerdown` ruft `focus` auf.
  - Inhalt nach Typ: Text → `TextViewer` (`{@html item.html}` in `.prose`, scrollbar, `--font-text`). Bild → `ImageViewer`. Ordner → `FolderView`. Papierkorb → `TrashView`.
- **FolderView und TrashView:**
  - Sie zeigen ihre Elemente als Icons in einem fließenden Raster.
  - Die Elemente sind `draggable`, sodass man sie auf den Schreibtisch, auf andere Ordner und auf den Papierkorb ziehen kann.
  - Die Fläche der FolderView hat selbst `data-drop="folder" data-folder-id`, sodass man Dokumente auch ins offene Fenster ziehen kann.
- **Standardgrößen:** Text `420×320`. Ordner und Papierkorb `360×240`. Bild: natürliche Größe, auf 70 % des Viewports begrenzt, mindestens `MIN_WIN`. Die Bildgröße wird vor dem Öffnen per `new Image()` geladen. Gibt es einen Fehler, wird `420×320` verwendet.
- **`zoom.ts`:**
  - Svelte-Transition `zoom(node, { from?: Rect, duration = 220 })`. Sie animiert `transform` von der Icon-Position und -Größe zum Fenster, mit `cubicOut`.
  - Ohne `from` oder bei `prefers-reduced-motion` ist `duration` 0.
  - Beim Öffnen ist `from` gleich `getBoundingClientRect()` des Icons.
- **Tastatur:** Escape → `closeFrontmost()`. Cmd/Strg+W → `closeFrontmost()` mit `preventDefault`. In Browsern, die das nicht abfangen lassen, gilt das als bekannt und ist akzeptiert.

- [ ] **Step 1: Failing component tests** (`tests/ui/desktop.test.ts`, App mit `fixtureCatalog`, `storage: null`, jsdom-Breite 1280):
  - `it('Klick wählt ein Icon aus')`: `aria-pressed="true"` auf „Über mich“.
  - `it('Doppelklick öffnet ein Fenster mit dem Titel')`: `getByRole('dialog', { name: 'Über mich' })`.
  - `it('Enter auf fokussiertem Icon öffnet')`.
  - `it('Schließfeld schließt das Fenster')`.
  - `it('Escape schließt das vorderste Fenster')`.
  - `it('Ordner öffnen zeigt seinen Inhalt')`: Doppelklick „Projekte“ → im Dialog gibt es den Button „App“.
  - `it('Zweimal öffnen ergibt ein Fenster')`.
- [ ] **Step 2:** FAIL. **Step 3:** Komponenten bauen. **Step 4:** PASS.
- [ ] **Step 5:** Playwright einrichten. `npm i -D @playwright/test && npx playwright install chromium webkit`. Konfiguration mit `webServer: { command: 'npm run dev -- --port 5180', port: 5180 }` und den Projekten `desktop` (Desktop Chrome) und `mobile` (`devices['iPhone 13']`, WebKit). Script `"e2e": "playwright test"`.
- [ ] **Step 6: E2E** `e2e/desktop.spec.ts` (Projekt desktop), ausgeführt gegen die Platzhalter aus `inhalt/`:
  - „Über mich“ mit `page.mouse` auf den Papierkorb ziehen → das Icon ist weg, `aria-label` wird „Papierkorb (voll)“, nach `page.reload()` ist es immer noch weg.
  - „Kontakt“ auf den Ordner „Projekte“ ziehen → nach dem Öffnen von „Projekte“ ist „Kontakt“ im Dialog. Von dort auf eine freie Fläche ziehen → es liegt wieder auf dem Schreibtisch.
  - „Projekte“ auf „Fotos“ ziehen → nichts ändert sich, beide Icons liegen auf dem Schreibtisch.
  - Ein Fenster an der Titelleiste nach `x=5000` ziehen → seine Titelleiste ist noch sichtbar (`boundingBox().x < viewport.width`).
- [ ] **Step 7:** `npm run e2e -- --project=desktop` → PASS.
- [ ] **Step 8: Commit** `feat: Desktop mit Icons, Fenstern und Drag and Drop`

---

### Task 9: Menüleiste, Dialoge und Uhr

**Files:**
- Create: `src/lib/ui/MenuBar.svelte`, `Menu.svelte`, `Clock.svelte`, `clock.ts`, `ConfirmDialog.svelte`, `AboutView.svelte`, `icons/MonogramIcon.svelte`
- Modify: `src/App.svelte`, `src/lib/ui/Window.svelte` (Inhalt `about`)
- Test: `tests/ui/menubar.test.ts`, `tests/ui/clock.test.ts`

**Interfaces:**
- Consumes: Kontexte `desk`, `windows`, `selection` (Task 8), `site: SiteConfig`
- Produces: `formatClock(d: Date): string` gibt `HH:MM` im 24-Stunden-Format zurück (`de-DE`).

Menüs (Spec 5, „Menüleiste“):
- **Monogramm** (eigener Kreis mit `site.monogramm`, `aria-label="Über diesen Schreibtisch"`) → „Über diesen Schreibtisch …“ → `windows.open({kind:'about'}, {w:320,h:200}, vp)`. AboutView zeigt `site.titel` und den Satz „Eine Hommage an den Mac von 1991. Gebaut mit Svelte.“
- **Ablage** → „Öffnen“ (deaktiviert ohne Auswahl, öffnet die Auswahl) und „Fenster schließen“ (deaktiviert ohne offenes Fenster).
- **Spezial** → „Papierkorb entleeren …“ (deaktiviert, wenn `!isTrashFull`; öffnet `ConfirmDialog`. Bei „Entleeren“ wird `windows.closeForItems(itemsInTrash)` aufgerufen, danach `desk.emptyTrash()`) und „Schreibtisch aufräumen“ (`windows.closeAll()`, dann `desk.cleanUp()`, ohne Rückfrage).
- Rechts steht die `Clock`, die alle 30 s aktualisiert wird.
- **Bedienung:**
  - Ein Klick öffnet ein Menü. Ist bereits eines offen, wechselt das Überfahren eines anderen Menütitels dorthin.
  - Ein Klick außerhalb schließt das Menü.
  - Tastatur:
    - `Enter` oder `ArrowDown` auf einem Menütitel öffnet das Menü und fokussiert den ersten aktiven Eintrag.
    - Im Menü bewegt sich `ArrowDown`/`ArrowUp` durch die Einträge, mit Umlauf, und überspringt deaktivierte.
    - `ArrowLeft`/`ArrowRight` wechselt das Menü.
    - `Enter` führt den Eintrag aus.
    - `Escape` schließt das Menü und gibt den Fokus an den Titel zurück.
  - Rollen: `menubar`, `menu` und `menuitem` mit `aria-disabled`.
- Die Menüleiste hat 22 px Höhe (`MENU_BAR_H`), `--menubar-bg` und blur, Schrift `--font-ui`, fett.
- **ConfirmDialog:**
  - `role="alertdialog"` mit dem Text „Möchtest du den Papierkorb wirklich entleeren?“.
  - Buttons „Abbrechen“ und „Entleeren“, wobei „Entleeren“ der Standard-Button mit Fokus ist und den dicken System-7-Rahmen hat.
  - Escape bricht ab.
  - Das Aussehen entspricht einem Fenster ohne Titelleiste, mit Milchglas.

- [ ] **Step 1: Failing tests:**
  - `formatClock(new Date(2026,0,1,9,5))` → `'09:05'`.
  - „Öffnen“ ist `aria-disabled="true"` ohne Auswahl. Nach einem Klick auf „Über mich“ ist es aktiv, und ein Klick darauf öffnet den Dialog „Über mich“.
  - „Papierkorb entleeren …“ ist deaktiviert, solange der Papierkorb leer ist.
  - Liegt etwas im Papierkorb (per Store-Aufruf vorbereitet), öffnet ein Klick die Rückfrage. „Abbrechen“ → der Papierkorb ist immer noch voll. „Entleeren“ → `aria-label` des Papierkorbs ist „Papierkorb“.
  - „Schreibtisch aufräumen“ nach `moveToTrash('Über mich.md')` → das Icon „Über mich“ ist wieder auf dem Schreibtisch.
  - Tastatur: „Spezial“ fokussieren, dann `Enter` → der Fokus liegt auf „Schreibtisch aufräumen“, weil „Papierkorb entleeren …“ bei leerem Papierkorb deaktiviert ist und übersprungen wird. `Escape` → das Menü ist zu, und der Fokus liegt auf „Spezial“.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: Menüleiste mit Ablage, Spezial und Rückfrage`

---

### Task 10: Handy-Darstellung

**Files:**
- Create: `src/lib/ui/mobile/MobileDesk.svelte`, `src/lib/ui/mobile/MobileSheet.svelte`, `e2e/touch.ts`, `e2e/mobile.spec.ts`
- Modify: `src/App.svelte` (bei `viewport.compact` → `MobileDesk` statt `Desktop`), `FolderView.svelte`/`TrashView.svelte` (Prop `onDragStart`, um das Sheet abzusenken)
- Test: `tests/ui/mobile.test.ts`

**Interfaces:**
- Consumes: Kontexte aus Task 8, `windows.stack`, `openMobile`, `closeMobile`, `moveInGrid`, `itemsOnDesk`, `draggable`
- Produces: keine neuen Schnittstellen

Verhalten nach Spec Abschnitt 6:
- **Raster:**
  - CSS-Grid mit 3 Spalten und Zeilenabstand 18 px. Es beginnt unter der Menüleiste und ist scrollbar, wenn es voll ist.
  - Jede Zelle ist ein Drop-Ziel mit `data-drop="desk" data-grid-index`.
  - Ein Drop auf eine Zelle → `desk.moveToDesk(id, { gridIndex })`. Liegt das Element schon auf dem Schreibtisch, ist das eine Umsortierung über `moveInGrid`.
  - Der Papierkorb liegt fix unten rechts.
  - Antippen (`onTap`) → `windows.openMobile(content, kind !== 'folder')`.
- **Sheet:**
  - Für das oberste Element in `stack` wird ein `MobileSheet` gerendert: `position:fixed`, links, rechts und unten 6 px Abstand, oben unter der Menüleiste, Radius 14 px, Milchglas.
  - Es hat einen Griff oben, Nadelstreifen-Titelleiste und Schließfeld und zoomt aus dem Icon (`zoom`).
  - Bei zwei Stapel-Ebenen liegt das zweite Sheet über dem ersten.
  - Schließen: über das Schließfeld oder per Wisch nach unten. Der Wisch startet am Griff bzw. an der Titelleiste und muss über 80 px gehen. Danach folgt `closeMobile()`.
  - Hinter dem Sheet liegt eine Abdunkelung mit `rgba(0,0,0,.15)`.
- **Aus einem Ordner oder dem Papierkorb herausholen:**
  - Beginnt in der FolderView/TrashView eines Sheets ein Ziehen (`onDragStart`), gleitet das Sheet über 200 ms um `translateY(85%)` nach unten.
  - Die Abdunkelung verschwindet dabei, sodass das Raster als Ziel frei wird.
  - Nach dem Drop oder bei Abbruch gleitet es zurück.
  - Wurde das gezogene Element aus dem Ordner entfernt, bleibt der Ordner offen und zeigt den neuen Inhalt.
- **Wechsel der Darstellung:** Wechselt `viewport.compact`, wird `windows.closeAll()` aufgerufen und der Stapel geleert, damit keine Fenster in der falschen Darstellung hängen bleiben.

- [ ] **Step 1: Failing component tests** (jsdom `innerWidth = 390` + `resize`-Event vor `render`):
  - Die Icons liegen in einem Element mit `data-testid="mobile-grid"`.
  - Ein Tippen auf „Projekte“ (`click`) öffnet einen Dialog „Projekte“. Ein Tippen auf „App“ darin öffnet den Dialog „App“ darüber. „Schließen“ → der Dialog „Projekte“ ist wieder sichtbar und „App“ ist weg.
  - Ein Tippen auf ein Dokument, während ein Dokument offen ist, ersetzt es.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren. **Step 4:** PASS.
- [ ] **Step 5: E2E-Hilfe** `e2e/touch.ts`: `touchDrag(page, from: Point, to: Point, holdMs = 450)` sendet über `page.evaluate` `PointerEvent`s mit `pointerType:'touch'`, `isPrimary:true` und `pointerId:1` (`pointerdown`, Warten, `pointermove` in 10 Schritten, `pointerup`) an `document.elementFromPoint`. Dazu kommt `touchSwipe(page, from, to)` ohne Halten.
- [ ] **Step 6: E2E** `e2e/mobile.spec.ts` (Projekt mobile):
  - `touchDrag` von „Kontakt“ auf den Papierkorb → der Papierkorb ist voll.
  - **Review Focus 4:** `touchSwipe` über „Über mich“ nach oben → kein Icon hat sich verschoben, die Reihenfolge im Raster ist unverändert, und der Papierkorb ist leer.
  - „Projekte“ antippen, dann `touchDrag` von „Erstes Projekt“ im Sheet auf eine Rasterzelle → das Sheet ist danach noch offen, und „Erstes Projekt“ ist nicht mehr darin. Nach dem Schließen liegt „Erstes Projekt“ im Raster.
- [ ] **Step 7:** `npm run e2e` (beide Projekte) → PASS.
- [ ] **Step 8: Commit** `feat: Handy-Darstellung mit Raster und Sheets`

---

### Task 11: Startbildschirm und Bewegung

**Files:**
- Create: `src/lib/ui/Splash.svelte`
- Modify: `src/App.svelte`, `src/lib/ui/theme.css`
- Test: `tests/ui/splash.test.ts`

**Interfaces:**
- Produces: `SPLASH_KEY = 'schreibtisch:splash'` (in `sessionStorage`), `SPLASH_MS = 1200`

- **Inhalt:** Vollflächig `--wallpaper`. In der Mitte ein eigenes „glücklicher Computer“-Symbol als SVG: ein kompakter Rechner mit lächelndem Bildschirm, keine Apple-Grafik. Darunter `site.titel`, das langsam einblendet.
- **Ablauf:** Nach `SPLASH_MS` blendet der Startbildschirm über 200 ms aus. Ein Klick oder eine Taste schließt ihn sofort.
- **Nur einmal pro Sitzung:** Ist `SPLASH_KEY` gesetzt, erscheint er nicht. Ein Fehler beim Zugriff auf `sessionStorage` bedeutet: kein Startbildschirm.
- **Weniger Bewegung:** Bei `prefers-reduced-motion` gibt es keine Animationen, und die Dauer ist 600 ms.
- **Global in `theme.css`:** `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; } }`.

- [ ] **Step 1: Failing tests:**
  - Bei leerem `sessionStorage` ist der Startbildschirm (`data-testid="splash"`) sichtbar. Nach `vi.advanceTimersByTime(1400)` ist er weg, und `SPLASH_KEY` ist gesetzt.
  - Ist `SPLASH_KEY` schon gesetzt, erscheint er nicht.
  - Ein Klick schließt ihn sofort.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren. **Step 4:** PASS. Die E2E-Tests müssen weiter grün sein: In `playwright.config.ts` wird `sessionStorage` per `addInitScript` vorbelegt, damit der Startbildschirm die Tests nicht blockiert.
- [ ] **Step 5: Commit** `feat: Startbildschirm und reduzierte Bewegung`

---

### Task 12: Veröffentlichen und Anleitung

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`
- Modify: `vite.config.ts` (`base: process.env.BASE_PATH ?? '/'`), `index.html` (`<title>` aus `inhalt/seite.json` ist nicht nötig. Er bleibt statisch „Mein Schreibtisch“, und der README erklärt, wo man ihn ändert.)

**Interfaces:** keine

- **Workflow:**
  - Er läuft bei Push auf `main` und bei `workflow_dispatch`, mit den Berechtigungen `pages: write`, `id-token: write`, `contents: read`.
  - Schritte: `actions/checkout`, `actions/setup-node` (Node 22, Cache npm), `npm ci`, `npm test`, `npm run build` mit `BASE_PATH: /${{ github.event.repository.name }}/`, `actions/configure-pages`, `actions/upload-pages-artifact` (`path: dist`), `actions/deploy-pages`.
  - Im README steht ein Hinweis: Bei Repo-Name `<user>.github.io` oder eigener Domain muss `BASE_PATH` `/` sein.
- **README (Deutsch):**
  - Was das Projekt ist.
  - „Inhalte pflegen“: Dateitypen, Ordner gleich Ordner auf dem Schreibtisch, nur eine Ebene, `title:`-Frontmatter, `schreibtisch.json` mit Referenzgröße und Positionen, `seite.json`.
  - Ein Hinweis, dass sich durch Umbenennen oder Verschieben einer Datei ihre ID ändert. Wiederkehrende Besucher sehen sie dann an der Ausgangsposition.
  - „Entwickeln“: `npm run dev`, `npm test`, `npm run e2e`.
  - „Veröffentlichen“: GitHub Pages in den Repo-Einstellungen auf „GitHub Actions“ stellen.

- [ ] **Step 1:** `BASE_PATH=/system7-desktop/ npm run build`, dann `npx vite preview --base /system7-desktop/ --port 5181` und `curl -s localhost:5181/system7-desktop/ | grep -c '<main\|id="app"'`. Erwartet: ≥ 1, und die Assets laden unter `/system7-desktop/assets/` (im Browser prüfen: keine 404 in der Netzwerkansicht).
- [ ] **Step 2:** Workflow und README schreiben. `npx --yes action-validator .github/workflows/deploy.yml` (oder eine YAML-Syntaxprüfung) → ohne Fehler.
- [ ] **Step 3:** Abschlussprüfung: `npm test`, `npm run e2e` und `npm run build` sind grün. **Manuell auf einem echten Handy** (per `npm run dev -- --host` im WLAN):
  - Langes Drücken zieht.
  - Wischen scrollt.
  - Das Sheet gleitet beim Herausziehen weg.
  - Ein Wisch nach unten schließt.
- [ ] **Step 4: Commit** `chore: Veröffentlichung über GitHub Pages und Anleitung`
