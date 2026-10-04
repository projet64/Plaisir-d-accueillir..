# Plaisir d’accueillir

L’appli familiale des Bouzeran : recettes, soirées entre amis, listes de courses, mode cuisson pas à pas, rétroplanning et souvenirs.
PWA pensée d’abord pour l’iPad (aussi iPhone et PC), hébergée sur Railway.

## Fonctions (V1)
- **Carnet de recettes** par catégorie (apéro, entrée, plat, dessert, cocktail), portions recalculées selon le nombre de convives
- **Ajout par IA** : un nom ou une envie, une photo de la recette (cahier, livre), un lien web, ou la recette dictée
- **Soirées** : invités, menu, alerte si un plat a déjà été servi aux mêmes amis
- **Liste de courses** cumulée sur tout le menu, à cocher (partagée entre les iPad)
- **Rétroplanning** calculé à rebours depuis l’heure « à table »
- **Mode cuisson** : une étape par écran, minuteur qui sonne, écran maintenu allumé
- **Amis** : ce qu’ils évitent, ce qu’ils aiment, historique de tout ce qu’on leur a servi
- **Souvenirs** : notes et photos de chaque soirée (appareil photo de l’iPad)

## Technique
Node.js (Express) + PostgreSQL, front en JavaScript sans compilation (`public/`).

Variables d’environnement (Railway) :
| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Base Postgres Railway |
| `CODE_ACCES` | Code famille demandé à la première ouverture |
| `ANTHROPIC_API_KEY` | Clé API Claude (jamais dans le code) |
| `ANTHROPIC_MODEL` | Facultatif, modèle Claude utilisé |

Lancer en local : `npm install` puis `DATABASE_URL=... npm start`.
