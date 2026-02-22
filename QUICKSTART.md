# Démarrage Rapide - devia-orm

## Structure du Projet

```
devia-orm/
├── src/
│   ├── core/
│   │   ├── Database.ts       ✅ Gestion SQLite
│   │   ├── Model.ts          ✅ Classe de base
│   │   ├── QueryBuilder.ts   ✅ Générateur SQL
│   │   └── Types.ts          ✅ Types TypeScript
│   ├── decorators/
│   │   ├── table.ts          ✅ @Table
│   │   └── column.ts         ✅ @Column, @PrimaryKey, etc.
│   ├── utils/
│   │   └── MetadataStorage.ts ✅ Stockage métadonnées
│   └── index.ts              ✅ Exports principaux
├── examples/
│   └── usage.ts              ✅ Exemples complets
├── README.md                 ✅ Documentation
├── INTEGRATION.md            ✅ Guide d'intégration
├── ADVANCED.md               ✅ Fonctionnalités bonus
├── PUBLISHING.md             ✅ Guide de publication
├── package.json              ✅ Configuration npm
├── tsconfig.json             ✅ Configuration TypeScript
└── tsup.config.ts            ✅ Configuration build
```

### ✅ Core Features

- [x] Classe Model générique
- [x] CRUD complet (Create, Read, Update, Delete)
- [x] QueryBuilder automatique
- [x] Typage TypeScript avancé
- [x] Support des décorateurs
- [x] Auto-génération des tables

### ✅ Query Features

- [x] `findAll()`, `findOne()`, `findByPk()`
- [x] `create()`, `update()`, `destroy()`
- [x] `count()`, `truncate()`
- [x] WHERE avec conditions multiples
- [x] ORDER BY, LIMIT, OFFSET
- [x] Opérateurs: $gt, $lt, $gte, $lte, $like, $in, $ne

### ✅ Decorators

- [x] `@Table(name)` - Nom de table
- [x] `@Column(type)` - Définir colonne
- [x] `@PrimaryKey()` - Clé primaire
- [x] `@AutoIncrement()` - Auto-increment
- [x] `@NotNull()` - Non nullable
- [x] `@Unique()` - Contrainte unique
- [x] `@Default(value)` - Valeur par défaut

## 🎯 Exemple d'Utilisation Rapide

```typescript
import { Database, Model, Table, Column, PrimaryKey } from "devia-orm";

// 1. Définir le modèle
interface UserAttributes {
  id?: number;
  email: string;
  name: string;
}

@Table("users")
class User extends Model<UserAttributes> {
  @PrimaryKey()
  id!: number;

  @Column("TEXT")
  email!: string;

  @Column("TEXT")
  name!: string;
}

// 2. Initialiser
await Database.getInstance().initialize("app.db");
await User.sync();

// 3. Utiliser !
const user = await User.create({
  email: "john@example.com",
  name: "John Doe",
});

const users = await User.findAll({
  where: { name: { $like: "%John%" } },
  order: [["name", "ASC"]],
  limit: 10,
});
```

## Prochaines Étapes

### Option 1 : Tester Localement

```bash
# Dans devia-orm/
npm install
npm run build
npm link

# Dans votre app Expo
npm link devia-orm
```

Voir `INTEGRATION.md` pour le guide complet.

### Option 2 : Publier sur npm

```bash
# Build
npm run build

# Publier
npm publish
```

Voir `PUBLISHING.md` pour le guide complet.

## 📖 Documentation Disponible

| Fichier             | Description                          |
| ------------------- | ------------------------------------ |
| `README.md`         | Documentation générale et API        |
| `INTEGRATION.md`    | Comment intégrer dans une app Expo   |
| `ADVANCED.md`       | Hooks, Relations, Transactions, etc. |
| `PUBLISHING.md`     | Comment publier sur npm              |
| `examples/usage.ts` | Exemples d'utilisation complets      |

## 🎓 Tutoriel Complet

### Étape 1 : Définir vos modèles

```typescript
// models/User.ts
interface UserAttributes {
  id?: number;
  email: string;
  name: string;
  age?: number;
  createdAt?: string;
}

@Table("users")
class User extends Model<UserAttributes> {
  @PrimaryKey()
  id!: number;

  @Unique()
  @NotNull()
  @Column("TEXT")
  email!: string;

  @Column("TEXT")
  name!: string;

  @Column("INTEGER")
  age?: number;

  @Column("TEXT")
  createdAt?: string;
}
```

### Étape 2 : Initialiser dans App.tsx

```typescript
import { Database } from "devia-orm";
import { User } from "./models/User";

export default function App() {
  useEffect(() => {
    async function init() {
      await Database.getInstance().initialize("myapp.db");
      await User.sync();
    }
    init();
  }, []);

  // ...
}
```

### Étape 3 : Utiliser dans vos composants

```typescript
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await User.findAll({
        order: [["name", "ASC"]],
      });
      setUsers(data);
    }
    load();
  }, []);

  const createUser = async () => {
    await User.create({
      email: "new@example.com",
      name: "New User",
      createdAt: new Date().toISOString(),
    });
    // Recharger...
  };

  return (
    <View>
      <Button title="Add User" onPress={createUser} />
      <FlatList
        data={users}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </View>
  );
}
```

## Fonctionnalités Avancées (Optionnel)

Implémentez si besoin (voir `ADVANCED.md`) :

- ⚡ Hooks (beforeCreate, afterUpdate)
- 🗑️ Soft Delete
- 🔗 Relations (hasMany, belongsTo)
- 💾 Transactions
- 🔍 Scopes (requêtes prédéfinies)
- 📊 Agrégations (sum, avg, min, max)
- ✅ Validation

## 💡 Comparaison avec Sequelize

| Feature         | Sequelize                 | devia-orm            |
| --------------- | ------------------------- | -------------------- |
| Plateforme      | Node.js                   | Expo/React Native    |
| Base de données | PostgreSQL, MySQL, SQLite | Expo SQLite          |
| Taille          | ~500KB                    | ~20KB                |
| Syntaxe         | `Model.findAll()`         | `Model.findAll()` ✅ |
| Décorateurs     | ❌                        | ✅                   |
| TypeScript      | Partiel                   | Full ✅              |
| Relations       | ✅                        | ⚠️ À implémenter     |
| Migrations      | ✅                        | ⚠️ Manuel            |

## 🎯 Cas d'Usage

### 1. App de Todo List

```typescript
@Table("todos")
class Todo extends Model<TodoAttributes> {
  @PrimaryKey() id!: number;
  @Column("TEXT") title!: string;
  @Column("INTEGER") completed!: boolean;
}

// Trouver non-complétés
const todos = await Todo.findAll({
  where: { completed: 0 },
});
```

### 2. App de Budget

```typescript
@Table("expenses")
class Expense extends Model<ExpenseAttributes> {
  @PrimaryKey() id!: number;
  @Column("REAL") amount!: number;
  @Column("TEXT") category!: string;
}

// Total par catégorie
const totalFood = await Expense.sum("amount", {
  where: { category: "Food" },
});
```

### 3. App de Contacts

```typescript
@Table("contacts")
class Contact extends Model<ContactAttributes> {
  @PrimaryKey() id!: number;
  @Column("TEXT") name!: string;
  @Column("TEXT") phone!: string;
}

// Recherche
const results = await Contact.findAll({
  where: { name: { $like: "%John%" } },
});
```

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev           # Watch mode
npm run build         # Build production
npm run typecheck     # Vérifier types

# Tests
npm run test          # Lancer les tests (à implémenter)

# Publication
npm version patch     # Incrémenter version
npm publish           # Publier sur npm
```

## 📞 Support et Ressources

- 📖 [Documentation complète](./README.md)
- 🔧 [Guide d'intégration](./INTEGRATION.md)
- [Fonctionnalités avancées](./ADVANCED.md)
- [Guide de publication](./PUBLISHING.md)
- 💡 [Exemples](./examples/usage.ts)

## 🎉 Félicitations !

Vous avez créé une ORM TypeScript complète pour Expo SQLite !

**Prêt à l'utiliser dans votre app Expo ?**
→ Consultez `INTEGRATION.md`

**Prêt à la publier sur npm ?**
→ Consultez `PUBLISHING.md`

**Besoin de fonctionnalités avancées ?**
→ Consultez `ADVANCED.md`

---

Made with ❤️ for the Expo community
