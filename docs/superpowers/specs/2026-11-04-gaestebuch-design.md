# Gästebuch – Design

Stand: 2026-11-04

Ergänzt `2026-11-03-system7-desktop-design.md`. Markierungen wie dort:
- ohne Markierung: vom Seitenbesitzer so entschieden oder bestätigt
- **[Meine Entscheidung]**: im Gespräch nicht besprochen, sinnvoll gesetzt, darf beim Lesen korrigiert werden

## 1. Absicht

Auf dem Schreibtisch liegt ein Gästebuch, wie es persönliche Homepages in den 90ern hatten. Es ist ein einziges gemeinsames Textdokument: Jeder Besucher kann hineinschreiben, und alle sehen denselben Text. Haben mehrere Besucher es gleichzeitig offen, sehen sie die Änderungen der anderen live.

Das ist ein MVP. Es soll schnell zeigen, ob Besucher das Gästebuch nutzen und Spaß daran haben. Eine robustere Fassung folgt später (siehe Abschnitt 8).

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Ein Gästebuch-Icon auf dem Schreibtisch, das sich wie die anderen Icons verhält.
- Ein gemeinsamer Text, den jeder Besucher frei bearbeiten kann, ohne Anmeldung und ohne Freigabe durch den Besitzer.
- Änderungen anderer erscheinen live, solange das Fenster offen ist.
- Der Besitzer kann nach Vandalismus eine frühere Fassung wiederherstellen.

**Nicht-Ziele (für jetzt)**
- Keine Freigabe oder Moderation vor dem Erscheinen. Unpassendes entfernt der Besitzer von Hand.
- Keine saubere Zusammenführung gleichzeitiger Eingaben. Tippen zwei Personen im selben Moment, darf eine die letzten Zeichen der anderen überschreiben. Das ist bewusst in Kauf genommen.
- Keine Anmeldung, keine Namen der Schreibenden, keine Anzeige, wer gerade schreibt.
- Keine Formatierung: reiner Text, keine Links, keine Bilder.
- Kein eigenes Admin-Panel. Der Besitzer verwaltet alles im Supabase-Dashboard.

**Änderung gegenüber dem Haupt-Design:** Dort stehen als Nicht-Ziele „kein Backend, keine Datenbank“ und „Besucher können keine Texte bearbeiten“. Für das Gästebuch gilt beides nicht mehr. Für alles andere auf dem Schreibtisch bleibt es dabei.

**Anti-Ziele** (gescheitert, auch wenn es technisch läuft, falls …)
- … ein einziger Besucher das Gästebuch dauerhaft zerstören kann, ohne dass der Besitzer es zurückholen kann.
- … das Gästebuch den Rest der Seite langsamer oder fehleranfälliger macht. Ist Supabase nicht erreichbar, muss der Schreibtisch normal funktionieren.
- … Eingetipptes beim normalen Gebrauch durch eine einzelne Person verloren geht, etwa beim Schließen des Fensters oder bei kurzem Verbindungsabbruch.
- … es aus dem System-6-Stil fällt.

## 3. Verhalten

### 3.1 Auf dem Schreibtisch

- Neues Icon „Gästebuch“ mit eigenem 16×16-Pixelsymbol, **[Meine Entscheidung]** einem aufgeschlagenen Buch.
- Es lässt sich verschieben, in Ordner legen und in den Papierkorb werfen wie jedes andere Icon. Das betrifft nur die eigene Einrichtung des Besuchers, wie bisher. Der gemeinsame Text bleibt für alle erhalten.
- **[Meine Entscheidung]** Das Icon entsteht wie alle Inhalte aus einer Datei: Eine leere Datei `inhalt/Gästebuch.gaestebuch` legt das Gästebuch an. Ihr Name ist der Titel, ihre Startposition steht wie üblich in `inhalt/schreibtisch.json`. Ohne diese Datei gibt es kein Gästebuch.
- **[Meine Entscheidung]** Fehlen die Supabase-Zugangsdaten beim Build (siehe 4.4), erscheint das Icon gar nicht. So läuft die Seite auch lokal ohne Supabase, und Besucher sehen nie ein nicht eingerichtetes Gästebuch.

### 3.2 Im Fenster

- Doppelklick öffnet ein Fenster wie bei Textdokumenten. Darin steht der gemeinsame Text, und man kann direkt hineinschreiben, wie in einem einfachen Texteditor.
- Schrift wie bei Lesetexten in Dokumenten. Fenster, Titelleiste, Ampel und Rollbalken wie bei allen anderen Fenstern.
- Es gibt keinen Speichern-Knopf. Der Text speichert sich von selbst.
- Unten im Fenster sitzt eine schmale Statuszeile im System-6-Stil. Sie zeigt einen dieser Zustände:
  - „Lädt …“ beim Öffnen
  - „Gespeichert“ wenn alles beim Server ist
  - „Speichert …“ solange Änderungen unterwegs sind
  - „Keine Verbindung“ wenn Supabase nicht erreichbar ist
- **[Meine Entscheidung]** Ohne Verbindung zeigt das Fenster den zuletzt geladenen Text nur zum Lesen. Wer gerade etwas getippt hat und die Verbindung verliert, behält seinen Text im Fenster, und er wird gespeichert, sobald die Verbindung zurück ist. Konnte beim Öffnen gar nichts geladen werden, steht im Fenster ein kurzer Hinweis statt eines leeren Textes.
- **[Meine Entscheidung]** Der Text ist auf 20'000 Zeichen begrenzt. Ist die Grenze erreicht, lässt sich nichts mehr hinzufügen, und die Statuszeile sagt es.
- Kommt eine Änderung von jemand anderem an, während man selbst tippt, ersetzt sie den Text. **[Meine Entscheidung]** Die eigene Schreibmarke bleibt dabei möglichst an derselben Stelle im Text und springt nicht an den Anfang oder das Ende.

### 3.3 Auf dem Handy

Das Gästebuch öffnet sich wie andere Dokumente als Vollbild-Blatt und ist dort genauso bearbeitbar. Die Tastatur darf das Blatt nicht so verschieben, dass man nicht mehr sieht, wo man tippt.

### 3.4 Schreibtisch aufräumen

„Schreibtisch aufräumen“ setzt wie bisher nur die Einrichtung des Besuchers zurück, also auch die Position des Gästebuch-Icons. Den gemeinsamen Text berührt es nicht.

## 4. Technik

### 4.1 Speicherung: Supabase

- Supabase, kostenloser Tarif, Serverstandort in der EU (zum Beispiel Frankfurt). Der Besitzer legt das Konto und das Projekt an.
- **[Meine Entscheidung]** Zwei Tabellen:
  - `gaestebuch`: genau eine Zeile mit dem aktuellen Text und dem Zeitpunkt der letzten Änderung.
  - `gaestebuch_fassungen`: frühere Fassungen des Textes mit Zeitpunkt.
- Eine Datenbank-Regel begrenzt den Text auf 20'000 Zeichen. Die Grenze gilt also auch dann, wenn jemand die Seite umgeht und direkt an Supabase schreibt.
- **[Meine Entscheidung]** Fassungen legt die Datenbank selbst an, per Trigger beim Ändern des aktuellen Textes: höchstens eine neue Fassung pro Minute. Besucher können Fassungen weder lesen noch schreiben noch löschen. So kann auch jemand, der die Seite umgeht, die Sicherungen nicht zerstören.
- **[Meine Entscheidung]** Alte Fassungen werden ausgedünnt, damit die Datenbank nicht vollläuft, auch wenn jemand sie absichtlich füllt. Ein täglicher Aufräum-Job in der Datenbank behält:
  - alle Fassungen der letzten 24 Stunden,
  - eine Fassung pro Stunde für die letzten 30 Tage,
  - eine Fassung pro Tag für immer.
  So bleiben auch nach wochenlangem Vandalismus die guten Fassungen von davor erhalten, und der Speicher bleibt bei wenigen MB.
- **[Meine Entscheidung]** Der aktuelle Text trägt eine Versionsnummer, die bei jeder Änderung steigt, auch bei Änderungen des Besitzers im Dashboard. Ein Speichern gelingt nur, wenn es auf der aktuellen Versionsnummer aufbaut. Damit überschreibt kein veraltetes Fenster eine Wiederherstellung des Besitzers oder Text, der inzwischen dazugekommen ist.
- Zugriffsrechte über Row Level Security: Besucher ohne Anmeldung dürfen den aktuellen Text lesen und ändern, sonst nichts. Insbesondere dürfen sie keine Zeilen anlegen oder löschen.
- Wiederherstellen: Der Besitzer kopiert im Supabase-Dashboard eine frühere Fassung in den aktuellen Text. Die Anleitung dazu steht im README.

### 4.2 Live-Übertragung

- **[Meine Entscheidung]** Die Live-Übertragung läuft über Supabase Realtime. Bei jeder Änderung schickt die Seite den ganzen Text an alle, die das Gästebuch gerade offen haben. Sie tut das gebündelt, nicht bei jedem einzelnen Tastendruck, aber schnell genug, dass es sich live anfühlt (Richtwert: höchstens alle 200 ms).
- Unabhängig davon speichert die Seite den Text in der Datenbank, sobald der Besucher kurz aufhört zu tippen (Richtwert: 1 s Pause), und spätestens beim Schließen des Fensters.
- Wer das Gästebuch öffnet, lädt den aktuellen Text aus der Datenbank und empfängt ab dann die Live-Änderungen.
- **[Meine Entscheidung]** Offene Fenster hören auch auf Änderungen direkt in der Datenbank. Stellt der Besitzer im Dashboard eine Fassung wieder her, sehen alle offenen Fenster sie sofort.
- **[Meine Entscheidung]** Scheitert ein Speichern, weil der Text inzwischen anders ist (siehe Versionsnummer in 4.1), übernimmt das Fenster den aktuellen Text vom Server. Die eigene, nicht gespeicherte Änderung geht dann verloren, und die Statuszeile sagt kurz „Inzwischen geändert, neu geladen“. Das passiert nur, wenn jemand anderes gleichzeitig geändert hat. Wer allein schreibt, verliert nichts.
- **[Meine Entscheidung]** Ungespeicherter Text wird zusätzlich im Browser des Besuchers zwischengespeichert. Schließt er Fenster oder Tab ohne Verbindung oder mitten im Speichern, wird der Text beim nächsten Öffnen des Gästebuchs nachgeschickt. Das gelingt nach derselben Regel nur, wenn der Text auf dem Server seitdem unverändert ist.
- Ein Speichern, das beim Schließen des Fensters schon unterwegs ist, wird nicht abgebrochen.

### 4.3 Verhalten ohne Gästebuch

Die Verbindung zu Supabase wird erst aufgebaut, wenn jemand das Gästebuch öffnet, und beim Schließen wieder getrennt. Der Code für das Gästebuch wird erst dann geladen. Wer das Gästebuch nie öffnet, merkt nichts von Supabase: keine Anfrage, kein zusätzliches Gewicht beim Laden der Seite.

### 4.4 Zugangsdaten

- Die Seite braucht die Projekt-URL und den öffentlichen Schlüssel (anon key) von Supabase. Beide sind dafür gedacht, im Browser zu stehen. Die Sicherheit kommt aus den Zugriffsrechten in 4.1.
- Lokal stehen sie in `.env.local`, die nicht ins Repository kommt. Für GitHub Pages stehen sie als Repository-Variablen in GitHub und werden im Build-Workflow übergeben.
- Fehlen sie, gibt es kein Gästebuch (siehe 3.1). Der Build schlägt deswegen nicht fehl.

### 4.5 Einrichtung durch den Besitzer

Im Repository liegt ein SQL-Skript, das Tabellen, Begrenzung, Trigger und Zugriffsrechte anlegt und Realtime aktiviert. Der Besitzer fügt es einmal im SQL-Editor von Supabase ein. Das README beschreibt Schritt für Schritt:
1. Supabase-Konto und Projekt in einer EU-Region anlegen
2. SQL-Skript ausführen
3. URL und Schlüssel in `.env.local` und in die GitHub-Variablen eintragen
4. eine frühere Fassung wiederherstellen
5. ein schlafendes Projekt von Hand aufwecken, falls der Wach-Job (4.6) einmal ausfällt

### 4.6 Wach halten

Supabase legt kostenlose Projekte nach etwa einer Woche ohne Zugriffe schlafen. Danach wäre das Gästebuch für alle „Keine Verbindung“, bis der Besitzer es von Hand aufweckt.

- Ein geplanter GitHub-Actions-Job fragt Supabase regelmäßig kurz an und hält das Projekt so wach. **[Meine Entscheidung]** Er läuft alle drei Tage und kann zusätzlich von Hand gestartet werden.
- Er liest nur den aktuellen Text, ändert nichts und erzeugt keine neue Fassung.
- Er nutzt dieselbe URL und denselben öffentlichen Schlüssel wie die Seite (4.4).
- Schlägt er fehl, zeigt GitHub das wie bei jedem anderen Workflow an. Eine eigene Benachrichtigung gibt es nicht.
- Fehlen die Zugangsdaten, beendet sich der Job ohne Fehler, genau wie die Seite dann einfach kein Gästebuch zeigt.

## 5. Datenschutz

- Die Seite selbst sammelt nichts. Gespeichert wird nur der Text, den Besucher freiwillig schreiben.
- Supabase verarbeitet beim Öffnen des Gästebuchs technisch bedingt die IP-Adresse der Besucher. Das ist ein Grund, warum die Verbindung erst beim Öffnen entsteht (4.3).
- Das README weist darauf hin, dass der Besitzer Supabase in seiner Datenschutzerklärung erwähnen sollte. Rechtsberatung ist das nicht.

## 6. Tests

Wie im restlichen Projekt: Unit- und Komponententests mit Vitest, Browser-Tests mit Playwright. Die Tests laufen ohne echtes Supabase, gegen einen Ersatz, der Laden, Speichern, Live-Nachrichten und Verbindungsabbruch nachstellt. Abgedeckt sein muss mindestens:
- Laden, Tippen, automatisches Speichern
- eine Live-Änderung von außen kommt an, während man tippt, und die Schreibmarke bleibt an ihrer Stelle
- Verbindungsabbruch und Wiederverbindung, ohne dass eigener Text verloren geht
- Zeichengrenze
- ohne Zugangsdaten kein Icon
- Supabase wird erst beim Öffnen kontaktiert

## 7. Dem Bauenden überlassen

- ob die offizielle Supabase-Bibliothek oder ein schlankerer eigener Zugriff verwendet wird
- die genauen Zeiten für Bündeln und Speichern, solange es sich live anfühlt und nichts verloren geht
- das genaue Pixelsymbol und das Aussehen der Statuszeile, im Stil des Restes
- wie der Ersatz für Supabase in den Tests aussieht

## 8. Später: Yjs

In einem späteren Schritt wird die Live-Übertragung auf Yjs umgestellt. Dann werden gleichzeitige Eingaben sauber zusammengeführt, und nichts geht mehr verloren. Supabase bleibt dabei der Speicher und der Übertragungsweg. Das MVP soll so gebaut sein, dass dieser Wechsel nur die Synchronisierung betrifft, nicht Icon, Fenster oder Statuszeile.
