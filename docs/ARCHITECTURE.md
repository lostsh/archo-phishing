# Architecture

Le site tient en trois fichiers partagés par toutes les éditions : la page HTML porte le texte, `style.css` la présentation, `app.js` le dessin et le mouvement.

## Principe général

1. **La page HTML est un document complet et lisible seul.** Sans JavaScript, sur mobile ou avec les animations réduites, on lit simplement les sections les unes après les autres, avec l'illustration du pavillon en tête.
2. **Sur grand écran**, `app.js` construit le blueprint : un monde de 4400 × 2600 pixels qui contient une coupe de bâtiment dessinée en SVG et des cartes de texte. Les cartes sont des copies des blocs de la page (les originaux sont masqués), donc le contenu reste dans l'ordre de lecture.
3. **Le défilement pilote une caméra** qui passe d'un arrêt à l'autre en déplaçant et en zoomant ce monde.

## Le moteur de croquis

`Sketch` produit des traits qui imitent le crayon : léger arc, dépassements aux extrémités, trait parfois repassé. Il sait aussi tracer des polygones, des hachures découpées dans une forme, des gribouillis de feuillage, des pins et des arbres. Le hasard est reproductible (`rng(seed)`), donc le dessin est identique à chaque visite.

Chaque trait est un chemin SVG avec `pathLength="1"` : l'animation CSS fait passer `stroke-dashoffset` de 1 à 0, avec un délai et une durée propres à chaque trait. L'épaisseur des traits du blueprint est divisée par le zoom courant (variable `--bp-s`) pour rester fine à l'écran quelle que soit la distance.

## Le blueprint

Tout est dans le module `BP` de `app.js`.

- **Les niveaux** du bâtiment sont des constantes : toit, étage, rez-de-chaussée, sous-sol, murs.
- **`STOPS`** liste les arrêts de la caméra, dans l'ordre de la visite. Chaque arrêt a un cadrage (`cam`), éventuellement un emplacement de texte (`card`) et une zone de dessin à construire à l'approche (`zone`).
- **`draw()`** dessine l'enveloppe, les arbres, puis une zone par pièce : colonnade (01), seuil (02), escalier (03), rayonnages (04), fondations (05), sortie (06), et les éléments légers (axes, niveaux, cote).
- **`buildCards()`** copie les blocs de chaque section dans les cartes.
- **`frame()`** calcule à chaque défilement l'arrêt courant, interpole le cadrage (avec un léger recul entre deux pièces éloignées), affiche la carte active, construit les zones et met à jour le mini plan.

## Ce que `buildCards()` attend dans la page

- `#s1` : `.s-head`, `.bays` (4 `li`)
- `#s2` : `.s-head`, `.intro`, `.rule`, `.rule-sub`, `.cols` (2 listes `.lines` de 4 `li`)
- `#s3` : `.s-head`, `.gest` (3 `li`, un par palier)
- `#s4` : `.s-head`, `.notes` (8 `li`, répartis en deux pièces de 4)
- `#s5` : `.s-head`, `.risks` (6 `li`)
- `#s6` : `.s-head`, `.fix` (4 `li`), `.closing`

Les tailles des pièces sont fixes, en pixels du monde (par exemple 980 × 620 pour chaque pièce d'astuces). La caméra limite le zoom à 0,9 pour garder le texte confortable.

## Quand le blueprint s'active

Il s'active si l'écran fait au moins 900 pixels de large et si l'utilisateur n'a pas demandé à réduire les animations. Sinon, la classe `bp-on` n'est pas posée et la page reste en lecture classique. Le changement est suivi en direct (rotation, redimensionnement).

## Thèmes

Les couleurs sont des variables CSS. Le thème suit le système, et le bouton « Clair / Sombre » le force en posant `data-theme` sur `<html>`. Le choix est mémorisé dans `localStorage` (clé `reflexe-theme`).
