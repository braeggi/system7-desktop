# Persönliche Webseite als System-7-Desktop – Design

Stand: 2026-11-03

Markierungen in diesem Dokument:
- ohne Markierung: vom Seitenbesitzer so entschieden oder bestätigt
- **[Meine Entscheidung]**: im Gespräch nicht besprochen, sinnvoll gesetzt, darf beim Lesen korrigiert werden

## 1. Absicht

Eine persönliche Webseite, die keine klassische Webseite ist. Sie ist ein Schreibtisch im Stil des Apple-Betriebssystems System 7, modernisiert. Sie dient als Visitenkarte und Portfolio und ist ein persönliches Projekt, das Spaß machen soll, beim Bauen wie beim Besuchen.

Besucher kommen typischerweise über einen Link, den der Besitzer ihnen gibt. Sie haben ein paar Minuten Zeit und Lust zu stöbern. Sie sollen ein Gefühl dafür bekommen, wer der Besitzer ist und was er macht. Sie sollen den Schreibtisch auch selbst einrichten können, weil das den Reiz ausmacht.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Ein Desktop, den man sofort als System 7 erkennt, der sich aber anfühlt wie auf einem heutigen Mac.
- Besucher können stöbern, Dokumente öffnen und den Schreibtisch nach ihrem Geschmack umräumen.
- Jeder Besucher behält seine eigene Einrichtung, wenn er wiederkommt.
- Die Seite funktioniert auf dem Handy genauso gut, angepasst an den Daumen.
- Neue Inhalte kommen hinzu, indem eine Datei in einen Ordner gelegt wird.

**Nicht-Ziele**
- Einzelne Dokumente brauchen keine eigene URL und müssen nicht von Suchmaschinen gefunden werden. Alles ist über den Desktop erreichbar.
- Besucher können keine eigenen Dokumente anlegen und keine Texte bearbeiten.
- Es gibt kein Backend, keine Datenbank, keine Konten und kein Admin-Panel.
- Was ein Besucher umräumt, sieht niemand außer ihm selbst.
- Es ist keine vollständige Betriebssystem-Simulation. Nur was dem Erlebnis dient, wird gebaut.

**Anti-Ziele** (das Projekt ist gescheitert, auch wenn es technisch läuft, falls …)
- … es sich wie ein billiger Retro-Gag anfühlt, der nach zehn Sekunden nervt.
- … es auf dem Handy hakelig ist oder Scrollen und Ziehen sich gegenseitig stören.
- … ein Besucher Inhalte endgültig verlieren kann und keinen Weg zurück findet.
- … es langsam lädt oder ruckelt.
- … es Apples geschützte Marken oder Grafiken kopiert (siehe 9.1).

## 3. Visueller Stil: System 6 in Schwarz-Weiß mit Pixel-Ampel

*Geändert am 2026-11-04.* Ursprünglich war Entwurf B („System 7 trifft Glas“) gewählt: Milchglas, farbiger Verlauf, weiche Schatten. Nach dem ersten Ausprobieren hat sich der Besitzer für einen deutlich retroeren Stil entschieden, angelehnt an System 6 von 1988. Ausgewählt hat er ihn aus den Entwürfen in `.superpowers/brainstorm/…/content/system6-v2.html`, Variante 2 „Pixel-Ampel“.

- **Farben:** Reines Schwarz-Weiß ohne Grau als Farbe. Grau entsteht nur durch 1-Bit-Punktmuster, etwa beim Schreibtisch-Hintergrund mit 50 % oder bei ausgegrautem Menütext.
- **Linien und Schatten:** Alles ist pixelgenau, mit 1-Pixel-Linien und 1-Pixel-Schlagschatten. Es gibt keine Rundungen, keine Unschärfe, keine Transparenz und keine weichen Schatten.
- **Fenster:** weiß mit schwarzem Rahmen. Nur das vorderste Fenster hat Nadelstreifen in der Titelleiste. Unten rechts sitzt das Größenfeld mit zwei Kästchen, und die Rollbalken haben Punktmuster.
- **Fensterknöpfe:** Links sitzt eine Pixel-Ampel aus drei 13×13-Pixelkreisen mit schwarzem Rand und weißer Füllung.
  - Beim Hover erscheinen Pixel-Symbole (×, −, +) und die Farben Rot, Gelb und Grün. Das ist die einzige Farbe der Seite.
  - Rot schließt, Gelb rollt ein, Grün maximiert. Ein Doppelklick auf die Titelleiste maximiert ebenfalls.
  - Auf dem Handy gibt es nur Rot.
- **Icons:** eigene 16×16-Pixelgrafiken, doppelt skaliert. Beschriftungen haben einen weißen Hintergrund. Ausgewählte Icons und Ablageziele werden invertiert.
- **Menüs und Dialoge:**
  - Geöffnete Menütitel und Menüeinträge sind schwarz hinterlegt.
  - Die Rückfrage ist ein Warnfenster mit Doppelrahmen und abgerundeten Knöpfen. Der Standardknopf hat einen dicken Ring.
  - Auf dem Handy dunkelt ein Punktraster hinter dem Blatt ab.
- **Bewegung:** Der Zoom läuft in sechs ruckeligen Stufen statt weich. Beim Ziehen wandert das Icon mit gepunktetem Umriss.
- **Startbildschirm:** ein Kasten im Stil von „Welcome to Macintosh“ mit eigenem Pixel-Computer und dem Seitentitel.

**[Meine Entscheidung]** Schriften: Menüleiste und Fenstertitel in einer frei lizenzierten Chicago-artigen Schrift (z. B. ChicagoFLF oder eine vergleichbare freie Nachbildung). Lesetexte in Dokumenten in einer gut lesbaren Systemschrift.

**[Meine Entscheidung]** Icons, Hintergrund und Schriften sind eigene Grafiken oder frei lizenziert. Originalgrafiken von Apple werden nicht übernommen.

## 4. Inhalte

Es gibt zwei Arten von Dokumenten:
- **Textdokument:** öffnet ein Fenster mit lesbarem Text.
- **Bilddokument:** öffnet ein Fenster, das das Bild zeigt.

Dazu gibt es **Ordner** als Behälter für Dokumente.

### Pflege durch den Besitzer
- Im Projekt liegt ein Ordner `inhalt/`.
- Jede Markdown-Datei (`.md`) darin wird ein Textdokument, jedes Bild (`.jpg`, `.png`, `.webp`, `.gif`) ein Bilddokument.
- Jeder Unterordner wird ein Ordner auf dem Schreibtisch, sein Inhalt sind die Dokumente darin.
- Eine kleine Datei (z. B. `inhalt/schreibtisch.json`) legt die **Anfangsposition** jedes Elements auf dem Desktop fest. Elemente ohne Eintrag platziert die Seite automatisch an einem freien Platz.
- Der Titel eines Dokuments kommt aus dem Frontmatter (`title:`) oder ersatzweise aus dem Dateinamen.

**[Meine Entscheidung]** Ordner haben genau eine Ebene. Ordner in Ordnern gibt es in der ersten Version nicht.

**[Meine Entscheidung]** Textdokumente unterstützen normales Markdown: Überschriften, Absätze, Listen, Links, Fettdruck und eingebettete Bilder. Externe Links öffnen in einem neuen Tab.

## 5. Erlebnis am Computer

### Schreibtisch
- Icons liegen frei positioniert auf dem Schreibtisch, beim ersten Besuch in der Anordnung des Besitzers.
- Ein Klick wählt ein Icon aus und zeigt es hervorgehoben. Ein Doppelklick öffnet es.

### Einrichten per Drag and Drop
- Ordner und Dokumente lassen sich frei über den Schreibtisch ziehen.
- Ein **Dokument auf einem Ordner** loslassen: Es verschwindet vom Schreibtisch und liegt danach im Ordner. Im geöffneten Ordner-Fenster ist es zu sehen und kann wieder herausgezogen werden, auf den Schreibtisch, in einen anderen Ordner oder in den Papierkorb.
- Ein **Dokument oder Ordner auf dem Papierkorb** loslassen: Es verschwindet. Der Papierkorb zeigt sein ausgebeultes „voll“-Icon. Per Doppelklick öffnet er sich als Fenster mit seinem Inhalt, aus dem man Dinge wieder herausziehen kann.
- **[Meine Entscheidung]** Ordner kann man nicht in andere Ordner ziehen, passend zu „nur eine Ebene“. Beim Ziehen über einen Ordner gibt es dann keine Hervorhebung.
- Während des Ziehens wird das Ziel (Ordner oder Papierkorb) hervorgehoben, sobald man darüber ist.
- **[Meine Entscheidung]** Ein Ordner im Papierkorb behält seine Dokumente. Holt man ihn zurück, kommt er mit seinem Inhalt.
- **[Meine Entscheidung]** Ist der Bildschirm kleiner als der des Besitzers, werden die Anfangspositionen so verkleinert, dass alles sichtbar bleibt. Überlappungen werden aufgelöst.
- **[Meine Entscheidung]** Icons bleiben immer vollständig im sichtbaren Bereich. Wird das Browserfenster kleiner, rücken sie nach innen.

### Fenster
- Textdokumente, Bilddokumente, Ordner und der Papierkorb öffnen jeweils ein Fenster.
- Fenster lassen sich an der Titelleiste verschieben, über das Schließfeld schließen und überlappen sich. Ein Klick holt ein Fenster nach vorne.
- **[Meine Entscheidung]** Fenster haben unten rechts ein Größenfeld wie in System 7 und lassen sich damit vergrößern und verkleinern.
- **[Meine Entscheidung]** Beim Öffnen zoomt das Fenster aus dem Icon heraus, beim Schließen schrumpft es zurück. Das ist die moderne Fassung der Zoom-Rechtecke von System 7.
- **[Meine Entscheidung]** Ein bereits offenes Dokument wird nicht ein zweites Mal geöffnet, sondern nach vorne geholt.
- **[Meine Entscheidung]** Offene Fenster werden nicht gespeichert. Bei einem neuen Besuch ist der Schreibtisch aufgeräumt, aber in der Anordnung des Besuchers.

### Menüleiste
**[Meine Entscheidung]** Die Menüleiste enthält nur Menüs mit Einträgen, die wirklich etwas tun. Die Bezeichnungen sind die deutschen Originalbegriffe von System 7.
- **Eigenes Symbol ganz links** (statt Apple-Logo, siehe 9.1) → „Über diesen Schreibtisch …“ öffnet ein kleines Info-Fenster über die Seite.
- **Ablage** → „Öffnen“ (für das ausgewählte Icon), „Fenster schließen“.
- **Spezial** → „Papierkorb entleeren …“ und „Schreibtisch aufräumen“.
- Rechts steht die aktuelle Uhrzeit.

### Papierkorb und Aufräumen
- **Papierkorb entleeren:** **[Meine Entscheidung]** Es kommt eine Rückfrage im System-7-Stil („Möchtest du den Papierkorb wirklich entleeren?“). Danach ist der Papierkorb leer und zeigt wieder das normale Icon.
- **Schreibtisch aufräumen:** Stellt die ursprüngliche Anordnung des Besitzers wieder her. Alle Dokumente sind wieder an ihrem Platz, auch solche aus dem Papierkorb und aus einem entleerten Papierkorb. Kein Inhalt geht also endgültig verloren.

### Tastatur
**[Meine Entscheidung]** Als Grundlage für Barrierefreiheit:
- Mit Tab gelangt man zu den Icons, mit Enter öffnet man sie.
- Escape oder Cmd/Strg+W schließt das vorderste Fenster.
- Menüs sind per Tastatur bedienbar.
- Icons und Fenster haben passende ARIA-Rollen und -Beschriftungen.

## 6. Erlebnis auf dem Handy

Gilt bei Touch-Bedienung und schmalem Bildschirm. Den genauen Umschaltpunkt legt der Bauende fest. Es ist derselbe Schreibtisch im selben Stil, für den Daumen gemacht (Mockup `handy.html`, vom Besitzer bestätigt):

1. **Schreibtisch:** Icons liegen in einem Raster (3 Spalten). Einmal antippen öffnet. Menüleiste oben und Papierkorb unten rechts bleiben.
2. **Einrichten:** Gedrückt halten (ca. 400 ms) hebt ein Icon an, mit leichter Vergrößerung und Schatten. Dann lässt es sich verschieben, in einen Ordner oder in den Papierkorb ziehen. So stört Ziehen nicht das Scrollen.
3. **Dokument offen:** Das Fenster zoomt aus dem Icon und füllt fast den ganzen Bildschirm. Es ist immer nur eines offen, mit Nadelstreifen-Titelleiste und Schließfeld. Zurück geht es über das Schließfeld oder mit einem Wisch nach unten.
4. **Aus einem Ordner oder dem Papierkorb herausholen:** Im Ordner- oder Papierkorbfenster hebt Gedrückthalten ein Dokument an. Das Fenster gleitet nach unten weg, und der Schreibtisch mit seinem Raster wird sichtbar. Dort lässt man das Dokument los: auf einem freien Platz, auf einem anderen Ordner oder auf dem Papierkorb. Die Geste ist dieselbe wie auf dem Schreibtisch.
5. **Dokument aus einem Ordner öffnen:** Das Dokument legt sich über das Ordnerfenster. Beim Schließen kehrt man zum Ordner zurück, nicht direkt zum Schreibtisch. Es gibt also einen kleinen Stapel mit höchstens zwei Ebenen: Ordner und darin geöffnetes Dokument.

Die Menüleiste bleibt bedienbar, die Menüs klappen per Tippen auf.

**[Meine Entscheidung]** Welche Darstellung gilt, entscheidet allein die Bildschirmbreite, nicht ob es ein Touch-Gerät ist. Ein iPad oder ein Touch-Laptop bekommt also den freien Schreibtisch. Ein sehr schmales Browserfenster am Computer bekommt das Raster. Der freie Schreibtisch funktioniert deshalb auch mit Touch: Antippen öffnet, und gedrückt halten startet das Ziehen, wie auf dem Handy.

## 7. Zustand und Speicherung

- Die Einrichtung jedes Besuchers wird im `localStorage` seines Browsers gespeichert. Ein Server ist nicht beteiligt.
- Gespeichert wird:
  - die Position jedes Icons auf dem Schreibtisch
  - welches Dokument in welchem Ordner liegt
  - was im Papierkorb ist
  - welche Dokumente durch „Papierkorb entleeren“ ausgeblendet sind
- **[Meine Entscheidung]** Am Computer und auf dem Handy werden die Positionen getrennt gespeichert. Am Computer sind es freie Koordinaten, auf dem Handy die Reihenfolge im Raster, weil sich das eine nicht sinnvoll ins andere übertragen lässt. Ordner-Zuordnung und Papierkorb gelten für beide gleich.
- **Wichtig für später hinzugefügte Inhalte:** Legt der Besitzer neue Dokumente an, sehen auch wiederkehrende Besucher sie, und zwar an ihrer Anfangsposition oder an einem freien Platz. Gelöschte Inhalte verschwinden auch aus gespeicherten Einrichtungen. Der gespeicherte Zustand bezieht sich auf Element-IDs, also stabile Pfade relativ zu `inhalt/`, und wird beim Laden mit dem aktuellen Inhalt abgeglichen.
- Wenn `localStorage` nicht verfügbar ist (privater Modus, blockiert), funktioniert die Seite normal und vergisst die Einrichtung nur beim Neuladen.

## 8. Technik und Betrieb

- **Svelte mit Vite** (vom Besitzer gewählt, nach Abwägung gegenüber React und Astro). Ergebnis ist eine rein statische Seite.
- Drag and Drop wird mit Pointer Events selbst gebaut, nicht mit der HTML5-Drag-and-Drop-API. So funktioniert es mit Maus und Touch einheitlich und fühlt sich richtig an.
- Inhalte aus `inhalt/` werden zur Build-Zeit eingelesen, z. B. per `import.meta.glob`, und Markdown wird in HTML umgewandelt.
- Animationen mit Svelte-eigenen Übergängen. Bei `prefers-reduced-motion` werden sie stark reduziert.
- Das Projekt liegt in `/Users/lb/Documents/github/system7-desktop` und soll später auf GitHub veröffentlicht werden.
- **[Meine Entscheidung]** Hosting über **GitHub Pages** mit einem GitHub-Actions-Workflow, der bei jedem Push auf `main` baut und veröffentlicht. Das passt dazu, dass das Repo ohnehin auf GitHub liegt. Der Vite-`base`-Pfad muss passend gesetzt werden (Projektseite unter `/<repo>/` oder eigene Domain unter `/`). Cloudflare Pages oder Netlify wären gleichwertige Alternativen.
- **[Meine Entscheidung]** Die Seite verwendet kein Tracking, kein Analytics und keine Cookies. `localStorage` dient nur der Funktion.
- **[Meine Entscheidung]** Unterstützt werden aktuelle Versionen von Chrome, Safari, Firefox und Edge auf Computer und Handy. Wo `backdrop-filter` fehlt, gibt es einen halbtransparenten Hintergrund als Ersatz.

## 9. Weitere Punkte

### 9.1 Marken
**[Meine Entscheidung]** Ganz links in der Menüleiste steht ein **eigenes Symbol**, zum Beispiel ein Monogramm, und nicht das Apple-Logo. Der Name „System 7“ erscheint nicht als Titel oder Branding der Seite. Der Stil ist eine erkennbare Hommage, ohne Apples Marken zu nutzen.

### 9.2 Verspielte Extras
Diese Extras hat der Besitzer als zweitrangig eingestuft.
- **[Meine Entscheidung]** In der ersten Version gibt es einen kurzen Startbildschirm (unter 1,5 Sekunden) mit einem eigenen „glücklichen Computer“-Symbol. Er erscheint nur beim ersten Aufruf pro Browser-Sitzung und lässt sich per Klick überspringen.
- **[Meine Entscheidung]** Systemtöne gibt es in der ersten Version nicht. Wenn sie später kommen, sind sie standardmäßig aus.

### 9.3 Sprache
**[Meine Entscheidung]** Die Oberfläche ist auf Deutsch, mit den Originalbegriffen von System 7. Die Inhalte schreibt der Besitzer in der Sprache seiner Wahl.

## 10. Dem Bauenden überlassen

- die Komponentenstruktur und die Form des Zustands
- die genauen Farbwerte, Abstände und Icon-Zeichnungen im Rahmen von Abschnitt 3
- der Umschaltpunkt zwischen Computer- und Handy-Darstellung
- die Wahl der Markdown-Bibliothek und der Chicago-artigen Schrift (frei lizenziert)
- das Format der Datei für die Anfangspositionen
- Beispielinhalte für den Start: ein „Über mich“-Text, ein Ordner „Projekte“ mit zwei Dokumenten, ein Ordner „Fotos“ mit zwei Bildern und ein „Kontakt“-Text, alle als Platzhalter
