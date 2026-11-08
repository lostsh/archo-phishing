#!/usr/bin/env python3
"""Vérifie que chaque page s'affiche correctement dans un vrai navigateur.

- Blueprint actif sur grand écran, aucun texte ne déborde de sa pièce.
- Repli en lecture classique sur mobile, sans défilement horizontal.
- Aucune erreur JavaScript.

Prérequis : pip install playwright && playwright install chromium
Usage : python3 scripts/check_layout.py
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted(p.name for p in ROOT.glob("*.html"))
OVERFLOW_JS = """[...document.querySelectorAll('.bp-card, .bp-card .risks li, .bp-card .notes li')]
  .filter(e => e.scrollHeight > e.clientHeight + 2)
  .map(e => (e.className || e.tagName) + ' (+' + (e.scrollHeight - e.clientHeight) + 'px) : '
            + (e.textContent || '').trim().slice(0, 60))"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name in PAGES:
            url = (ROOT / name).as_uri()
            for w, h in [(1280, 800), (1440, 900), (1920, 1080)]:
                page = browser.new_page(viewport={"width": w, "height": h})
                page.on("pageerror", lambda e, n=name: errors.append(f"{n}: erreur JS : {e}"))
                page.goto(url)
                page.evaluate("document.fonts.ready")
                page.wait_for_timeout(800)
                if not page.evaluate("document.documentElement.classList.contains('bp-on')"):
                    errors.append(f"{name} {w}x{h}: le blueprint ne s'active pas")
                for item in page.evaluate(OVERFLOW_JS):
                    errors.append(f"{name} {w}x{h}: débordement {item}")
                page.close()
            page = browser.new_page(viewport={"width": 390, "height": 844})
            page.goto(url)
            page.wait_for_timeout(800)
            if page.evaluate("document.documentElement.scrollWidth > innerWidth"):
                errors.append(f"{name} mobile : défilement horizontal")
            page.close()
        browser.close()
    for e in errors:
        print(e)
    print(f"{len(errors)} problème(s) de mise en page." if errors else "Mise en page : OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
