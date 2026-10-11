# Médias fournis par le label

Dossier de dépôt pour les fichiers que Groove To Grave Records fournit : extraits audio
et images (pochettes, flyers, photos). Les originaux déposés ici **ne sont pas commités**
(voir `.gitignore`) ; seules les sorties traitées sous `public/experience/groove-to-grave/`
le sont. Le site les utilise en priorité sur les fichiers publics récupérés par script et
sur les provisoires (brief §7).

```
label/
  audio/          fichiers audio originaux (wav, aiff, flac, mp3)
  images/         images originales (jpg, png, tiff, webp), jamais retouchées
  manifest.json   décrit chaque fichier, sinon il est ignoré
```

## manifest.json

```json
{
  "audio": [
    { "file": "ufo-catcher-master.wav", "track": "gtgr05-a1", "start": 95 }
  ],
  "images": [
    { "file": "gtgr05-pochette.jpg", "id": "gtgr05", "credit": "JeunePenard" },
    { "file": "extended-flyer.png", "id": "2026-01-09", "credit": "LukasDarian" },
    { "file": "merov.jpg", "id": "merov", "credit": "Nom du photographe" }
  ]
}
```

- `track` : identifiant de piste du contenu typé (`<ref>-<position>`, par exemple `gtgr05-a1`,
  `gtgrva02-3`). La piste doit appartenir à une sortie dont la date est passée ; un fichier
  marqué `"unreleased": true` ou rattaché à une sortie à venir est refusé par le script.
- `start` : point de départ de l'extrait en secondes, optionnel. Par défaut, 30 % de la durée.
- L'extrait fait 60 s (`"duration"` optionnel pour raccourcir), fondus de 2 s, MP3 192 kbps,
  normalisé à −14 LUFS.
- `id` d'image : ref de sortie (`gtgr05`), date ISO de soirée (`2026-01-09`) ou slug
  d'artiste (`merov`). Les images sont déclinées en AVIF et WebP aux largeurs du script,
  jamais recadrées ni retouchées.
- `credit` : affiché à côté de l'image. Obligatoire pour les pochettes et les flyers.

Traitement : `npx tsx scripts/g2g-media.ts`, qui écrit `../rapport.md` avec la source retenue
pour chaque emplacement.
