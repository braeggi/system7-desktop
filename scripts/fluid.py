"""
Erzeugt einen Schreibtischhintergrund aus fließenden Formen, ganz ohne Foto.

- Die Form ist mehrfach verzerrtes Rauschen („Domain Warping“ nach Inigo Quilez),
  das wie ineinanderlaufende Farbe aussieht.
- Gezeigt wird sie in nur vier flachen Farben (Weiß, Blau, Dunkelblau, Schwarz).
  Übergänge entstehen aus Punkten, mit Atkinson-Dithering wie beim Original-Mac.

Aufruf (braucht Python 3, numpy und Pillow: pip install numpy pillow):
    python3 scripts/fluid.py src/assets/hintergrund/fluid.png
    python3 scripts/fluid.py neu.png --seed 7

Jeder Seed ergibt eine andere Form; Seed 1 ist der eingebaute Hintergrund.
Das Bild ist 2560 × 1600 groß. Die Seite zeigt es rechts unten verankert und 1:1,
also ein Bildpunkt pro CSS-Pixel; auf noch größeren Bildschirmen geht es in BLUE weiter.
"""

import argparse

import numpy as np
from PIL import Image

W, H = 2560, 1600  # deckt auch große Bildschirme ab
BASE = (1920, 1200)  # Ausschnitt rechts unten, auf den die Formen bemessen sind
WHITE, LIGHT, BLUE, NAVY, BLACK = (255, 255, 255), (150, 205, 240), (30, 130, 210), (12, 55, 135), (0, 0, 0)
# Verlauf vom hellsten zum dunkelsten Ton; LIGHT ist nur Zwischenton und wird zu Weiß-Blau-Punkten
STOPS = [WHITE, LIGHT, BLUE, NAVY, BLACK]
PALETTE = [WHITE, BLUE, NAVY, BLACK]
SCALE, WARP = 1.1, 3.5  # Größe der Formen und Stärke der Verzerrung
TABLE = 256


class Noise:
    """Weiches Wertrauschen auf einem zufälligen Gitter, das sich alle TABLE Einheiten wiederholt."""

    def __init__(self, seed: int):
        self.t = np.random.default_rng(seed).random((TABLE, TABLE))

    def __call__(self, x, y):
        xi, yi = np.floor(x).astype(int), np.floor(y).astype(int)
        xf, yf = x - xi, y - yi
        u, v = xf * xf * (3 - 2 * xf), yf * yf * (3 - 2 * yf)
        t = self.t
        a = t[yi % TABLE, xi % TABLE]
        b = t[yi % TABLE, (xi + 1) % TABLE]
        c = t[(yi + 1) % TABLE, xi % TABLE]
        d = t[(yi + 1) % TABLE, (xi + 1) % TABLE]
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v

    def fbm(self, x, y, octaves: int):
        """Mehrere Rauschebenen übereinander, jede doppelt so fein und leicht gedreht."""
        s, amp, tot = 0.0, 0.5, 0.0
        ca, sa = np.cos(0.5), np.sin(0.5)
        for _ in range(octaves):
            s = s + amp * self(x, y)
            tot += amp
            x, y = (ca * x - sa * y) * 2.02 + 3.1, (sa * x + ca * y) * 2.02 + 1.7
            amp *= 0.5
        return s / tot


def tones(seed: int) -> np.ndarray:
    """Helligkeit 0 (weiß) bis 1 (schwarz) je Bildpunkt."""
    n = Noise(seed)
    ys, xs = np.mgrid[0:H, 0:W].astype(float)
    # Die Formen sind an der rechten unteren Ecke ausgerichtet und auf ein 1920 × 1200-Bild bemessen:
    # ein größeres Bild erweitert sie nur nach links und oben.
    x, y = (xs - (W - BASE[0])) / BASE[1] * SCALE, (ys - (H - BASE[1])) / BASE[1] * SCALE
    qx, qy = n.fbm(x, y, 2) - 0.5, n.fbm(x + 5.2, y + 1.3, 2) - 0.5
    rx = n.fbm(x + WARP * qx + 1.7, y + WARP * qy + 9.2, 2) - 0.5
    ry = n.fbm(x + WARP * qx + 8.3, y + WARP * qy + 2.8, 2) - 0.5
    f = n.fbm(x + WARP * rx, y + WARP * ry, 3)
    core = f[H - BASE[1]:, W - BASE[0]:]
    lo, hi = np.percentile(core, 1), np.percentile(core, 99)
    return np.clip((f - lo) / (hi - lo), 0, 1)


def colors(t: np.ndarray) -> np.ndarray:
    """Helligkeit auf den Farbverlauf STOPS."""
    stops = np.array(STOPS, float)
    k = len(stops) - 1
    s = np.clip(t * k, 0, k - 1e-6)
    i = s.astype(int)
    fr = (s - i)[..., None]
    return stops[i] * (1 - fr) + stops[i + 1] * fr


def atkinson(rgb: np.ndarray) -> np.ndarray:
    """Jeder Punkt wird die nächste Palettenfarbe; 6/8 des Fehlers wandern zu den Nachbarn."""
    h, w, _ = rgb.shape
    pal = [tuple(float(c) for c in p) for p in PALETTE]
    rows = [[list(map(float, px)) for px in r] for r in rgb.tolist()]
    out = np.zeros((h, w), np.uint8)
    for y in range(h):
        row = rows[y]
        for x in range(w):
            r, g, b = row[x]
            best, k = 1e18, 0
            for i, (pr, pg, pb) in enumerate(pal):
                d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2
                if d < best:
                    best, k = d, i
            out[y, x] = k
            pr, pg, pb = pal[k]
            er, eg, eb = (r - pr) / 8, (g - pg) / 8, (b - pb) / 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < w and yy < h:
                    p = rows[yy][xx]
                    p[0] += er
                    p[1] += eg
                    p[2] += eb
    return out


def main(dest: str, seed: int) -> None:
    index = atkinson(colors(tones(seed)))
    # Palettenbild mit 2 Bit je Punkt: verlustfrei und deutlich kleiner als RGB
    im = Image.fromarray(index, 'P')
    im.putpalette([c for p in PALETTE for c in p])
    im.save(dest, optimize=True, bits=2)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('dest', help='Zieldatei (.png)')
    ap.add_argument('--seed', type=int, default=1, help='Zufallszahl für die Form (Standard: 1)')
    args = ap.parse_args()
    main(args.dest, args.seed)
