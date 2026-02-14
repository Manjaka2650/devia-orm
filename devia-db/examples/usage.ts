/**
 * EXEMPLE D'UTILISATION - expo-mini-orm
 * 
 * Ce fichier montre comment utiliser l'ORM dans une application Expo
 */

import { Database, Model, Table, Column, PrimaryKey, Unique, NotNull, Default } from "expo-mini-orm";

// ============================================================================
// 1. DÉFINITION DES INTERFACES
// ============================================================================

interface UserAttributes {
  id?: number;
  email: string;
  name: string;
  age?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface AchatAttributes {
  id?: number;
  montant: number;
  userId: number;
  description?: string;
  createdAt?: string;
}

interface ProductAttributes {
  id?: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

// ============================================================================
// 2. DÉFINITION DES MODÈLES
// ============================================================================

@Table("users")
class User extends Model<UserAttributes> {
  @PrimaryKey()
  id!: number;

  @Unique()
  @NotNull()
  @Column("TEXT")
  email!: string;

  @NotNull()
  @Column("TEXT")
  name!: string;

  @Column("INTEGER")
  age?: number;

  @Default(1)
  @Column("INTEGER")
  isActive!: boolean;

  @Column("TEXT")
  createdAt?: string;
}

@Table("achats")
class Achat extends Model<AchatAttributes> {
  @PrimaryKey()
  id!: number;

  @NotNull()
  @Column("REAL")
  montant!: number;

  @NotNull()
  @Column("INTEGER")
  userId!: number;

  @Column("TEXT")
  description?: string;

  @Column("TEXT")
  createdAt?: string;
}

@Table("products")
class Product extends Model<ProductAttributes> {
  @PrimaryKey()
  id!: number;

  @NotNull()
  @Column("TEXT")
  name!: string;

  @NotNull()
  @Column("REAL")
  price!: number;

  @Default(0)
  @Column("INTEGER")
  stock!: number;

  @Column("TEXT")
  category!: string;
}

// ============================================================================
// 3. INITIALISATION
// ============================================================================

async function initDatabase() {
  console.log("🚀 Initialisation de la base de données...");
  
  // Initialiser la connexion
  await Database.getInstance().initialize("myapp.db");
  
  // Synchroniser les modèles (créer les tables)
  await User.sync();
  await Achat.sync();
  await Product.sync();
  
  console.log("✅ Base de données initialisée");
}

// ============================================================================
// 4. EXEMPLES D'UTILISATION
// ============================================================================

async function exemplesCRUD() {
  console.log("\n📝 === EXEMPLES CREATE ===");
  
  // Créer des utilisateurs
  const user1 = await User.create({
    email: "john@example.com",
    name: "John Doe",
    age: 30,
    createdAt: new Date().toISOString(),
  });
  console.log("Utilisateur créé:", user1);

  const user2 = await User.create({
    email: "jane@example.com",
    name: "Jane Smith",
    age: 25,
    createdAt: new Date().toISOString(),
  });

  // Créer des achats
  const achat1 = await Achat.create({
    montant: 199.99,
    userId: user1.id!,
    description: "Achat de livres",
    createdAt: new Date().toISOString(),
  });
  console.log("Achat créé:", achat1);

  await Achat.create({
    montant: 49.99,
    userId: user1.id!,
    description: "Café",
    createdAt: new Date().toISOString(),
  });

  await Achat.create({
    montant: 299.99,
    userId: user2.id!,
    description: "Vêtements",
    createdAt: new Date().toISOString(),
  });

  // Créer des produits
  await Product.create({
    name: "iPhone 15",
    price: 999.99,
    stock: 50,
    category: "Electronics",
  });

  await Product.create({
    name: "MacBook Pro",
    price: 2499.99,
    stock: 20,
    category: "Electronics",
  });

  await Product.create({
    name: "T-Shirt",
    price: 29.99,
    stock: 100,
    category: "Clothing",
  });

  console.log("\n📖 === EXEMPLES READ ===");
  
  // Trouver tous les utilisateurs
  const allUsers = await User.findAll();
  console.log("Tous les utilisateurs:", allUsers);

  // Trouver avec WHERE
  const youngUsers = await User.findAll({
    where: { age: { $lt: 30 } },
  });
  console.log("Utilisateurs < 30 ans:", youngUsers);

  // Trouver un utilisateur
  const john = await User.findOne({
    where: { email: "john@example.com" },
  });
  console.log("John:", john);

  // Trouver par ID
  const userById = await User.findByPk(1);
  console.log("User ID 1:", userById);

  // Achats d'un utilisateur
  const achatsJohn = await Achat.findAll({
    where: { userId: user1.id! },
  });
  console.log("Achats de John:", achatsJohn);

  // Achats > 100€
  const grosAchats = await Achat.findAll({
    where: { montant: { $gt: 100 } },
    order: [["montant", "DESC"]],
  });
  console.log("Achats > 100€:", grosAchats);

  // Produits Electronics
  const electronics = await Product.findAll({
    where: { category: "Electronics" },
    order: [["price", "ASC"]],
  });
  console.log("Produits Electronics:", electronics);

  // Recherche LIKE
  const phones = await Product.findAll({
    where: { name: { $like: "%Phone%" } },
  });
  console.log("Produits 'Phone':", phones);

  console.log("\n✏️ === EXEMPLES UPDATE ===");
  
  // Mettre à jour un utilisateur
  const updated = await User.update(
    { age: 31 },
    { where: { id: user1.id! } }
  );
  console.log(`${updated} utilisateur(s) mis à jour`);

  // Vérifier la mise à jour
  const johnUpdated = await User.findByPk(user1.id!);
  console.log("John après update:", johnUpdated);

  // Mettre à jour le stock
  await Product.update(
    { stock: 45 },
    { where: { name: "iPhone 15" } }
  );

  console.log("\n🔢 === EXEMPLES COUNT ===");
  
  const totalUsers = await User.count();
  console.log("Nombre total d'utilisateurs:", totalUsers);

  const totalAchats = await Achat.count({
    where: { userId: user1.id! },
  });
  console.log("Nombre d'achats de John:", totalAchats);

  const expensiveProducts = await Product.count({
    where: { price: { $gt: 1000 } },
  });
  console.log("Produits > 1000€:", expensiveProducts);

  console.log("\n🗑️ === EXEMPLES DELETE ===");
  
  // Supprimer un achat
  const deleted = await Achat.destroy({
    where: { montant: { $lt: 50 } },
  });
  console.log(`${deleted} achat(s) supprimé(s)`);

  // Vérifier
  const remainingAchats = await Achat.findAll();
  console.log("Achats restants:", remainingAchats);
}

async function exemplesAvances() {
  console.log("\n🚀 === EXEMPLES AVANCÉS ===");
  
  // WHERE avec plusieurs conditions
  const complexQuery = await Product.findAll({
    where: {
      category: "Electronics",
      price: { $gte: 500, $lte: 1500 },
      stock: { $gt: 10 },
    },
    order: [["price", "DESC"]],
    limit: 5,
  });
  console.log("Requête complexe:", complexQuery);

  // IN operator
  const specificUsers = await User.findAll({
    where: {
      id: { $in: [1, 2] },
    },
  });
  console.log("Utilisateurs spécifiques:", specificUsers);

  // Pagination
  const page1 = await Product.findAll({
    limit: 2,
    offset: 0,
    order: [["name", "ASC"]],
  });
  console.log("Page 1:", page1);

  const page2 = await Product.findAll({
    limit: 2,
    offset: 2,
    order: [["name", "ASC"]],
  });
  console.log("Page 2:", page2);

  // Statistiques
  const allAchats = await Achat.findAll();
  const totalMontant = allAchats.reduce((sum, a) => sum + a.montant, 0);
  const avgMontant = totalMontant / allAchats.length;
  console.log("Montant total:", totalMontant);
  console.log("Montant moyen:", avgMontant);
}

// ============================================================================
// 5. FONCTION PRINCIPALE
// ============================================================================

export async function runExamples() {
  try {
    // Initialiser
    await initDatabase();

    // Nettoyer les données précédentes
    await User.truncate();
    await Achat.truncate();
    await Product.truncate();

    // Exécuter les exemples
    await exemplesCRUD();
    await exemplesAvances();

    console.log("\n✅ Tous les exemples exécutés avec succès !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

// Pour React Native / Expo
export { User, Achat, Product, initDatabase };
