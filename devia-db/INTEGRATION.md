# 🔧 Guide d'intégration dans une app Expo

Ce guide vous montre comment intégrer expo-mini-orm dans votre application Expo/React Native.

## 📋 Prérequis

- Expo SDK 49+
- TypeScript configuré
- expo-sqlite installé

## 🚀 Installation

### 1. Installer les dépendances

```bash
npx expo install expo-sqlite
npm install expo-mini-orm
```

### 2. Configurer TypeScript

Modifiez votre `tsconfig.json` :

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    // ... autres options
  }
}
```

### 3. Installer reflect-metadata (optionnel mais recommandé)

```bash
npm install reflect-metadata
```

Puis dans votre fichier d'entrée (App.tsx) :

```typescript
import "reflect-metadata";
```

## 📁 Structure recommandée

```
src/
├── models/
│   ├── User.ts
│   ├── Achat.ts
│   ├── Product.ts
│   └── index.ts
├── database/
│   ├── config.ts
│   └── init.ts
└── App.tsx
```

## 🏗️ Configuration

### database/config.ts

```typescript
import { Database } from "expo-mini-orm";

export const DB_NAME = "myapp.db";

export async function initDatabase() {
  const db = Database.getInstance();
  await db.initialize(DB_NAME);
  console.log("Database initialized");
}
```

### models/User.ts

```typescript
import { Model, Table, Column, PrimaryKey, Unique, NotNull } from "expo-mini-orm";

export interface UserAttributes {
  id?: number;
  email: string;
  name: string;
  createdAt?: string;
}

@Table("users")
export class User extends Model<UserAttributes> {
  @PrimaryKey()
  id!: number;

  @Unique()
  @NotNull()
  @Column("TEXT")
  email!: string;

  @NotNull()
  @Column("TEXT")
  name!: string;

  @Column("TEXT")
  createdAt?: string;
}
```

### models/index.ts

```typescript
export { User } from "./User";
export { Achat } from "./Achat";
export { Product } from "./Product";

import { User } from "./User";
import { Achat } from "./Achat";
import { Product } from "./Product";

// Fonction pour synchroniser tous les modèles
export async function syncModels() {
  await User.sync();
  await Achat.sync();
  await Product.sync();
  console.log("All models synchronized");
}
```

## 🎯 Intégration dans App.tsx

### Version simple

```typescript
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { initDatabase } from "./database/config";
import { syncModels, User } from "./models";

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialiser la DB
        await initDatabase();
        
        // Synchroniser les modèles
        await syncModels();
        
        // Charger les données
        const allUsers = await User.findAll();
        setUsers(allUsers);
        
        setIsReady(true);
      } catch (error) {
        console.error("Error preparing app:", error);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Users: {users.length}</Text>
    </View>
  );
}
```

### Version avec Context API

```typescript
// database/DatabaseContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { initDatabase } from "./config";
import { syncModels } from "../models";

interface DatabaseContextType {
  isReady: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  error: null,
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        await syncModels();
        setIsReady(true);
      } catch (e) {
        setError(e as Error);
      }
    }

    prepare();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
```

```typescript
// App.tsx
import React from "react";
import { View, Text } from "react-native";
import { DatabaseProvider, useDatabase } from "./database/DatabaseContext";
import { MainScreen } from "./screens/MainScreen";

function AppContent() {
  const { isReady, error } = useDatabase();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading database...</Text>
      </View>
    );
  }

  return <MainScreen />;
}

export default function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
```

## 🎣 Hooks personnalisés

### useUsers.ts

```typescript
import { useState, useEffect } from "react";
import { User, UserAttributes } from "../models/User";

export function useUsers() {
  const [users, setUsers] = useState<UserAttributes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await User.findAll({
        order: [["createdAt", "DESC"]],
      });
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createUser(data: Omit<UserAttributes, "id">) {
    const user = await User.create(data);
    await loadUsers(); // Recharger
    return user;
  }

  async function updateUser(id: number, data: Partial<UserAttributes>) {
    await User.update(data, { where: { id } });
    await loadUsers();
  }

  async function deleteUser(id: number) {
    await User.destroy({ where: { id } });
    await loadUsers();
  }

  return {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    reload: loadUsers,
  };
}
```

### Utilisation du hook

```typescript
import React from "react";
import { View, Text, Button, FlatList } from "react-native";
import { useUsers } from "../hooks/useUsers";

export function UserListScreen() {
  const { users, loading, createUser, deleteUser } = useUsers();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <Button
        title="Add User"
        onPress={() =>
          createUser({
            email: `user${Date.now()}@example.com`,
            name: "New User",
            createdAt: new Date().toISOString(),
          })
        }
      />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name} - {item.email}</Text>
            <Button title="Delete" onPress={() => deleteUser(item.id!)} />
          </View>
        )}
      />
    </View>
  );
}
```

## 🔄 Migrations (manuel)

Pour changer le schéma de la base de données :

```typescript
// database/migrations.ts
import { Database } from "expo-mini-orm";

export async function runMigrations() {
  const db = Database.getInstance();

  // Migration 1: Ajouter une colonne
  try {
    await db.execute(`
      ALTER TABLE users ADD COLUMN phone TEXT
    `);
    console.log("Migration 1: Added phone column");
  } catch (error) {
    console.log("Migration 1 already applied");
  }

  // Migration 2: Créer une nouvelle table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      )
    `);
    console.log("Migration 2: Created settings table");
  } catch (error) {
    console.log("Migration 2 already applied");
  }
}
```

## 🧪 Tests

```typescript
// __tests__/models/User.test.ts
import { User } from "../../models/User";
import { initDatabase } from "../../database/config";

describe("User Model", () => {
  beforeAll(async () => {
    await initDatabase();
    await User.sync({ force: true });
  });

  it("should create a user", async () => {
    const user = await User.create({
      email: "test@example.com",
      name: "Test User",
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("test@example.com");
  });

  it("should find users", async () => {
    const users = await User.findAll();
    expect(users.length).toBeGreaterThan(0);
  });
});
```

## 📝 Bonnes pratiques

1. **Toujours initialiser la DB avant l'utilisation**
   ```typescript
   await Database.getInstance().initialize();
   ```

2. **Synchroniser les modèles au démarrage**
   ```typescript
   await Model.sync();
   ```

3. **Gérer les erreurs**
   ```typescript
   try {
     await User.create(data);
   } catch (error) {
     console.error("Failed to create user:", error);
   }
   ```

4. **Utiliser des hooks pour la logique de données**
   - Centralise la logique
   - Facilite les tests
   - Rend le code réutilisable

5. **Ne pas synchroniser en production avec force: true**
   ```typescript
   // ❌ Mauvais
   await User.sync({ force: true }); // Supprime les données !

   // ✅ Bon
   await User.sync(); // Crée seulement si n'existe pas
   ```

## 🚨 Débogage

Activer les logs SQL :

```typescript
// Dans Database.ts, la méthode execute() log déjà les requêtes
// Pour désactiver en production :
if (__DEV__) {
  console.log(`[SQL] ${sql}`, params);
}
```

## 📚 Ressources

- [Documentation Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [React Context API](https://react.dev/reference/react/useContext)

## 💡 Prochaines étapes

1. Implémenter les relations (hasMany, belongsTo)
2. Ajouter des hooks (beforeCreate, afterUpdate, etc.)
3. Implémenter le soft delete
4. Ajouter le support des transactions
5. Créer un système de migrations automatique
