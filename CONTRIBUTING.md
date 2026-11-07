# Contribuer

Merci de ton intérêt. Ce projet vit de contenus justes, courts et utiles : une bonne contribution est souvent une seule phrase mieux écrite, ou un piège récent que peu de gens connaissent.

## Avant de commencer

- Pour une idée de contenu, ouvre d'abord un ticket « Proposer ou corriger un contenu ». On s'accorde sur le fond avant d'écrire.
- Pour une faille de sécurité du site, ne crée pas de ticket public : voir [SECURITY.md](SECURITY.md).

## Lancer le site

```sh
python3 -m http.server 8000
```

Puis `http://localhost:8000` et `http://localhost:8000/dev.html`. Aucune installation n'est nécessaire.

## Règles de rédaction

Le ton et la forme font partie du projet. Une contribution qui ne les respecte pas sera reprise avant d'être acceptée.

- **Tutoiement**, phrases courtes, vocabulaire de tous les jours.
- **Utile et peu connu** : on évite ce que tout le monde sait déjà (« ne clique pas sur les liens suspects »). On cherche le réflexe ou le détail qui change vraiment quelque chose.
- **L'humain d'abord** : les risques sont décrits pour la personne (ses comptes, ses proches, son temps), pas pour l'entreprise.
- **Des faits sourcés** : tout incident, chiffre ou technique d'attaque cité doit pouvoir être vérifié. Mets la source dans la description de la pull request.
- **Typographie française** :
  - apostrophe typographique `’`, jamais `'` dans le texte visible ;
  - espace fine insécable (U+202F) avant `:` `;` `!` `?` `»` et après `«` ;
  - pas de tiret cadratin, pas de point médian.

`scripts/check_typo.py` vérifie ces règles automatiquement.

## Contraintes de mise en page

Dans le blueprint, chaque texte vit dans une pièce de taille fixe. Avant d'allonger un texte, garde en tête les capacités de chaque section (détails dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) :

- 01 : quatre phases, une par travée ;
- 02 : une introduction, deux listes de quatre éléments, une règle et une question ;
- 03 : trois gestes, un par palier ;
- 04 : huit astuces, quatre par pièce, environ trois lignes de texte chacune ;
- 05 : six risques, deux lignes de texte chacun ;
- 06 : quatre étapes et une phrase de conclusion.

`scripts/check_layout.py` ouvre les pages dans un vrai navigateur et signale tout texte qui déborde de sa pièce.

## Vérifications

```sh
python3 scripts/check_typo.py
pip install playwright && python3 -m playwright install chromium
python3 scripts/check_layout.py
npx html-validate index.html dev.html
```

Les mêmes vérifications tournent automatiquement sur chaque pull request. Teste aussi à la main : thème clair et sombre, grand écran, et mobile (lecture classique).

## Traductions

Les traductions sont bienvenues. Crée une nouvelle page (par exemple `en.html`) en gardant exactement la structure HTML de `index.html`, adapte la typographie à la langue, et ajuste les textes pour qu'ils tiennent dans les pièces. Signale-le dans un ticket avant de commencer pour éviter les doublons.

## Licence des contributions

En proposant une contribution, tu acceptes qu'elle soit publiée sous la [licence MIT](LICENSE) du projet.
