#!/usr/bin/env python3
"""Vérifie la typographie des contenus.

Erreurs bloquantes :
- tiret cadratin et point médian, dans les pages et la documentation ;
- apostrophe droite dans le texte visible des pages (utiliser ’) ;
- espace ordinaire avant : ; ! ? » ou après « dans le texte visible
  (utiliser l'espace fine insécable U+202F).

Le contenu des balises <code>, <script>, <style> et des attributs n'est pas vérifié.
Usage : python3 scripts/check_typo.py
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANNED = {"\u2014": "tiret cadratin", "\u00b7": "point médian"}
SKIP_TAGS = {"code", "script", "style", "pre"}


class TextCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.chunks = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.chunks.append((self.getpos()[0], data))


def check_banned(path, text, errors):
    for n, line in enumerate(text.splitlines(), 1):
        for ch, name in BANNED.items():
            if ch in line:
                errors.append(f"{path}:{n}: {name} interdit")


def check_html_text(path, text, errors):
    parser = TextCollector()
    parser.feed(text)
    for line, data in parser.chunks:
        if "'" in data:
            errors.append(f"{path}:{line}: apostrophe droite, utiliser ’")
        if re.search(r" [:;!?»]", data):
            errors.append(f"{path}:{line}: espace ordinaire avant : ; ! ? ou », utiliser U+202F")
        if "« " in data:
            errors.append(f"{path}:{line}: espace ordinaire après «, utiliser U+202F")


def main():
    errors = []
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        check_banned(path.name, text, errors)
        check_html_text(path.name, text, errors)
    docs = list(ROOT.glob("*.md")) + list(ROOT.glob("docs/*.md")) + list(ROOT.glob(".github/**/*.md")) + list(ROOT.glob(".github/**/*.yml"))
    for path in sorted(docs):
        check_banned(str(path.relative_to(ROOT)), path.read_text(encoding="utf-8"), errors)
    for e in errors:
        print(e)
    print(f"{len(errors)} problème(s) typographique(s)." if errors else "Typographie : OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
