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
├── src/css/            # Fichiers sources Tailwind CSS
├── scripts/            # Scripts utilitaires (ex: bootstrap admin)
├── firebase.json       # Configuration Firebase
└── tailwind.config.js  # Configuration Tailwind

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

### 4. Lancer le projet

```bash
npm run dev:css     # compile Tailwind CSS en mode watch
npm run serve       # génère la config (prod) et démarre Firebase Hosting en local
npm run dev         # génère la config (dev) et lance les émulateurs Firebase (auth, firestore, database, hosting)
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
