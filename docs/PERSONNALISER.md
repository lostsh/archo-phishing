# Personnaliser

Tout se fait dans les fichiers HTML et dans `style.css`. Il n'y a rien à compiler.

## Le canal de signalement

C'est la première chose à adapter. Remplace « l'équipe sécurité » par le nom exact de ton canal (bouton « Signaler » de la messagerie, adresse, outil interne) :

- `index.html` : section `#s6`, étape « Signale-le », et la phrase du pied de page ;
- `dev.html` : section `#s6`, étape « Préviens l'équipe sécurité », et la phrase du pied de page.

## Le cartouche

En bas de chaque page, le bloc `<dl class="cartouche">` contient le nom du projet, le nombre de planches, l'échelle et la signature. Modifie les `<dd>` librement.

## Les légendes du mini plan

Chaque section peut définir la légende affichée à côté du mini plan quand on la traverse :

```html
<section class="s" id="s4" data-cap="Planche 04, les pièges à connaître">
```

Sans `data-cap`, une légende par défaut est utilisée. L'attribut fonctionne sur `#s1`, `#s2`, `#s4`, `#s5` et `#s6`.

## Les couleurs

Les couleurs sont des variables CSS en tête de `style.css`, définies trois fois : thème clair (`:root`), thème sombre automatique (`@media (prefers-color-scheme: dark)`) et thème sombre choisi (`:root[data-theme="dark"]`). Pense à modifier les trois. Les plus utiles :

- `--paper` et `--ink` : fond et texte ;
- `--rust` : la couleur du « mode manuel » ;
- `--wash-rust`, `--wash-ochre`, `--wash-grey` : les lavis ;
- `--sketch` et `--overlay` : les traits du dessin.

## La police

La police Inter Tight (licence SIL Open Font) est chargée depuis Google Fonts. Pour ne dépendre d'aucun service externe, ce qui est conseillé dans l'Union européenne :

1. Télécharge le fichier variable `InterTight[wght].ttf` (et sa version italique) depuis le dépôt [google/fonts](https://github.com/google/fonts/tree/main/ofl/intertight), et place-les dans un dossier `fonts/`.
2. Ajoute en tête de `style.css` :

   ```css
   @font-face{ font-family:"Inter Tight"; src:url("fonts/InterTight[wght].ttf") format("truetype"); font-weight:100 900; font-style:normal; font-display:swap; }
   ```

3. Supprime les trois balises `<link>` vers `fonts.googleapis.com` et `fonts.gstatic.com` dans chaque page.
4. Ajoute `fonts/` à la commande de copie dans `.github/workflows/pages.yml`.

## Créer une nouvelle édition

Pour un public précis (finance, RH, direction), copie `dev.html` sous un nouveau nom et réécris les textes. Le dessin et la caméra fonctionneront tels quels si tu gardes la structure attendue par `app.js` :

- un bloc `.hero-text` avec `.sheet`, `h1` et `.lead` ;
- la figure `.plate` avec `#pavilion` et `#scaleBar` (affichée sur mobile) ;
- six sections `#s1` à `#s6`, chacune avec son `.s-head` (`.num` et `h2`) et les blocs listés dans [ARCHITECTURE.md](ARCHITECTURE.md) ;
- le même nombre d'éléments par section : 4 phases, 2 listes de 4, 3 gestes, 8 astuces, 6 risques, 4 étapes.

Lance ensuite `python3 scripts/check_layout.py` : il signale tout texte trop long pour sa pièce.
