# MEVA Initiative

Plateforme communautaire et calendrier des tournois pour la communauté **Star Wars: Unlimited**.

## 🚀 À propos du projet

MEVA Initiative est une application web conçue pour rassembler la communauté autour du jeu de cartes à collectionner (TCG) Star Wars: Unlimited. Elle propose notamment :
- Un calendrier des tournois et événements locaux.
- Un espace d'actualités et de suivi de la communauté.
- Des fonctionnalités dédiées aux joueurs et organisateurs.

## 🛠️ Stack technique

- **Front-end** : HTML5, JavaScript, Tailwind CSS.
- **Hébergement & Backend** : Firebase Hosting, Firestore, Firebase Storage.

## 📂 Structure du projet

```text
meva-initiative/
├── public/             # Fichiers sources front-end (HTML, JS, assets)
├── src/css/            # Source Tailwind CSS (config du thème incluse, via @theme)
├── src/js/firebase/    # Points d'entrée du bundle SDK Firebase
├── scripts/            # Scripts utilitaires (ex: bootstrap admin)
└── firebase.json       # Configuration Firebase

## ⚙️ Installation

### Prérequis

- [**fnm**](https://github.com/schniz/fnm) (Fast Node Manager) pour gérer la version de Node.js.
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`) pour le serveur local et les émulateurs.

### 1. Installer fnm

```bash
# macOS (Homebrew)
brew install fnm

# Linux / macOS (script officiel)
curl -fsSL https://fnm.vercel.app/install | bash
```

Puis activer fnm dans votre shell (exemple pour `zsh`, à ajouter dans `~/.zshrc`) :

```bash
eval "$(fnm env --use-on-cd --shell zsh)"
```

L'option `--use-on-cd` permet de basculer automatiquement sur la version de Node.js définie dans le fichier `.node-version` à l'entrée du dossier du projet.

### 2. Installer la version de Node.js

La version requise (`26.13.1`) est définie dans `.node-version` et dans le champ `engines` de `package.json` :

```bash
fnm install   # installe la version de .node-version
fnm use       # l'active (automatique avec --use-on-cd)
node -v       # doit afficher v26.13.1
```

### 3. Installer les dépendances

```bash
npm install
```

Le projet est prêt : voir la section **Développement** ci-dessous pour le lancer.

## 🧑‍💻 Développement

### Lancer le projet

```bash
npm run dev         # développement : config (dev) + SDK + CSS, puis Tailwind en watch ET les émulateurs Firebase
                    # -> site disponible sur http://localhost:8000 (port défini dans firebase.json > emulators.hosting)
npm run build       # build de production : config (prod) + SDK + CSS
npm run preview     # build de production, puis Firebase Hosting en local (sans émulateurs)

npm run test:rules  # tests des règles de sécurité Firestore
```

### Scripts npm

Convention : `verbe:cible`, le préfixe `dev:` désignant ce qui n'existe qu'en mode dev. L'enchaînement est assuré par [npm-run-all2](https://github.com/bcomnes/npm-run-all2) (`run-s` en séquence, `run-p` en parallèle).

| Script | Rôle |
|---|---|
| `build` | `build:*` en séquence (prod) : `build:config`, `build:sdk`, `build:css` |
| `build:config` | génère `public/firebase-config.generated.js` (prod) |
| `build:sdk` | bundle le SDK Firebase avec esbuild |
| `build:css` | compile Tailwind (minifié) |
| `dev` | `dev:config`, `build:sdk`, `build:css`, puis `dev:serve` |
| `dev:config` | génère la config en mode dev (émulateurs) |
| `dev:serve` | `dev:css` et `dev:emulators` en parallèle (`--race` : l'arrêt de l'un arrête l'autre) |
| `dev:css` | Tailwind en mode watch (`--watch=always`, pour ne pas s'arrêter quand l'entrée standard est fermée) |
| `dev:emulators` | émulateurs Firebase, projet `dev` (alias de `.firebaserc`) |
| `preview` | `build` puis `firebase serve --only hosting` |

### Configuration Firebase (fichiers `.env`)

La config Firebase web est générée dans `public/firebase-config.generated.js` (ignoré par git) par `npm run build:config` (prod) ou `npm run dev:config` (émulateurs).

| Fichier | Versionné | Rôle |
|---|---|---|
| `.env.example` | oui | Liste et documente toutes les clés |
| `.env` | oui | Valeurs par défaut partagées (projet de production) |
| `.env.dev` | oui | Surcharges du mode dev (clés de démo + `FIREBASE_USE_EMULATORS=true`) |
| `.env.local` | non | Surcharges personnelles |

Priorité (de la plus forte à la plus faible) : variables shell > `.env.local` > `.env.dev` (mode dev uniquement) > `.env`. Le chargement est fait par Node lui-même, via les options `--env-file` des scripts `build:config` et `dev:config` (le dernier fichier l'emporte ; les variables du shell gagnent toujours). Le message « .env.local not found » est normal quand ce fichier n'existe pas.

Ces valeurs sont publiques (config web Firebase) : elles servent à changer d'environnement, pas à protéger un secret.

**Sources de vérité**
- **Ports des émulateurs** : uniquement dans le bloc `emulators` de `firebase.json`. Le générateur les lit de là, donc la CLI et le navigateur ne peuvent pas diverger.
- **Project id** : uniquement dans `.firebaserc` (`default` en prod, alias `dev` avec les émulateurs, utilisé aussi par `dev:emulators`). Il n'y a plus de `FIREBASE_PROJECT_ID`. Le générateur échoue si l'alias `dev` ne commence pas par `demo-` (les émulateurs ne doivent jamais viser un vrai projet) ou si `default` est un projet de démo.
- **Valeurs dérivées** : le générateur déduit `authDomain` (`<id>.firebaseapp.com`), `storageBucket` (`<id>.firebasestorage.app`), `databaseURL` (`https://<id>-default-rtdb.<région>.firebasedatabase.app`, région dans `FIREBASE_DATABASE_REGION`) et `messagingSenderId` (2e champ de `FIREBASE_APP_ID`). Pour s'écarter de la convention (domaine d'auth personnalisé, ancien bucket `.appspot.com`…), définir `FIREBASE_AUTH_DOMAIN`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_DATABASE_URL` ou `FIREBASE_MESSAGING_SENDER_ID` (voir `.env.example`).
- **Clés restantes** : `FIREBASE_API_KEY` et `FIREBASE_APP_ID` (obligatoires), `FIREBASE_MEASUREMENT_ID` (optionnelle, ignorée si vide), `FIREBASE_DATABASE_REGION`.
- `FIREBASE_USE_EMULATORS=true` (`.env.dev`) active la connexion du site aux émulateurs ; `FIREBASE_EMULATOR_HOST` définit l'hôte (défaut `localhost`).

`npm run preview` et `firebase deploy` (hook `predeploy`) régénèrent toujours la config de **prod** (via `npm run build`).

### SDK Firebase (bundle esbuild)

Le SDK Firebase n'est plus chargé depuis `gstatic.com` : il est installé via npm (version **exacte** dans `package.json`) et bundlé par [esbuild](https://esbuild.github.io/) dans `public/vendor/firebase/` (ignoré par git) avec `npm run build:sdk`.

- Points d'entrée : `src/js/firebase/firebase-{app,auth,firestore,database}.js` (un simple `export * from "firebase/<produit>"`). Les pages importent `/vendor/firebase/firebase-<produit>.js`, comme avant avec les URLs gstatic.
- Le code commun (dont `firebase-app`) est dans un chunk partagé : une seule instance de l'app Firebase pour toutes les pages.
- Pour mettre à jour : `npm install --save-exact firebase@<version>` (garder `@firebase/rules-unit-testing` compatible avec la version majeure de `firebase`), puis `npm run build:sdk`.
- Cache (`firebase.json`) : les points d'entrée du SDK restent en `no-cache` et les chunks (nom hashé) en `immutable`. Les points d'entrée ne doivent pas être mis en cache : après un déploiement, un point d'entrée périmé référencerait un chunk supprimé (404).

### Tailwind CSS (v4)

Tailwind v4 génère le CSS à la demande (moteur JIT par défaut) via `@tailwindcss/cli` : `npm run dev:css` (watch) ou `npm run build:css` (minifié). Il n'y a plus de `tailwind.config.js` : le thème (couleurs `meva-*`, variante `dark`) est défini en CSS dans `src/css/input.css`.

- Les classes sont détectées automatiquement dans `public/` (HTML et JS, hors fichiers ignorés par git). Les noms de classes construits dynamiquement en JS doivent apparaître en entier dans le code.
- Le script CDN `cdn.tailwindcss.com` a été retiré : `public/css/style.css` (généré, ignoré par git) est la seule source de style.
- `hall-of-fame.html` et `association.html` surchargent la palette `meva-*` avec leurs propres variables CSS (`:root`), comme le faisait leur ancienne config inline.
- Cache (`firebase.json`) : les fichiers `.js` et `.css` sont servis avec `max-age=300, stale-while-revalidate=3600` (5 min de cache, puis au plus 1 h de contenu périmé servi pendant la revalidation), pour qu'un déploiement soit visible rapidement sans revalidation à chaque page.
- `npm run dev` lance le watcher Tailwind et les émulateurs ensemble (Ctrl-C arrête les deux). Firebase n'a pas d'option de config pour lancer un script avant/pendant les émulateurs : `predeploy` ne s'exécute que lors d'un `firebase deploy`, d'où l'enchaînement par scripts npm.
