import * as SQLite from "expo-sqlite";
import { QueryResult } from "./Types";

/**
 * Classe singleton pour gérer la base de données SQLite
 */
export class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase | null = null;
  private dbName: string = "app.db";

  private constructor() {}

  /**
   * Obtenir l'instance unique de Database
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Initialiser la base de données
   */
  public async initialize(dbName: string = "app.db"): Promise<void> {
    if (this.db) {
      return; // Déjà initialisé
    }

    this.dbName = dbName;
    this.db = await SQLite.openDatabaseAsync(dbName);
    console.log(`[Database] Initialized: ${dbName}`);
  }

  /**
   * Obtenir l'instance de la base de données
   */
  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call Database.getInstance().initialize() first.");
    }
    return this.db;
  }

  /**
   * Exécuter une requête SQL
   */
  public async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    const db = this.getDb();

    try {
      console.log(`[Database] Executing SQL: ${sql}`, params);

      // Pour les requêtes SELECT
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        const result = await db.getAllAsync(sql, params);
        return {
          rows: result as any[],
        };
      }

      // Pour les requêtes INSERT/UPDATE/DELETE
      const result = await db.runAsync(sql, params);

      return {
        rows: [],
        insertId: result.lastInsertRowId,
        rowsAffected: result.changes,
      };
    } catch (error) {
      console.error(`[Database] Error executing SQL: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Exécuter une requête SQL brute (pour debug)
   */
  public async executeRaw(sql: string, params: any[] = []): Promise<any> {
    return this.execute(sql, params);
  }

  /**
   * Exécuter plusieurs requêtes dans une transaction
   */
  public async transaction(callback: () => Promise<void>): Promise<void> {
    const db = this.getDb();

    try {
      await db.execAsync("BEGIN TRANSACTION");
      await callback();
      await db.execAsync("COMMIT");
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
  }

  /**
   * Fermer la base de données
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log(`[Database] Closed: ${this.dbName}`);
    }
  }

  /**
   * Supprimer toutes les tables (pour les tests)
   */
  public async dropAllTables(): Promise<void> {
    const result = await this.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    for (const row of result.rows) {
      await this.execute(`DROP TABLE IF EXISTS ${row.name}`);
    }

    console.log("[Database] All tables dropped");
  }
}
