"""
Macht aus einem Foto einen 1-Bit-Schreibtischhintergrund im Stil von System 6.

Gedacht für helle Motive vor blauem Himmel (Blüten, Wolken, Schnee):
- Weißes wird weiß, dunkle Äste werden schwarz, beides mit Atkinson-Dithering
  (dem Verfahren, mit dem der Original-Mac Fotos zeigte).
- Reiner Himmel wird genau das 50 %-Raster des Schreibtischs.

Aufruf (braucht Python 3 und Pillow: pip install pillow):
    python3 scripts/hintergrund.py foto.jpg src/assets/hintergrund/blueten.png

Das Bild wird auf 1920 × 1200 zugeschnitten, unten bündig. Die Seite zeigt es
rechts unten verankert und 1:1, also ein Bildpunkt pro CSS-Pixel.
"""

import sys

from PIL import Image, ImageOps

W, H = 1920, 1200
SKY = 150  # Grauwert des Himmels vor dem Rastern; wird durch das 50 %-Raster ersetzt


def clamp(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def tones(photo: Image.Image) -> Image.Image:
    """Graustufen nach Bildteil: Blüte weiß, Himmel einheitlich SKY, Ast schwarz."""
    px = list(photo.getdata())
    # Himmel: deutlich blauer als rot. Sein Weißanteil (kleinster Farbkanal) ist die Messlatte.
    sky = sorted(min(p) for p in px if p[2] > p[0] + 40)
    sky_min = sky[len(sky) // 2] if sky else 100
    t1, t2 = sky_min + 35, sky_min + 95
    out = []
    for p in px:
        blossom = clamp((min(p) - t1) / (t2 - t1))
        branch = clamp((95 - max(p)) / 55)
        out.append(round((SKY + (255 - SKY) * blossom) * (1 - branch)))
    return Image.frombytes('L', photo.size, bytes(out))


def atkinson(im: Image.Image) -> Image.Image:
    w, h = im.size
    src = im.load()
    p = [[float(src[x, y]) for x in range(w)] for y in range(h)]
    out = Image.new('1', (w, h))
    o = out.load()
    for y in range(h):
        row = p[y]
        for x in range(w):
            old = row[x]
            new = 255.0 if old >= 128 else 0.0
            o[x, y] = 1 if new else 0
            # Atkinson verteilt nur 6/8 des Fehlers: Lichter bleiben klar, Schatten satt
            e = (old - new) / 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < w and yy < h:
                    p[yy][xx] += e
    return out


def main(src: str, dest: str) -> None:
    photo = ImageOps.fit(Image.open(src).convert('RGB'), (W, H), Image.LANCZOS, centering=(0.5, 1.0))
    gray = tones(photo)
    out = atkinson(gray)
    # Reiner Himmel als 50 %-Raster, Phase ab der rechten unteren Ecke (dort ist das Bild verankert)
    g, o = gray.load(), out.load()
    for y in range(H):
        for x in range(W):
            if g[x, y] == SKY:
                o[x, y] = 0 if ((W - 1 - x) + (H - 1 - y)) % 2 == 0 else 1
    out.save(dest, optimize=True)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
