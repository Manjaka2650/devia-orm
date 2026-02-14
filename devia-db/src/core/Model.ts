import { Database } from "./Database";
import { QueryBuilder } from "./QueryBuilder";
import {
  FindOptions,
  UpdateOptions,
  DestroyOptions,
  QueryResult,
} from "./Types";
import { MetadataStorage } from "../utils/MetadataStorage";

/**
 * Classe de base pour tous les modèles
 * T = Type des attributs du modèle (interface)
 */
export abstract class Model<T extends Record<string, any>> {
  /**
   * Nom de la table (doit être défini par @Table ou manuellement)
   */
  protected static tableName: string;

  /**
   * Instance de la base de données
   */
  protected static get db(): Database {
    return Database.getInstance();
  }

  /**
   * Obtenir le nom de la table pour cette classe
   */
  protected static getTableName<M extends typeof Model>(this: M): string {
    const metadata = MetadataStorage.getTableMetadata(this);
    if (metadata) {
      return metadata.tableName;
    }
    return this.tableName || this.name.toLowerCase();
  }

  /**
   * Trouver tous les enregistrements
   */
  public static async findAll<M extends typeof Model>(
    this: M,
    options?: FindOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<Array<InstanceType<M> extends Model<infer T> ? T : any>> {
    const tableName = this.getTableName();
    const { sql, params } = QueryBuilder.buildSelect(tableName, options || {});

    const result = await this.db.execute(sql, params);
    return result.rows as any[];
  }

  /**
   * Trouver un seul enregistrement
   */
  public static async findOne<M extends typeof Model>(
    this: M,
    options?: FindOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<(InstanceType<M> extends Model<infer T> ? T : any) | null> {
    const limitedOptions = { ...options, limit: 1 };
    const results = await this.findAll(limitedOptions);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Trouver par clé primaire
   */
  public static async findByPk<M extends typeof Model>(
    this: M,
    id: number | string
  ): Promise<(InstanceType<M> extends Model<infer T> ? T : any) | null> {
    return this.findOne({ where: { id } as any });
  }

  /**
   * Créer un nouvel enregistrement
   */
  public static async create<M extends typeof Model>(
    this: M,
    data: Omit<InstanceType<M> extends Model<infer T> ? T : any, "id"> & { id?: number }
  ): Promise<InstanceType<M> extends Model<infer T> ? T : any> {
    const tableName = this.getTableName();
    const { sql, params } = QueryBuilder.buildInsert(tableName, data);

    const result = await this.db.execute(sql, params);

    // Retourner l'objet créé avec l'ID inséré
    return {
      ...data,
      id: result.insertId,
    } as any;
  }

  /**
   * Mettre à jour des enregistrements
   */
  public static async update<M extends typeof Model>(
    this: M,
    data: Partial<InstanceType<M> extends Model<infer T> ? T : any>,
    options: UpdateOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<number> {
    const tableName = this.getTableName();
    const { sql, params } = QueryBuilder.buildUpdate(tableName, data, options);

    const result = await this.db.execute(sql, params);
    return result.rowsAffected || 0;
  }

  /**
   * Supprimer des enregistrements
   */
  public static async destroy<M extends typeof Model>(
    this: M,
    options: DestroyOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<number> {
    const tableName = this.getTableName();
    const { sql, params } = QueryBuilder.buildDelete(tableName, options);

    const result = await this.db.execute(sql, params);
    return result.rowsAffected || 0;
  }

  /**
   * Compter les enregistrements
   */
  public static async count<M extends typeof Model>(
    this: M,
    options?: FindOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<number> {
    const tableName = this.getTableName();
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    const params: any[] = [];

    if (options?.where) {
      const whereClause = (QueryBuilder as any).buildWhereClause(
        options.where,
        params
      );
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
    }

    const result = await this.db.execute(sql, params);
    return result.rows[0]?.count || 0;
  }

  /**
   * Synchroniser le modèle avec la base de données (créer la table)
   */
  public static async sync<M extends typeof Model>(
    this: M,
    options: { force?: boolean } = {}
  ): Promise<void> {
    const tableName = this.getTableName();
    const metadata = MetadataStorage.getTableMetadata(this);

    if (!metadata || metadata.columns.size === 0) {
      throw new Error(
        `No columns defined for model ${this.name}. Use @Column decorators.`
      );
    }

    // Supprimer la table si force = true
    if (options.force) {
      await this.db.execute(`DROP TABLE IF EXISTS ${tableName}`);
    }

    // Créer la table
    const columns = Array.from(metadata.columns.entries()).map(
      ([name, col]) => ({
        name: col.name || name,
        type: col.type,
        primaryKey: col.primaryKey,
        autoIncrement: col.autoIncrement,
        nullable: col.nullable,
        unique: col.unique,
        defaultValue: col.defaultValue,
      })
    );

    const createTableSql = QueryBuilder.buildCreateTable(tableName, columns);
    await this.db.execute(createTableSql);

    console.log(`[Model] Table ${tableName} synchronized`);
  }

  /**
   * Supprimer la table
   */
  public static async drop<M extends typeof Model>(this: M): Promise<void> {
    const tableName = this.getTableName();
    await this.db.execute(`DROP TABLE IF EXISTS ${tableName}`);
    console.log(`[Model] Table ${tableName} dropped`);
  }

  /**
   * Tronquer la table (supprimer tous les enregistrements)
   */
  public static async truncate<M extends typeof Model>(this: M): Promise<void> {
    const tableName = this.getTableName();
    await this.db.execute(`DELETE FROM ${tableName}`);
    console.log(`[Model] Table ${tableName} truncated`);
  }
}
