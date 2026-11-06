"""
Zeichnet inhalt/pulp.gif: Vincent und Jules, eine Pizza fliegt heran, beide schießen.

Alles ist Punkt für Punkt von Hand gezeichnet: Jede Figur ist eine Liste von Zeilen,
jedes Zeichen ein Bildpunkt in der Farbe aus COLOR ('.' bleibt durchsichtig).
Gezeichnet wird auf W × H Punkten, gespeichert K-fach vergrößert. So öffnet das
Fenster das Bild 1:1 und die Pixel bleiben scharf.

Aufruf (braucht Python 3 und Pillow: pip install pillow):
    python3 scripts/pulp.py inhalt/pulp.gif
"""

import argparse
import math

from PIL import Image

W, H, K = 96, 56, 4
VX, JX, Y = 50, 64, 8  # linke Kante von Vincent und Jules, Oberkante der Figuren
FLOOR = Y + 35

COLOR = {
    'bg': (102, 102, 100),
    'H': (22, 20, 20),     # Haar Vincent
    'S': (214, 170, 140),  # Haut Vincent
    's': (184, 140, 110),
    'D': (92, 58, 36),     # Haut Jules
    'd': (60, 36, 22),
    'A': (52, 32, 20),     # Haar Jules
    'a': (84, 52, 30),
    'K': (30, 28, 28),     # Anzug
    'k': (52, 48, 48),     # Falte im Anzug
    'W': (240, 240, 240),  # Hemd
    'w': (200, 200, 200),  # heller Rauch
    'T': (30, 28, 28),     # Krawatte
    'G': (220, 220, 220),  # Waffe
    'g': (150, 150, 150),
    'O': (78, 78, 76),     # Schatten am Boden, dunkler Rauch
    'P': (230, 190, 70),   # Käse
    'p': (190, 60, 40),    # Salami
    'C': (170, 110, 50),   # Rand
    'F': (255, 240, 160),  # Mündungsfeuer
    'f': (255, 180, 60),
}

VINCENT = [
    "....HHHHH....",
    "...HHHHHHH...",
    "..HHHHHHHHH..",
    "..HHSSSSSHH..",
    "..HSSSSSSSH..",
    "..SSHSSSHSS..",
    "...SSSSSSS...",
    "...SSSsSSS...",
    "...SSSSSSSH..",
    ".....SSS.HH..",
    "..KKWWTWWKK..",
    ".KKKKWTWKKKK.",
    "KKKKKWTWKKKKK",
    "KKkKKWTWKKkKK",
    "KKkKKWTWKKkKK",
    "KKkKKKTKKKkKK",
    "KKkKKKTKKKkKK",
    "KKkKKKKKKKkKK",
    "KKkKKKKKKKkKK",
    "KKkKKKKKKKkKK",
    "KKkKKKKKKKkKK",
    "KK.KKKKKKK.KK",
    "KK.KKKKKKK.KK",
    "SS.KKKkKKK.SS",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "...KKK.KKK...",
    "..KKKK.KKKK..",
]

JULES = [
    "....AaAAaA.....",
    "..AAAAAAAAAA...",
    ".AAaAAAAAaAAA..",
    ".AAAAAAAAAAAA..",
    ".AAADDDDDDAAA..",
    "..AADDDDDDDAA..",
    "..AAdDDDdDDAA..",
    "..AADDDDDDDA...",
    "..AADdddddDA...",
    "...AdDDDDDd....",
    "....dddddd.....",
    "....KKWTWKK....",
    "...KKKWTWKKK...",
    "..KKKKWTWKKKK..",
    "..KKkKWTWKkKK..",
    "..KKkKWTWKkKK..",
    "..KKkKWTWKkKK..",
    "..KKkKKTKKkKK..",
    "..KKkKKTKKkKK..",
    "..KKkKKKKKkKK..",
    "..KKkKKKKKkKK..",
    "..KKkKKKKKkKK..",
    "..KK.KKKKK.KK..",
    "..KK.KKKKK.KK..",
    "..DD.KKkKK.DD..",
    "..DD.KK.KK.DD..",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    ".....KK.KK.....",
    "....KKK.KKK....",
]

GUN_DOWN = ["gG", ".G", ".G", ".G"]
GUN_LEFT = ["GGGGGg", "....gg"]
FLASH = [".F.", "FfF", ".F."]

# Die Pizza dreht sich im Flug: flach, schräg, von der Kante, schräg
PIZZA_FLAT = [
    "..CCCCC..",
    ".CPPpPPC.",
    "CPpPPPpPC",
    ".CPPPpPC.",
    "..CCCCC..",
]
PIZZA_ROUND = [
    "..CCC..",
    ".CPpPC.",
    "CPPPpPC",
    "CpPPPPC",
    ".CPPpC.",
    "..CCC..",
]
PIZZA_EDGE = [
    ".CCCCCCC.",
    "CPPpPPpPC",
    ".CCCCCCC.",
]
SPIN = [PIZZA_FLAT, PIZZA_ROUND, PIZZA_EDGE, PIZZA_ROUND]
PIECES = [
    ["CCC", ".Pp", "..P"],
    ["C..", "PP.", "pPC"],
    ["CC", "Pp"],
    ["CCC", "PpP", ".P."],
    ["pP", ".C"],
    ["C.", "PP"],
    ["P"],
    ["p"],
]


def stamp(img, sprite, x, y):
    for j, row in enumerate(sprite):
        for i, c in enumerate(row):
            if c != '.' and 0 <= x + i < W and 0 <= y + j < H:
                img.putpixel((x + i, y + j), COLOR[c])


def without_left_arm(sprite, cols):
    """Den Arm auf der linken Bildseite entfernen, damit er ausgestreckt gezeichnet werden kann."""
    return [''.join('.' if j >= 13 and i in cols else c for i, c in enumerate(row)) for j, row in enumerate(sprite)]


def frame(raised=False, pizza=None, flash=0, pieces=(), smoke=(), vincent_blink=False):
    img = Image.new('RGB', (W, H), COLOR['bg'])

    def put(x, y, c):
        if 0 <= x < W and 0 <= y < H:
            img.putpixel((x, y), COLOR[c])

    for x in [*range(VX + 1, VX + 12), *range(JX + 3, JX + 13)]:
        put(x, Y + 36, 'O')
    vincent = [r.replace('H', 'S') if j == 5 else r for j, r in enumerate(VINCENT)] if vincent_blink else VINCENT
    if not raised:
        stamp(img, vincent, VX, Y)
        stamp(img, GUN_DOWN, VX, Y + 24)
        stamp(img, JULES, JX, Y - 1)
        stamp(img, GUN_DOWN, JX + 2, Y + 25)
    else:
        stamp(img, without_left_arm(vincent, (0, 1)), VX, Y)
        stamp(img, without_left_arm(JULES, (2, 3)), JX, Y - 1)
        # ausgestreckte Arme; der von Jules liegt vor Vincent
        for x in range(VX - 8, VX + 2):
            put(x, Y + 13, 'K'); put(x, Y + 14, 'K')
        put(VX - 9, Y + 13, 'S'); put(VX - 9, Y + 14, 'S')
        stamp(img, GUN_LEFT, VX - 15, Y + 12)
        for x in range(VX - 6, JX + 4):
            put(x, Y + 16, 'K'); put(x, Y + 17, 'K')
        put(VX - 7, Y + 16, 'D'); put(VX - 7, Y + 17, 'D')
        stamp(img, GUN_LEFT, VX - 13, Y + 15)
        if flash:
            # Mündungsfeuer abwechselnd aus beiden Waffen, dazu eine kurze Leuchtspur
            fx, fy = (VX - 18, Y + 11) if flash == 1 else (VX - 16, Y + 14)
            stamp(img, FLASH, fx, fy)
            for x in range(fx - 10, fx - 1, 2):
                put(x, fy + 1, 'f')
    for x, y, c in smoke:
        put(x, y, c)
    if pizza:
        sprite, x, y = pizza
        stamp(img, sprite, x - len(sprite[0]) // 2, y - len(sprite) // 2)
    for sprite, x, y in pieces:
        stamp(img, sprite, round(x), round(y))
    return img


def scene():
    """Alle Bilder der Szene mit ihrer Dauer in Millisekunden."""
    frames = []
    # stehen, Vincent blinzelt einmal
    frames += [(frame(), 900), (frame(vincent_blink=True), 120), (frame(), 900)]
    # die Pizza fliegt im Bogen von links heran; kurz vor dem Ziel ziehen beide
    path = [(-6 + t * 30, 32 - math.sin(t * math.pi * 0.9) * 16) for t in (i / 8 for i in range(9))]
    for i, (x, y) in enumerate(path):
        frames.append((frame(raised=i >= 5, pizza=(SPIN[i % 4], round(x), round(y))), 90))
    hx, hy = path[-1]
    frames.append((frame(raised=True, pizza=(PIZZA_FLAT, round(hx), round(hy)), flash=1), 70))
    frames.append((frame(raised=True, pizza=(PIZZA_ROUND, round(hx), round(hy)), flash=2), 70))
    # die Pizza zerspringt, die Stücke fliegen auseinander und fallen auf den Boden
    parts = []
    for n, sp in enumerate(PIECES):
        a = math.pi * (0.1 + n * 0.8 / (len(PIECES) - 1))
        speed = 1.2 + (n % 3) * 0.4
        parts.append([sp, hx - 1, hy - 1, math.cos(a) * speed - 0.5, -math.sin(a) * speed - 0.6])
    muzzles = [(VX - 16, Y + 12), (VX - 14, Y + 15)]
    for step in range(14):
        for p in parts:
            sp, x, y, vx, vy = p
            if y + len(sp) < FLOOR:
                vy += 0.45
                x, y = x + vx, y + vy
                if y + len(sp) >= FLOOR:
                    y, vx, vy = FLOOR - len(sp), 0, 0
                p[1:] = [x, y, vx, vy]
        smoke = [(sx - step // 2, sy - 1 - step, 'O' if step > 2 else 'w') for sx, sy in muzzles] if step < 6 else []
        flash = 1 if step == 0 else 2 if step == 1 else 0
        frames.append((frame(raised=True, pieces=[tuple(p[:3]) for p in parts], flash=flash, smoke=smoke), 80))
    rest = [tuple(p[:3]) for p in parts]
    # kurz stehen bleiben, dann die Waffen senken
    frames.append((frame(raised=True, pieces=rest), 900))
    frames.append((frame(pieces=rest), 1400))
    return frames


def main(dest: str) -> None:
    frames = scene()
    big = [f.resize((W * K, H * K), Image.NEAREST) for f, _ in frames]
    big[0].save(dest, save_all=True, append_images=big[1:], duration=[d for _, d in frames],
                loop=0, optimize=True, disposal=1)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('dest', help='Zieldatei (.gif)')
    main(ap.parse_args().dest)
