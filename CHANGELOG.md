# Changelog

## 1.1.1
- **Sécurité** : helper d'échappement `esc` appliqué à toutes les valeurs insérées dans le HTML de `_renderNow()` (nom de la personne, zone, dernière position, adresse du capteur de localisation, URL de la photo, unité de distance, entités, titre) et à l'en-tête des personnes dans l'éditeur. La couleur `color` de chaque personne est validée (hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, `var(--…)` ou nom CSS), sinon la couleur de la palette s'applique.
- README : l'installation commence par la recherche directe dans HACS.

## 1.1.0
- **8 langues** : français, anglais, allemand, espagnol, italien, néerlandais, portugais et polonais, pour la carte et son éditeur visuel. Elle suit la langue du profil Home Assistant (anglais si la langue n'est pas traduite) ; nouvelle option `language`, aussi réglable dans l'éditeur.
- README en anglais (`README.en.md`).

## 1.0.1
- **iPhone / iPad : la page ne remonte plus toute seule.** Quand la carte se redessinait (à chaque changement de position et chaque minute), la page pouvait remonter d'un coup sur iOS (Safari et application Home Assistant). La carte garde maintenant sa hauteur pendant qu'elle se redessine, et la position de défilement est conservée.

## 1.0.0
- Première version publique : présence, zone, adresse, source GPS / Wi-Fi, distance et direction (Proximité), batterie, position trop ancienne, éditeur visuel.
