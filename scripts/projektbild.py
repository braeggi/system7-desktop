"""
Macht aus einem Screenshot ein Projektbild für „Project Resources“: schwarz-weiß wie der Rest der Seite.

- Oben aus dem Screenshot wird ein Ausschnitt im Seitenverhältnis des Zielbildes genommen.
- Er wird auf Zielgröße verkleinert und mit Atkinson-Dithering in reine Schwarz-Weiß-Punkte gerastert,
  wie beim Original-Mac. Die Seite zeigt das Bild 1:1, damit jeder Punkt scharf bleibt.

Aufruf (braucht Python 3 und Pillow: pip install pillow):
    python3 scripts/projektbild.py screenshot.png inhalt/bilder/tichu.png
    python3 scripts/projektbild.py screenshot.png bild.png --breite 240 --hoehe 264

Am besten nimmt man den Screenshot in Handybreite auf (etwa 380 px), dann bleibt Text lesbar.
"""

import argparse

from PIL import Image, ImageOps


def crop_top(img: Image.Image, w: int, h: int) -> Image.Image:
    """Ausschnitt oben über die ganze Breite, im Seitenverhältnis w:h."""
    height = min(img.height, round(img.width * h / w))
    return img.crop((0, 0, img.width, height)).resize((w, h), Image.LANCZOS)


def atkinson(gray: Image.Image) -> Image.Image:
    """Jeder Punkt wird schwarz oder weiß; 6/8 des Fehlers wandern zu den Nachbarn."""
    w, h = gray.size
    data = list(gray.getdata())
    rows = [[float(v) for v in data[y * w:(y + 1) * w]] for y in range(h)]
    out = Image.new('1', (w, h), 1)
    for y in range(h):
        for x in range(w):
            old = rows[y][x]
            new = 255.0 if old >= 128 else 0.0
            if not new:
                out.putpixel((x, y), 0)
            err = (old - new) / 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                if 0 <= x + dx < w and y + dy < h:
                    rows[y + dy][x + dx] += err
    return out


def main(src: str, dest: str, w: int, h: int) -> None:
    img = ImageOps.grayscale(Image.open(src).convert('RGB'))
    atkinson(crop_top(img, w, h)).save(dest, optimize=True)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', help='Screenshot (.png, .jpg)')
    ap.add_argument('dest', help='Zieldatei (.png)')
    ap.add_argument('--breite', type=int, default=240, help='Breite in Pixeln (Standard: 240)')
    ap.add_argument('--hoehe', type=int, default=264, help='Höhe in Pixeln (Standard: 264)')
    args = ap.parse_args()
    main(args.src, args.dest, args.breite, args.hoehe)
