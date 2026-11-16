# hello world.txt beim Start – Design

## Absicht

Wer die Seite öffnet, soll sofort begrüßt werden: Statt des Startbildschirms öffnet sich von selbst ein Textfenster „hello world.txt“ mit einer kurzen Vorstellung. Vorbild ist ein Fenster auf der Seite von Monika Michalczyk; übernommen wird nur der Aufbau, nicht ihr Inhalt.

## Ziele

- Der Startbildschirm (Splash) fällt ganz weg.
- Beim Laden öffnet sich ein Textdokument aus `inhalt/` automatisch, auf dem Computer und auf dem Handy.
- Der Text folgt dem Aufbau des Vorbilds:
  - ✳ Name
  - zwei Zeilen, wer man ist
  - ○ ein Link
  - → E-Mail, → Twitter, → LinkedIn als untereinanderstehende Links
- Am Ende steht ein kleines Smiley, direkt daneben blinkt ein Textcursor.

## Nicht-Ziele

- Keine eigene Schrift: Es bleibt Geneva wie in allen Textfenstern.
- Kein neues Fensteraussehen: Es bleibt die Fensterform des Projekts, mit Ampel und Größenfeld.
- Der Text tippt sich nicht selbst, und der Mauszeiger ändert sich nicht.

## Anti-Ziele

- Fremde Angaben (Name, Arbeitgeber, Links aus dem Vorbild) dürfen nicht auf die Seite.

## Ansätze

- **A: Normales Markdown-Dokument in `inhalt/`, gewählt.**
  - `seite.json` nennt das Startdokument.
  - Ein Eintrag im Kopf der Datei schaltet Smiley und Cursor ein.
  - Pflege wie bei allen anderen Inhalten, mit eigenem Icon zum Wiederöffnen.
  - Nachteil: ein Icon mehr auf dem Schreibtisch.
- **B: Fest eingebautes Begrüßungsfenster wie das Info-Fenster.**
  - Es braucht kein Icon.
  - Nachteil: Jede Textänderung muss im Code gemacht werden, und das Fenster lässt sich nicht wieder öffnen.
- Gewählt wurde A, weil alle Inhalte so gepflegt werden und der Text ohne Code änderbar bleibt.

## Festgelegt

- **Dokument:** `inhalt/hello world.md` mit diesem Kopf:
  ```
  ---
  title: hello world.txt
  cursor: true
  ---
  ```
  - Der Inhalt sind Platzhalter wie in „Über mich“ und „Kontakt“. Echte Angaben trägt der Besitzer selbst ein.
- **Startdokument:** `inhalt/seite.json` bekommt `"start": "hello world.md"`.
  - Fehlt der Eintrag oder gibt es das Dokument nicht, öffnet sich nichts.
  - Liegt das Dokument im Papierkorb oder wurde es endgültig gelöscht, öffnet es sich auch nicht.
- **Öffnen:** Das Fenster öffnet sich bei jedem Seitenaufruf über den normalen Weg (`actions.open`).
  - Auf dem Computer erscheint es als Fenster an der üblichen Startposition oben links.
  - Auf dem Handy erscheint es als Karte.
- **Smiley und Cursor:**
  - Das Smiley ist eine eigene 16 × 16-Pixelgrafik in Schwarz-Weiß. Es steht am Ende des Textes linksbündig, direkt daneben ein schwarzer Strich in Zeilenhöhe als Cursor.
  - Der Cursor blinkt im Takt des alten Mac (etwa eine halbe Sekunde an, eine halbe aus).
  - Bei „Bewegung reduzieren“ steht der Cursor still.
  - Smiley und Cursor sind reine Dekoration und für Screenreader verborgen.
- **Splash entfernen:**
  - Wegfallen: `Splash.svelte`, `splash.ts`, deren Tests und `skipSplash` in den Browsertests.
  - Die README erwähnt den Startbildschirm nicht mehr.
  - Der Titel in `seite.json` bleibt für das Info-Fenster.

## Dem Umsetzenden überlassen

- Wie der Kopf-Eintrag `cursor` gelesen und an das Textfenster weitergegeben wird.
- Wie Zeilen ohne Leerzeile untereinander stehen (Zeilenumbrüche im Markdown).
- Wie die Browsertests mit dem beim Start offenen Fenster umgehen.
