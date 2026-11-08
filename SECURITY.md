# Sécurité

## Signaler une faille du site

Si tu trouves une vulnérabilité dans ce dépôt (par exemple une injection possible, une dépendance compromise ou un workflow mal configuré), merci de **ne pas ouvrir de ticket public**.

Utilise le signalement privé de GitHub : onglet « Security », puis « Report a vulnerability ». Indique ce que tu as trouvé, comment le reproduire et l'impact possible. Tu recevras une première réponse sous sept jours.

## Ce qui n'est pas concerné

Ce dépôt est un support de sensibilisation. Il ne traite pas les signalements de phishing ou d'incidents : si tu as reçu un message suspect ou cliqué sur un lien douteux, préviens ton équipe sécurité. En France, tu peux aussi consulter [cybermalveillance.gouv.fr](https://www.cybermalveillance.gouv.fr/) ou signaler un SMS frauduleux au 33700.

## Surface du site

- Site statique, sans serveur applicatif, sans formulaire, sans cookie ni traceur.
- Seule ressource externe : la police Inter Tight, chargée depuis Google Fonts.
- Seule donnée stockée dans le navigateur : le choix du thème (`localStorage`, clé `reflexe-theme`).
- Les actions GitHub des workflows sont épinglées par SHA de commit et mises à jour par Dependabot.
