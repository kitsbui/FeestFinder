#!/usr/bin/env python3
"""
Cuts the Phosphor icon fonts down to the icons FeestFinder uses.

The full fonts (about 280 KB of woff2) stay in vendor-src/phosphor. This writes
ui/vendor/phosphor/{bold,fill}/ with a stylesheet and fonts that hold only the icons
named in the code. Every used icon is kept in both weights, because Ops picks the
weight at run time.

An icon counts as used when:
  - "ph-<name>" appears anywhere in the screens, the shared runtime, the API or the
    Next app;
  - or a quoted string in the Ops code is exactly the name of an icon (Ops passes bare
    names to Icon()).

Run it after using an icon that is not in the cut yet; festfinder-backend/test/icons.test.ts
fails until you do:

    python3 -m pip install fonttools brotli
    python3 festfinder-frontend/scripts/subset-icons.py
"""
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FRONT = ROOT / 'festfinder-frontend'
SRC = FRONT / 'vendor-src' / 'phosphor'
OUT = FRONT / 'ui' / 'vendor' / 'phosphor'
WEIGHTS = {'bold': 'Phosphor-Bold', 'fill': 'Phosphor-Fill'}
# Class names that come with "ph-" but are weights, not icons.
NOT_ICONS = {'bold', 'fill', 'light', 'thin', 'regular', 'duotone'}

RULE = re.compile(r'\.ph-(?:bold|fill)\.ph-([a-z0-9-]+):before \{\s*content: "\\([0-9a-f]+)";\s*\}')


def icon_map(css: str) -> dict:
    return {name: int(code, 16) for name, code in RULE.findall(css)}


def sources():
    """Every file whose text can name an icon, and whether it is Ops code."""
    roots = [
        (FRONT / 'pages', ('.html', '.js')),
        (FRONT / 'ui', ('.js',)),
        (ROOT / 'festfinder-backend' / 'src', ('.ts',)),
        (ROOT / 'festfinder-web' / 'src', ('.ts', '.tsx')),
    ]
    for base, exts in roots:
        for f in sorted(base.rglob('*')):
            if f.suffix not in exts or 'vendor' in f.parts:
                continue
            # The Next app's compiled screens repeat the templates.
            if 'screens' in f.parts and 'festfinder-web' in f.parts:
                continue
            yield f, 'ops' in f.relative_to(FRONT).parts if f.is_relative_to(FRONT) else False


def used_icons(known: set) -> set:
    used = set()
    for f, is_ops in sources():
        text = f.read_text(encoding='utf8')
        used.update(n for n in re.findall(r'ph-([a-z0-9-]+)', text) if n in known and n not in NOT_ICONS)
        if is_ops:
            used.update(n for n in re.findall(r'[\'"`]([a-z0-9-]+)[\'"`]', text) if n in known)
    return used


def main():
    css = {w: (SRC / w / 'style.css').read_text(encoding='utf8') for w in WEIGHTS}
    maps = {w: icon_map(css[w]) for w in WEIGHTS}
    known = set(maps['bold']) & set(maps['fill'])
    used = sorted(used_icons(known))
    for w, family in WEIGHTS.items():
        (OUT / w).mkdir(parents=True, exist_ok=True)
        head = css[w].split(f'.ph-{w}.ph-', 1)[0].rstrip() + '\n\n'
        rules = ''.join(f'.ph-{w}.ph-{n}:before {{\n  content: "\\{maps[w][n]:x}";\n}}\n' for n in used)
        note = f'/* Phosphor {w}, cut to the {len(used)} icons FeestFinder uses by festfinder-frontend/scripts/subset-icons.py. */\n'
        (OUT / w / 'style.css').write_text(note + head + rules, encoding='utf8')
        codes = sorted({maps[w][n] for n in used})
        for flavor in ('woff2', 'woff'):
            opts = subset.Options()
            opts.flavor = flavor
            opts.layout_features = []  # the icons are picked by code point, not by ligature
            opts.name_IDs = ['*']
            opts.notdef_outline = True
            font = TTFont(SRC / w / f'{family}.{flavor}')
            sub = subset.Subsetter(opts)
            sub.populate(unicodes=codes)
            sub.subset(font)
            out = OUT / w / f'{family}.{flavor}'
            font.flavor = flavor
            font.save(out)
            cmap = TTFont(out).getBestCmap()
            missing = [c for c in codes if c not in cmap]
            if missing:
                sys.exit(f'{out}: {len(missing)} icons missing after the cut')
            print(f'{out.relative_to(ROOT)}: {out.stat().st_size // 1024} KB '
                  f'(was {(SRC / w / f"{family}.{flavor}").stat().st_size // 1024} KB)')
    print(f'{len(used)} icons kept of {len(known)}')


if __name__ == '__main__':
    main()
