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
npm run dev:css     # compile Tailwind CSS (v4) en mode watch
npm run build       # config (prod) + bundle du SDK Firebase + CSS
npm run serve       # build puis démarre Firebase Hosting en local
npm run dev         # génère la config (dev), bundle le SDK Firebase et lance les émulateurs Firebase (auth, firestore, database, hosting)
                    # -> site disponible sur http://localhost:8000 (port défini dans firebase.json > emulators.hosting)

npm run test:rules  # exécute les tests des règles de sécurité Firestore
```

### Configuration Firebase (fichiers `.env`)

La config Firebase web est générée dans `public/firebase-config.generated.js` (ignoré par git) par `npm run config` (prod) ou `npm run config:dev` (émulateurs).

| Fichier | Versionné | Rôle |
|---|---|---|
| `.env.example` | oui | Liste et documente toutes les clés |
| `.env` | oui | Valeurs par défaut partagées (projet de production) |
| `.env.dev` | oui | Surcharges du mode dev (projet `demo-meva-initiative` + émulateurs) |
| `.env.local` | non | Surcharges personnelles |

Priorité (de la plus forte à la plus faible) : variables shell > `.env.local` > `.env.dev` (mode dev uniquement) > `.env`.

Ces valeurs sont publiques (config web Firebase) : elles servent à changer d'environnement, pas à protéger un secret.

**Sources de vérité**
- **Ports des émulateurs** : uniquement dans le bloc `emulators` de `firebase.json`. Le générateur les lit de là, donc la CLI et le navigateur ne peuvent pas diverger.
- **Project id en dev** : uniquement dans `.env.dev` (`FIREBASE_PROJECT_ID`). `npm run dev` le lit de là pour lancer les émulateurs (`--project`) et refuse de démarrer s'il ne commence pas par `demo-`.
- `FIREBASE_USE_EMULATORS=true` (`.env.dev`) active la connexion du site aux émulateurs ; `FIREBASE_EMULATOR_HOST` définit l'hôte (défaut `localhost`).

`npm run serve` et `firebase deploy` (hook `predeploy`) régénèrent toujours la config de **prod**.

### SDK Firebase (bundle esbuild)

Le SDK Firebase n'est plus chargé depuis `gstatic.com` : il est installé via npm (version **exacte** dans `package.json`) et bundlé par [esbuild](https://esbuild.github.io/) dans `public/vendor/firebase/` (ignoré par git) avec `npm run build:js`.

- Points d'entrée : `src/js/firebase/firebase-{app,auth,firestore,database}.js` (un simple `export * from "firebase/<produit>"`). Les pages importent `/vendor/firebase/firebase-<produit>.js`, comme avant avec les URLs gstatic.
- Le code commun (dont `firebase-app`) est dans un chunk partagé : une seule instance de l'app Firebase pour toutes les pages.
- Pour mettre à jour : `npm install --save-exact firebase@<version>` (garder `@firebase/rules-unit-testing` compatible avec la version majeure de `firebase`), puis `npm run build:js`.
- Cache (`firebase.json`) : les points d'entrée sont en `no-cache`, les chunks (nom hashé) en `immutable`, pour éviter un mélange de versions après un déploiement.

### Tailwind CSS (v4)

Tailwind v4 génère le CSS à la demande (moteur JIT par défaut) via `@tailwindcss/cli` : `npm run dev:css` (watch) ou `npm run build:css` (minifié). Il n'y a plus de `tailwind.config.js` : le thème (couleurs `meva-*`, variante `dark`) est défini en CSS dans `src/css/input.css`.

- Les classes sont détectées automatiquement dans `public/` (HTML et JS, hors fichiers ignorés par git). Les noms de classes construits dynamiquement en JS doivent apparaître en entier dans le code.
- Le script CDN `cdn.tailwindcss.com` a été retiré : `public/css/style.css` (généré, ignoré par git) est la seule source de style.
- `hall-of-fame.html` et `association.html` surchargent la palette `meva-*` avec leurs propres variables CSS (`:root`), comme le faisait leur ancienne config inline.
