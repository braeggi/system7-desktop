# hello world.txt beim Start – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statt des Startbildschirms öffnet sich beim Laden das Textdokument „hello world.txt“, an dessen Ende ein Smiley mit blinkendem Cursor steht.

**Architecture:** Ein normales Markdown-Dokument in `inhalt/`. Der Frontmatter-Schalter `cursor: true` wird über den Katalog bis ins Textfenster gereicht. `seite.json` nennt mit `start` das Dokument, das `App.svelte` beim Mounten über `actions.open` öffnet. Der Splash wird ersatzlos entfernt.

**Tech Stack:** Svelte 5 (Runes), TypeScript, Vite, Vitest + Testing Library (jsdom), Playwright, marked.

**Spec:** `docs/superpowers/specs/2026-11-16-hello-world-design.md`

## Global Constraints

- Schrift im Fenster: Geneva wie alle Textfenster (`--font-text`), keine neue Schrift.
- Fensterform unverändert: Ampel, Größenfeld, normale Startposition (`windows.open`-Kaskade oben links).
- Smiley: eigene 16 × 16-Pixelgrafik in Schwarz-Weiß. Rechtsbündig am Textende, Cursor direkt rechts daneben.
- Cursor: schwarzer Strich in Zeilenhöhe, etwa 0,5 s an und 0,5 s aus. Bei `prefers-reduced-motion: reduce` steht er still und sichtbar.
- Smiley und Cursor tragen `aria-hidden="true"`.
- Öffnen bei jedem Seitenaufruf, auf dem Computer und auf dem Handy. Nicht öffnen, wenn `start` fehlt, das Dokument unbekannt ist oder im Papierkorb bzw. endgültig gelöscht ist.
- Inhalt: nur Platzhalter, keine Angaben aus dem Vorbild (Monika Michalczyk, Framer, ihre Links).
- Kommentare und Testnamen auf Deutsch, wie im übrigen Projekt.

## Review Focus

- Das Startdokument liegt in einem Ordner. Es soll sich trotzdem öffnen, denn der Ort `folder` gilt nicht als gelöscht. Der Test steht in Task 3.
- Ein Wechsel zwischen Computer- und Handy-Darstellung schließt alle Fenster (`App.svelte`). Das Startfenster darf danach nicht erneut aufgehen, es öffnet sich nur einmal beim Mounten. Der Test steht in Task 3.
- `cursor: false` oder ein fehlender Eintrag darf kein Smiley zeigen. Der Test steht in Task 1 und Task 2.
- Escape schließt das Startfenster wie jedes andere Fenster. Dafür ist kein neuer Code nötig, die Browsertests in Task 5 decken es über den Helfer ab.
- Mit dem offenen Startfenster dürfen bestehende Browsertests nicht brechen, etwa das Auswahlrechteck bei (300, 300). Darum kümmert sich Task 5.

---

### Task 1: Frontmatter-Schalter `cursor` bis in den Katalog

**Files:**
- Modify: `src/lib/content/frontmatter.ts`, `src/lib/content/catalog.ts`, `src/lib/content/types.ts`
- Test: `tests/content/frontmatter.test.ts`, `tests/content/catalog.test.ts`

**Interfaces:**
- Produces: `parseFrontmatter(raw): { title?: string; cursor?: boolean; body: string }`. `cursor` ist `true` genau bei `cursor: true`, sonst fehlt das Feld.
- Produces: `CatalogItem.cursor?: boolean`, wird bei Textdokumenten gesetzt, wenn das Frontmatter es nennt.

- [ ] **Step 1: Write the failing tests**

```ts
// frontmatter.test.ts
it('liest den Schalter cursor', () => {
  expect(parseFrontmatter('---\ntitle: a\ncursor: true\n---\nText').cursor).toBe(true)
  expect(parseFrontmatter('---\ncursor: false\n---\nText').cursor).toBeUndefined()
  expect(parseFrontmatter('---\ntitle: a\n---\nText').cursor).toBeUndefined()
})
// catalog.test.ts (gleicher Aufbau wie der Frontmatter-Titel-Test)
it('übernimmt den Schalter cursor aus dem Frontmatter', () => {
  // ein .md mit "cursor: true" → items[id].cursor === true; eines ohne → undefined
})
```

- [ ] **Step 2: Run** `npx vitest run tests/content` → FAIL (cursor undefined).
- [ ] **Step 3: Implement** the parsing in `parseFrontmatter`, the `cursor?: boolean` field on `CatalogItem` and passing it on in `buildCatalog`. Set it only when true: `...(cursor ? { cursor } : {})`.
- [ ] **Step 4: Run** `npx vitest run tests/content` → PASS.

### Task 2: Smiley und blinkender Cursor im Textfenster

**Files:**
- Modify: `src/lib/ui/TextViewer.svelte`, `src/lib/ui/WindowContent.svelte`
- Test: `tests/ui/textviewer.test.ts` (neu)

**Interfaces:**
- Consumes: `CatalogItem.cursor` (Task 1).
- Produces: `TextViewer` props `{ html: string; cursor?: boolean }`. `WindowContent` gibt `item.cursor` weiter.

- [ ] **Step 1: Write the failing tests** (render `TextViewer` directly)

```ts
it('zeigt am Ende Smiley und Cursor, wenn cursor gesetzt ist', () => {
  render(TextViewer, { props: { html: '<p>Hallo</p>', cursor: true } })
  const end = screen.getByTestId('textende')
  expect(end).toHaveAttribute('aria-hidden', 'true')
  expect(end.querySelector('svg')).not.toBeNull()
  expect(end.querySelector('.caret')).not.toBeNull()
})
it('zeigt ohne cursor nichts davon', () => {
  render(TextViewer, { props: { html: '<p>Hallo</p>' } })
  expect(screen.queryByTestId('textende')).toBeNull()
})
```

- [ ] **Step 2: Run** `npx vitest run tests/ui/textviewer.test.ts` → FAIL.
- [ ] **Step 3: Implement** the end of the text in `TextViewer`.
  - Under the article, a `<div class="ending" data-testid="textende" aria-hidden="true">` holds:
    - an inline SVG smiley (`viewBox="0 0 16 16"`, black, crisp like `Splash.svelte`'s computer),
    - a `<span class="caret">`: 1 px wide, line height, black.
  - The div is right-aligned.
  - Blinking via `@keyframes` with `steps(1)`, 1.06 s infinite.
  - `@media (prefers-reduced-motion: reduce) { .caret { animation: none; } }`.
  - `WindowContent` passes `cursor={item.cursor}`.
- [ ] **Step 4: Run** `npx vitest run tests/ui` → PASS.

### Task 3: Startdokument beim Laden öffnen

**Files:**
- Modify: `src/lib/content/types.ts` (`SiteConfig.start?: string`), `src/lib/state/desk.ts`, `src/App.svelte`
- Test: `tests/state/start.test.ts` (neu), `tests/app.test.ts`

**Interfaces:**
- Produces: `startDocument(s: DeskState, c: Catalog, start: string | undefined): ItemId | null` in `src/lib/state/desk.ts`. Gibt `start` zurück, wenn es ein Element im Katalog ist und sein Ort `desk` oder `folder` ist, sonst `null`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/state/start.test.ts, mit fixtureCatalog und initialState
startDocument(s, c, undefined) === null
startDocument(s, c, 'Gibt es nicht.md') === null
startDocument(s, c, 'Über mich.md') === 'Über mich.md'
startDocument(s, c, 'Projekte/App.md') === 'Projekte/App.md'      // im Ordner
// Ort { in: 'trash' } und { in: 'gone' } → null
// tests/app.test.ts
it('öffnet beim Laden das Startdokument', async () => {
  render(App, { props: { catalog: fixtureCatalog, storage: null, site: { titel: 'T', monogramm: 'T', start: 'Über mich.md' } } })
  expect(await screen.findByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
})
it('öffnet ohne start kein Fenster', () => { /* queryByRole('dialog') ist null */ })
```

- [ ] **Step 2: Run** `npx vitest run tests/state/start.test.ts tests/app.test.ts` → FAIL.
- [ ] **Step 3: Implement**
  - `startDocument` as described.
  - In `App.svelte`, open the result once via `actions.open({ kind: 'item', id })` with `onMount`, without an `$effect`, so the window does not open again after a layout change.
- [ ] **Step 4: Run** `npx vitest run` → PASS (whole suite).

### Task 4: Startbildschirm entfernen

**Files:**
- Delete: `src/lib/ui/Splash.svelte`, `src/lib/ui/splash.ts`, `tests/ui/splash.test.ts`
- Modify: `src/App.svelte` (import and `<Splash>`), `tests/ui/guestbook.test.ts:34` (remove the stale `sessionStorage` line), `README.md:42` (no more mention of the splash; the title is shown only in the info window)

- [ ] **Step 1: Delete and modify** as listed. Check `grep -rn "splash\|Splash" src tests README.md`: no hits left (except the comment in `Splash.svelte`, which no longer exists).
- [ ] **Step 2: Run** `npm run check && npx vitest run` → 0 errors, all green.

### Task 5: Inhalt, Konfiguration, Browsertests, README

**Files:**
- Create: `inhalt/hello world.md`
- Modify: `inhalt/seite.json` (`"start": "hello world.md"`), `inhalt/schreibtisch.json` (`"hello world.md": { "x": 1320, "y": 664 }`), `e2e/helpers.ts`, `e2e/desktop.spec.ts`, `e2e/mobile.spec.ts`, `README.md`

- [ ] **Step 1: Write the document.**
  - Frontmatter: `title: hello world.txt`, `cursor: true`.
  - Body with placeholders. Lines without a blank line between them get a backslash at the end of the line as a hard line break.

```md
✳ Dein Name

Ein Satz dazu, was du machst und wo.\
Noch ein Satz, zum Beispiel wo du gerade arbeitest.

○ [ein Projekt](https://example.com)

→ [E-Mail](mailto:name@example.com)\
→ [Twitter](https://twitter.com)\
→ [LinkedIn](https://www.linkedin.com)
```

- [ ] **Step 2: Browser tests**
  - Replace `skipSplash` with `closeGreeting(page)`:
    - wait for the window or card named „hello world.txt“,
    - close it with Escape,
    - wait until it is gone.
  - In both `beforeEach`: `page.goto('/')`, then `closeGreeting`.
  - Add to `desktop.spec.ts`: „beim Laden öffnet sich hello world.txt mit Smiley und Cursor“. Load the page without `closeGreeting`, then expect the dialog „hello world.txt“ and inside it `getByTestId('textende')`.
- [ ] **Step 3: README**
  - Under „Inhalte pflegen“, document `start` in `seite.json` and the `cursor: true` switch in the frontmatter.
- [ ] **Step 4: Run** `npm run check && npx vitest run && npx playwright test && npm run build` → everything green.
- [ ] **Step 5: Look at it.** Load the page at 1440 × 900 and check that the window shows smiley and cursor and that the cursor blinks.
