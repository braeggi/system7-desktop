# Project Resources – Design (kurz)

## Absicht

Eigene Web-Apps sollen auf dem Schreibtisch zu finden sein. Besucher und mögliche Arbeitgeber sollen sehen, was es gibt, und der Besitzer will schnell zur App kommen, etwa am Tichu-Abend. Die Apps öffnen sich im neuen Tab.

## Ziele

- Ein eigenes Fenster „Project Resources“:
  - oben der Titel „Project Resources“ groß,
  - darunter „Various projects to explore.“,
  - dann die Projekte in zwei Spalten, jedes mit Bild, Name und einem Satz.
- Ein Klick auf Bild oder Name öffnet die App im neuen Tab.
- Erste Projekte:
  - links Tichu Score Board (`https://tichu-score-board.vercel.app`),
  - rechts Swiss Temp Dashboard (`https://swiss-temp-dashboard.vercel.app`).

## Nicht-Ziele

- Kein Einbetten der laufenden Apps.
- Keine Technik-Zeile und keine langen Beschreibungen.

## Ansätze

- **Eigene Dateiart `*.projekte` mit eigener Ansicht, gewählt.**
  - Inhalt ist JSON in `inhalt/`, wie beim Gästebuch eine eigene Endung.
  - Ein neues Projekt bedeutet einen Eintrag mehr, ohne Code.
- **Markdown-Dokument mit HTML für die Spalten.**
  - Beim Pflegen unhandlich, und das Layout liegt dann im Text.
- **Ordner mit einem Dokument je Projekt.**
  - Das war der erste Entwurf.
  - Ersetzt, weil der Besitzer eine Übersicht in einem Fenster möchte.

## Festgelegt

- **Datei:** `inhalt/Project.projekte` (Icon „Project“). Der Name des Icons und Fenstertitel kommen aus dem Dateinamen.
  ```json
  {
    "titel": "Project Resources",
    "untertitel": "Various projects to explore.",
    "projekte": [
      { "name": "…", "text": "…", "link": "https://…", "bild": "bilder/tichu.png" }
    ]
  }
  ```
  - `bild` ist relativ zur Datei.
  - Bilder, auf die eine `.projekte`-Datei verweist, erscheinen nicht als eigene Bild-Icons.
  - Ungültiges JSON: Die Datei wird übersprungen, und in der Konsole erscheint eine Warnung.
- **Icon:** eine eigene 16 × 16-Pixelgrafik, oben rechts auf dem Schreibtisch (x 1320, y 48).
- **Fenster:**
  - Es öffnet sich etwa 560 × 480 groß.
  - Titel in Chicago 24 px, Untertitel in Geneva.
  - Zwei Spalten. Ist das Fenster schmaler als etwa 460 px, wie auf dem Handy, steht eine Spalte.
  - Jede Karte ist ein Link mit `target="_blank"`.
- **Bilder:**
  - Handy-Screenshot (380 px breit), oberer Teil.
  - Daraus ein 1-Bit-Bild mit Atkinson-Dithering in 1:1-Größe für die Karte, 240 × 264 px.
  - Ein Skript `scripts/projektbild.py` rastert neue Screenshots genauso.
- **Sätze:**
  - Tichu Score Board: „Keeps score for Tichu card nights, round by round, with players and stats.“
  - Swiss Temp Dashboard: „Shows how unusual today's temperature is, against every day since 1864.“
