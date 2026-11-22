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
npm run serve       # démarre Firebase Hosting en local
npm run test:rules  # exécute les tests des règles de sécurité Firestore
```
