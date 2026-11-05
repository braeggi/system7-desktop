# Mein Schreibtisch

Eine persönliche Webseite, die wie ein Schreibtisch des klassischen Mac-Betriebssystems System 6 aussieht. Sie ist in reinem Schwarz-Weiß und pixelgenau gebaut. Die einzige Farbe ist die Fenster-Ampel, die beim Drüberfahren rot, gelb und grün wird.

Besucher können:
- Dokumente und Ordner öffnen
- alles frei auf dem Schreibtisch verschieben
- Dokumente in Ordner legen
- Dinge in den Papierkorb werfen

Die Einrichtung jedes Besuchers bleibt in seinem Browser gespeichert (`localStorage`). Unter **Spezial → Schreibtisch aufräumen** kommt alles wieder an seinen ursprünglichen Platz.

Auf dem Handy (Breite unter 700 px) liegen die Icons in einem Raster:
- Antippen öffnet.
- Gedrückt halten hebt ein Icon an, danach lässt es sich verschieben.

Gebaut mit Svelte 5, Vite und TypeScript. Die fertige Seite ist rein statisch, ohne Server, Tracking oder Cookies.

## Inhalte pflegen

Alle Inhalte liegen im Ordner `inhalt/`.

| Datei | Wird auf dem Schreibtisch zu … |
| --- | --- |
| `*.md` | einem Textdokument (Markdown) |
| `*.jpg`, `*.jpeg`, `*.png`, `*.webp`, `*.gif`, `*.svg` (auch großgeschrieben, z. B. `.JPG`) | einem Bilddokument |
| ein Unterordner | einem Ordner mit den Dokumenten darin |
| `*.gaestebuch` (leere Datei) | dem gemeinsamen Gästebuch, nur mit Supabase-Zugangsdaten (siehe [Gästebuch](#gästebuch)) |

- **Titel:** Der Titel eines Textdokuments kommt aus dem Frontmatter, sonst aus dem Dateinamen:
  ```markdown
  ---
  title: Über mich
  ---
  # Hallo!
  ```
- **Ordner haben nur eine Ebene.** Dateien in tieferen Unterordnern erscheinen im obersten Ordner.
- **Links** auf externe Seiten (`https://…`) öffnen sich in einem neuen Tab.
- **Bilder im Text** bettest du mit einem Pfad relativ zum Dokument ein, zum Beispiel in `inhalt/Projekte/Zweites Projekt.md`: `![Beschreibung](../Fotos/Berg.svg)`. Das Bild muss im Ordner `inhalt/` liegen. Es erscheint dann zusätzlich als eigenes Bilddokument. Bilder von anderen Webseiten (`https://…`) funktionieren ebenfalls.
- **Bilddokumente** bauen sich beim Öffnen wie über ein altes Modem auf: in unregelmäßigen Streifen von oben nach unten, insgesamt etwa drei Sekunden. Wer im System „Bewegung reduzieren“ eingestellt hat, sieht das Bild sofort. Bilder im Text erscheinen immer sofort.
- **Startpositionen:** `inhalt/schreibtisch.json` legt fest, wo die Icons beim ersten Besuch liegen. Die Positionen sind Pixel bezogen auf die `referenz`-Bildschirmgröße. Auf kleineren Bildschirmen werden sie verkleinert. Elemente ohne Eintrag bekommen automatisch einen freien Platz am rechten Rand.
- **Seite:** `inhalt/seite.json` enthält den Titel, den der Startbildschirm und das Info-Fenster anzeigen, und das Monogramm in der Menüleiste (1–2 Buchstaben). Den Titel im Browser-Tab änderst du in `index.html`.

> **Hinweis:** Jedes Dokument wird über seinen Pfad erkannt. Wenn du eine Datei umbenennst oder in einen anderen Ordner verschiebst, ist sie für wiederkehrende Besucher ein neues Dokument und erscheint an ihrer Startposition. Gelöschte Dateien verschwinden auch aus gespeicherten Einrichtungen.

## Entwickeln

```bash
npm install
npm run dev       # Entwicklungsserver
npm test          # Unit- und Komponententests (Vitest)
npm run e2e       # Browser-Tests (Playwright, vorher einmal: npx playwright install chromium webkit)
npm run build     # fertige Seite in dist/
```

Zum Testen auf dem eigenen Handy im selben WLAN:

```bash
npm run dev -- --host
```

## Veröffentlichen

Die Seite wird über GitHub Pages veröffentlicht. Der Workflow `.github/workflows/deploy.yml` testet und baut bei jedem Push auf `main` und stellt die Seite dann online.

1. Repository auf GitHub anlegen und den Code pushen.
2. In den Repository-Einstellungen unter **Pages** als Quelle **GitHub Actions** wählen.
3. Die Seite erscheint unter `https://<benutzer>.github.io/<repository>/`.

Heißt das Repository `<benutzer>.github.io` oder nutzt du eine eigene Domain, setze im Workflow `BASE_PATH: /`.

## Gästebuch

Auf dem Schreibtisch kann ein Gästebuch liegen: ein einziges Textdokument, in das jeder Besucher frei schreiben kann. Alle sehen denselben Text, und wer es gleichzeitig offen hat, sieht Änderungen der anderen live. Gespeichert wird bei [Supabase](https://supabase.com), einer Datenbank als Dienst. Der kostenlose Tarif reicht.

Das Gästebuch erscheint nur, wenn die Datei `inhalt/Gästebuch.gaestebuch` existiert **und** die Supabase-Zugangsdaten beim Bauen vorhanden sind. Ohne Zugangsdaten läuft die Seite ganz normal, nur ohne Gästebuch. Den Namen des Icons bestimmt der Dateiname, die Startposition steht wie bei allen anderen in `inhalt/schreibtisch.json`.

### Einrichten

1. **Projekt anlegen:** Auf supabase.com ein Konto und ein neues Projekt anlegen. Als Region eine in der EU wählen, zum Beispiel Frankfurt.
2. **Datenbank einrichten:** Im Projekt den **SQL Editor** öffnen, den Inhalt von `supabase/gaestebuch.sql` einfügen und ausführen. Das Skript legt die Tabellen, die Versionsprüfung, die Sicherung früherer Fassungen, den nächtlichen Aufräum-Job und die Zugriffsrechte an. Mehrfaches Ausführen schadet nicht. Meldet es einen Fehler bei `pg_cron`, unter **Integrations → Cron** die Erweiterung aktivieren und das Skript erneut ausführen.
3. **Zugangsdaten eintragen:** Gebraucht werden die **Project URL** (oben auf der Projektseite unter **Connect** oder in den Projekteinstellungen unter **Data API**) und der öffentliche Schlüssel: bei neuen Projekten der **Publishable key** (`sb_publishable_…`) unter **Project Settings → API Keys**, bei älteren der **anon public** Schlüssel. Nie den **Secret key** oder **service_role** nehmen. Beide Werte sind dafür gedacht, im Browser zu stehen; geschützt wird das Gästebuch durch die Zugriffsrechte aus dem Skript.
   - Lokal: `.env.example` nach `.env.local` kopieren und die Werte eintragen. Die Datei kommt nicht ins Repository. Danach den Dev-Server neu starten.
   - Für GitHub Pages: im Repository unter **Settings → Secrets and variables → Actions → Variables** die Variablen `SUPABASE_URL` und `SUPABASE_ANON_KEY` anlegen und die Seite neu veröffentlichen.
4. **Live-Übertragung prüfen:** Das Gästebuch nutzt einen öffentlichen Realtime-Kanal. Unter **Project Settings → Realtime** muss der öffentliche Zugriff erlaubt sein. Ist er abgeschaltet, zeigt das Gästebuch dauerhaft „Keine Verbindung“ und lässt sich nicht bearbeiten.

### Eine frühere Fassung wiederherstellen

Die Datenbank sichert höchstens einmal pro Minute den Stand vor einer Änderung in der Tabelle `gaestebuch_fassungen`. Sie behält alle Fassungen der letzten 24 Stunden, eine pro Stunde für 30 Tage und eine pro Tag für immer.

1. Im **Table Editor** die Tabelle `gaestebuch_fassungen` öffnen und die passende Fassung anhand von `erstellt` suchen. Ihre `id` merken.
2. Im **SQL Editor** ausführen, mit der gemerkten `id`:
   ```sql
   update gaestebuch set text = (select text from gaestebuch_fassungen where id = 123) where id = 1;
   ```
3. Alle offenen Gästebuch-Fenster zeigen die wiederhergestellte Fassung sofort.

Einzelne unpassende Stellen entfernst du, indem du in der Tabelle `gaestebuch` den Text direkt bearbeitest.

### Wach halten

Supabase legt kostenlose Projekte nach etwa einer Woche ohne Zugriffe schlafen. Dann zeigt das Gästebuch „Keine Verbindung“. Der Workflow `.github/workflows/wach-halten.yml` fragt Supabase deshalb alle drei Tage kurz an. Er nutzt dieselben beiden Variablen und macht nichts, wenn sie fehlen.

- **Schläft das Projekt trotzdem:** Im Supabase-Dashboard das Projekt öffnen und **Restore project** wählen. Nach ein paar Minuten läuft das Gästebuch wieder.
- **GitHub schaltet geplante Workflows ab**, wenn es 60 Tage lang keine Aktivität im Repository gab. GitHub schickt dazu vorher eine E-Mail. Unter **Actions → Gästebuch wach halten** lässt sich der Workflow mit **Enable workflow** wieder einschalten. Dort kannst du ihn auch jederzeit von Hand starten.

### Datenschutz

Die Seite speichert nur, was Besucher selbst ins Gästebuch schreiben. Erst wenn jemand das Gästebuch öffnet, verbindet sich der Browser mit Supabase; dabei verarbeitet Supabase technisch bedingt die IP-Adresse. Erwähne Supabase deshalb in deiner Datenschutzerklärung. Das ist keine Rechtsberatung.

### Abschalten

Datei `inhalt/Gästebuch.gaestebuch` löschen und die Seite neu veröffentlichen. Die Einträge bleiben in Supabase erhalten.

## Schrift

Menüs, Fenstertitel, Icon-Beschriftungen und Überschriften nutzen **ChicagoFLF**, eine Nachbildung der Mac-Schrift Chicago. Sie ist Public Domain (siehe `src/assets/fonts/README.ChicagoFLF.txt`) und liegt im Projekt selbst, damit beim Laden keine Anfrage an Google oder andere fremde Server geht. Lesetexte in Dokumenten bleiben in `Geneva` bzw. der Systemschrift.

Die Datei `src/assets/fonts/ChicagoFLF.woff` ist auf lateinische Zeichen reduziert (10 KB). Das Euro-Zeichen fehlt in der Schrift, es erscheint in der Ersatzschrift.

Chicago ist auf 12 px gezeichnet. Scharf bleibt sie nur in 12 px oder Vielfachen davon (24 px, 36 px). Andere Größen wirken verwaschen.
