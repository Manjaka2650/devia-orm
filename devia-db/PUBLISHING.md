# 📦 Guide de Publication

Ce guide explique comment publier expo-mini-orm sur npm et comment l'utiliser localement.

## 🔧 Utilisation locale (npm link)

Pour tester le package localement dans votre app Expo :

### 1. Dans le dossier expo-mini-orm

```bash
# Installer les dépendances
npm install

# Build le package
npm run build

# Créer un lien global
npm link
```

### 2. Dans votre app Expo

```bash
# Lier le package local
npm link expo-mini-orm
```

### 3. Utiliser normalement

```typescript
import { Database, Model, Table } from "expo-mini-orm";
```

### 4. Délier (quand vous avez terminé)

```bash
# Dans votre app
npm unlink expo-mini-orm

# Dans expo-mini-orm
npm unlink
```

## 📤 Publication sur npm

### Prérequis

1. Compte npm : https://www.npmjs.com/signup
2. Authentification : `npm login`

### Étapes

#### 1. Vérifier le package.json

```json
{
  "name": "expo-mini-orm", // Nom unique sur npm
  "version": "1.0.0", // Version sémantique
  "description": "Une ORM TypeScript légère pour Expo SQLite",
  "author": "Votre Nom <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/votre-username/expo-mini-orm.git"
  }
}
```

#### 2. Vérifier les fichiers à publier

```bash
# Voir ce qui sera publié
npm pack --dry-run

# Ou créer un tarball pour inspecter
npm pack
tar -xzf expo-mini-orm-1.0.0.tgz
```

#### 3. Build le package

```bash
npm run build
```

Vérifiez que le dossier `dist/` contient :
- `index.js` (CommonJS)
- `index.mjs` (ES Modules)
- `index.d.ts` (Types TypeScript)
- Autres fichiers compilés

#### 4. Tester localement

```bash
# Dans expo-mini-orm
npm pack

# Dans votre app de test
npm install /chemin/vers/expo-mini-orm-1.0.0.tgz
```

#### 5. Publier

```bash
# Première publication
npm publish

# Ou si c'est un package à scope (@votre-scope/expo-mini-orm)
npm publish --access public
```

#### 6. Vérifier la publication

- Visitez : https://www.npmjs.com/package/expo-mini-orm
- Testez : `npm install expo-mini-orm`

## 🔄 Mettre à jour une version

### Versioning (Semantic Versioning)

- **Patch** (1.0.0 → 1.0.1) : Bug fixes
- **Minor** (1.0.0 → 1.1.0) : Nouvelles fonctionnalités (rétrocompatibles)
- **Major** (1.0.0 → 2.0.0) : Breaking changes

### Commandes

```bash
# Patch (1.0.0 → 1.0.1)
npm version patch
npm publish

# Minor (1.0.0 → 1.1.0)
npm version minor
npm publish

# Major (1.0.0 → 2.0.0)
npm version major
npm publish
```

## 📋 Checklist avant publication

- [ ] Tests passent
- [ ] Build réussit (`npm run build`)
- [ ] README.md à jour
- [ ] CHANGELOG.md mis à jour
- [ ] Version incrémentée
- [ ] Git tag créé
- [ ] Repository public sur GitHub
- [ ] License ajoutée
- [ ] package.json complet
- [ ] .gitignore et .npmignore configurés

## 🏷️ Tags Git

```bash
# Créer un tag
git tag v1.0.0
git push origin v1.0.0

# Lister les tags
git tag

# Supprimer un tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

## 📊 Statistiques npm

Après publication, vous pouvez voir :

```bash
# Infos sur votre package
npm info expo-mini-orm

# Téléchargements
npm info expo-mini-orm downloads

# Versions disponibles
npm view expo-mini-orm versions
```

## 🔐 Sécurité

### Fichiers sensibles

Créez un `.npmignore` :

```
# Tests
__tests__/
*.test.ts
*.spec.ts

# Source (seul dist/ est publié)
src/

# Config
tsconfig.json
tsup.config.ts
.eslintrc
.prettierrc

# CI/CD
.github/
.gitlab-ci.yml

# Divers
*.log
.env
.DS_Store
```

### 2FA (Recommandé)

```bash
npm profile enable-2fa auth-and-writes
```

## 📝 CHANGELOG.md

Maintenez un changelog :

```markdown
# Changelog

## [1.0.0] - 2024-02-14

### Added
- Initial release
- Core Model class
- QueryBuilder
- Decorators (@Table, @Column, @PrimaryKey)
- Support des opérateurs ($gt, $lt, $like, $in)
- Documentation complète

## [1.1.0] - 2024-02-20

### Added
- Support des hooks (beforeCreate, afterCreate, etc.)
- Soft delete
- Relations (hasMany, belongsTo)

### Fixed
- Bug dans QueryBuilder avec LIKE

## [1.1.1] - 2024-02-21

### Fixed
- Typage TypeScript amélioré
- Performance des requêtes
```

## 🌐 GitHub Release

Créez une release sur GitHub pour chaque version :

1. Allez sur votre repo GitHub
2. Releases → Draft a new release
3. Tag version : v1.0.0
4. Release title : v1.0.0 - Initial Release
5. Description : Copiez depuis CHANGELOG.md
6. Publish release

## 📱 Badge npm

Ajoutez à votre README.md :

```markdown
[![npm version](https://badge.fury.io/js/expo-mini-orm.svg)](https://badge.fury.io/js/expo-mini-orm)
[![npm downloads](https://img.shields.io/npm/dm/expo-mini-orm.svg)](https://www.npmjs.com/package/expo-mini-orm)
```

## 🎯 Marketing

- Tweet sur @expo ou @reactnative
- Post sur Reddit r/reactnative
- Article de blog
- Vidéo démo
- Expo Discord/Forum

## 💡 Conseils

1. **Documentation** : Plus elle est claire, plus votre package sera utilisé
2. **Exemples** : Fournissez des exemples concrets
3. **Issues** : Répondez rapidement aux issues GitHub
4. **Versions** : Respectez le semantic versioning
5. **Tests** : Ajoutez des tests avant de publier
6. **CI/CD** : Automatisez le build et les tests

## 🚀 Prêt à publier !

```bash
# Dernière vérification
npm run typecheck
npm run build

# Publication
npm publish

# Success! 🎉
```

Votre package est maintenant disponible sur npm !

```bash
npm install expo-mini-orm
```

## 📞 Support

- Issues : https://github.com/votre-username/expo-mini-orm/issues
- Discussions : https://github.com/votre-username/expo-mini-orm/discussions
- Email : votre-email@example.com
