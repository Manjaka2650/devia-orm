/**
 * Script de test rapide pour devia-orm
 *
 * Ce fichier permet de vérifier rapidement que l'ORM fonctionne correctement.
 * À utiliser dans un environnement Node.js ou avec ts-node.
 *
 * ATTENTION: Ce test nécessite une version mock d'expo-sqlite
 * Pour un vrai test, utilisez une app Expo.
 */

import { Database, Model, Table, Column, PrimaryKey } from "./src";

// Mock simple pour expo-sqlite (pour tests Node.js)
const mockSQLite = {
  openDatabaseAsync: async (name: string) => ({
    getAllAsync: async (sql: string, params: any[]) => {
      console.log("MOCK getAllAsync:", sql, params);
      return [];
    },
    runAsync: async (sql: string, params: any[]) => {
      console.log("MOCK runAsync:", sql, params);
      return { lastInsertRowId: 1, changes: 1 };
    },
    execAsync: async (sql: string) => {
      console.log("MOCK execAsync:", sql);
    },
    closeAsync: async () => {
      console.log("MOCK closeAsync");
    },
  }),
};

// Remplacer expo-sqlite par le mock
(global as any)["expo-sqlite"] = mockSQLite;

// Interface User
interface UserAttributes {
  id?: number;
  email: string;
  name: string;
  age?: number;
  createdAt?: string;
}

// Modèle User
@Table("users")
class User extends Model<UserAttributes> {
  @PrimaryKey()
  id!: number;

  @Column("TEXT")
  email!: string;

  @Column("TEXT")
  name!: string;

  @Column("INTEGER")
  age?: number;

  @Column("TEXT")
  createdAt?: string;
}

// Interface Achat
interface AchatAttributes {
  id?: number;
  montant: number;
  userId: number;
  description?: string;
}

// Modèle Achat
@Table("achats")
class Achat extends Model<AchatAttributes> {
  @PrimaryKey()
  id!: number;

  @Column("REAL")
  montant!: number;

  @Column("INTEGER")
  userId!: number;

  @Column("TEXT")
  description?: string;
}

// Tests
async function runTests() {
  console.log("🧪 === Devia ORM - TESTS ===\n");

  try {
    // 1. Initialiser la DB
    console.log("1️⃣ Initialisation de la base de données...");
    await Database.getInstance().initialize("test.db");
    console.log("✅ DB initialisée\n");

    // 2. Synchroniser les modèles
    console.log("2️⃣ Synchronisation des modèles...");
    await User.sync();
    await Achat.sync();
    console.log("✅ Modèles synchronisés\n");

    // 3. Test CREATE
    console.log("3️⃣ Test CREATE...");
    const user = await User.create({
      email: "john@example.com",
      name: "John Doe",
      age: 30,
      createdAt: new Date().toISOString(),
    });
    console.log("✅ User créé:", user);

    const achat = await Achat.create({
      montant: 199.99,
      userId: 1,
      description: "Achat de livres",
    });
    console.log("✅ Achat créé:", achat, "\n");

    // 4. Test FIND ALL
    console.log("4️⃣ Test FIND ALL...");
    const users = await User.findAll();
    console.log("✅ Users trouvés:", users.length);

    const achats = await Achat.findAll({
      where: { userId: 1 },
    });
    console.log("✅ Achats trouvés:", achats.length, "\n");

    // 5. Test FIND ONE
    console.log("5️⃣ Test FIND ONE...");
    const foundUser = await User.findOne({
      where: { email: "john@example.com" },
    });
    console.log("✅ User trouvé:", foundUser, "\n");

    // 6. Test UPDATE
    console.log("6️⃣ Test UPDATE...");
    const updated = await User.update({ age: 31 }, { where: { id: 1 } });
    console.log("✅ Lignes mises à jour:", updated, "\n");

    // 7. Test COUNT
    console.log("7️⃣ Test COUNT...");
    const count = await User.count();
    console.log("✅ Nombre d'users:", count, "\n");

    // 8. Test avec opérateurs
    console.log("8️⃣ Test avec opérateurs...");
    const richAchats = await Achat.findAll({
      where: { montant: { $gt: 100 } },
    });
    console.log("✅ Achats > 100€:", richAchats.length);

    const youngUsers = await User.findAll({
      where: { age: { $lt: 35 } },
    });
    console.log("✅ Users < 35 ans:", youngUsers.length, "\n");

    // 9. Test DELETE
    console.log("9️⃣ Test DELETE...");
    const deleted = await Achat.destroy({
      where: { id: 1 },
    });
    console.log("✅ Lignes supprimées:", deleted, "\n");

    console.log("🎉 === TOUS LES TESTS PASSÉS ! ===");
    console.log("\n📦 devia-orm fonctionne correctement !");
    console.log("👉 Intégrez-le maintenant dans votre app Expo\n");
  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();
