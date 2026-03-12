import { Database } from './Database';
import { QueryBuilder } from './QueryBuilder';
import { FindOptions, UpdateOptions, DestroyOptions, IncludeOption } from './Types';
import { MetadataStorage } from '../utils/MetadataStorage';
import { Relation } from './Relations';

/**
 * Model class to build the models
 */
export abstract class Model<_T extends Record<string, any>> {
  /**
   * Table name
   */
  protected static tableName: string;

  /**
   * Database instance
   */
  protected static get db(): Database {
    return Database.getInstance();
  }

  /**
   * Relations
   */
  protected static relations?: Map<string, Relation>;

  /**
   * Get table name
   * @param this
   * @returns table name
   */
  protected static getTableName<M extends typeof Model>(this: M): string {
    const metadata = MetadataStorage.getTableMetadata(this);
    if (metadata) return metadata.tableName;
    return this.tableName || this.name.toLowerCase();
  }

  /**
   * Find all records
   * @param this
   * @param options
   * @returns
   */
  public static async findAll<M extends typeof Model>(
    this: M,
    options?: FindOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<Array<InstanceType<M> extends Model<infer T> ? T : any>> {
    const tableName = this.getTableName();
    const include = options?.include || [];
    const joins = this.buildJoins(include);
    const { sql, params } = QueryBuilder.buildSelect(tableName, options || {}, joins);
    const result = await this.db.execute(sql, params);
    return this.mapIncludes(result.rows, include);
  }

  /**
   * Map includes
   * @param rows
   * @param includes
   * @returns
   */
  private static mapIncludes(rows: any[], includes: IncludeOption[]) {
    if (!includes.length) return rows;
    return rows.map((row) => {
      const newRow = { ...row };
      for (const inc of includes) {
        const alias = inc.as!;
        newRow[alias] = this.extractNested(newRow, alias);
      }
      return newRow;
    });
  }

  /**
   * Extract nested
   * @param row
   * @param alias
   * @returns
   */
  private static extractNested(row: any, alias: string): any {
    const nested: any = {};
    for (const key of Object.keys(row)) {
      if (key.startsWith(alias + '_')) {
        const nestedKey = key.replace(alias + '_', '');
        nested[nestedKey] = row[key];
        delete row[key];
      }
    }
    return nested;
  }

  /**
   * Find one record
   * @param this
   * @param options
   * @returns
   */
  public static async findOne<M extends typeof Model>(
    this: M,
    options?: FindOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<(InstanceType<M> extends Model<infer T> ? T : any) | null> {
    const limitedOptions = { ...options, limit: 1 };
    const results = await this.findAll(limitedOptions);
    return results.length > 0 ? results[0]! : null;
  }

  /**
   * Find by primary key
   * @param this
   * @param id
   * @returns
   */
  public static async findByPk<M extends typeof Model>(
    this: M,
    id: number | string
  ): Promise<(InstanceType<M> extends Model<infer T> ? T : any) | null> {
    return this.findOne({ where: { id } as any });
  }

  /**
   * Create a new record
   * @param this
   * @param data
   * @returns
   */
  public static async create<M extends typeof Model>(
    this: M,
    data: Omit<InstanceType<M> extends Model<infer T> ? T : any, 'id'> & {
      id?: number | string;
    }
  ): Promise<InstanceType<M> extends Model<infer T> ? T : any> {
    const tableName = this.getTableName();
    const { sql, params } = QueryBuilder.buildInsert(tableName, data);
    const result = await this.db.execute(sql, params);
    return { ...data, id: result.insertId } as any;
  }

  /**
   * Update a record
   * @param this
   * @param data
   * @param options
   * @returns
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
   * Destroy a record
   * @param this
   * @param options
   * @returns
   */
  public static async destroy<M extends typeof Model>(
    this: M,
    options: DestroyOptions<any>
  ): Promise<number> {
    const tableName = this.getTableName();
    if ((this as any).softDelete) {
      return this.update({ deletedAt: new Date().toISOString() } as any, options);
    }
    const { sql, params } = QueryBuilder.buildDelete(tableName, options);
    const result = await this.db.execute(sql, params);
    return result.rowsAffected || 0;
  }

  /**
   * Count records
   * @param this
   * @param options
   * @returns
   */
  public static async count<M extends typeof Model>(
    this: M,
    options?: FindOptions<InstanceType<M> extends Model<infer T> ? T : any>
  ): Promise<number> {
    const tableName = this.getTableName();
    let sql = 'SELECT COUNT(*) as count FROM ' + tableName;
    const params: any[] = [];
    if (options?.where) {
      const whereClause = QueryBuilder.buildWhereClause(options.where, params);
      if (whereClause) sql += ' WHERE ' + whereClause;
    }
    const result = await this.db.execute(sql, params);
    return result.rows[0]?.count || 0;
  }

  /**
   * Sync table
   * @param this
   * @param options
   * @returns
   */
  public static async sync<M extends typeof Model>(
    this: M,
    options: { force?: boolean } = {}
  ): Promise<void> {
    const tableName = this.getTableName();
    const metadata = MetadataStorage.getTableMetadata(this);
    if (!metadata || metadata.columns.size === 0) {
      throw new Error('No columns defined for model ' + this.name + '. Use @Column decorators.');
    }
    if (options.force) {
      await this.db.execute('DROP TABLE IF EXISTS ' + tableName);
    }
    const columns = Array.from(metadata.columns.entries()).map(([name, col]) => ({
      name: col.name || name,
      type: col.type,
      primaryKey: col.primaryKey,
      autoIncrement: col.autoIncrement,
      nullable: col.nullable,
      unique: col.unique,
      defaultValue: col.defaultValue,
    }));
    const createTableSql = QueryBuilder.buildCreateTable(tableName, columns);
    await this.db.execute(createTableSql);
    console.log('[Model] Table ' + tableName + ' synchronized');
  }

  /**
   * Drop table
   * @param this
   * @returns
   */
  public static async drop<M extends typeof Model>(this: M): Promise<void> {
    const tableName = this.getTableName();
    await this.db.execute('DROP TABLE IF EXISTS ' + tableName);
    console.log('[Model] Table ' + tableName + ' dropped');
  }

  /**
   * Truncate table
   * @param this
   * @returns
   */
  public static async truncate<M extends typeof Model>(this: M): Promise<void> {
    const tableName = this.getTableName();
    await this.db.execute('DELETE FROM ' + tableName);
    console.log('[Model] Table ' + tableName + ' truncated');
  }

  /**
   * Has many relation
   * @param this
   * @param targetModel
   * @param options
   * @returns
   */
  public static hasMany(
    this: typeof Model,
    targetModel: typeof Model,
    options: {
      foreignKey: string;
      as?: string;
      targetKey?: string;
      onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    }
  ) {
    this.ensureOwnRelations();
    const alias = options.as || targetModel.name.toLowerCase();
    if (this.relations!.has(alias))
      throw new Error('Relation alias "' + alias + '" already exists on ' + this.name);
    this.validateRelation(targetModel, options.foreignKey);
    this.relations!.set(alias, {
      type: 'hasMany',
      model: targetModel,
      foreignKey: options.foreignKey,
      targetKey: options.targetKey || this.getPrimaryKey(),
      as: alias,
      onDelete: options.onDelete || 'RESTRICT',
    });
  }

  /**
   * Belongs to relation
   * @param this
   * @param targetModel
   * @param options
   * @returns
   */
  public static belongsTo(
    this: typeof Model,
    targetModel: typeof Model,
    options: {
      foreignKey: string;
      as?: string;
      targetKey?: string;
      onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    }
  ) {
    this.ensureOwnRelations();
    const alias = options.as || targetModel.name.toLowerCase();
    if (this.relations!.has(alias))
      throw new Error('Relation alias "' + alias + '" already exists on ' + this.name);
    this.relations!.set(alias, {
      type: 'belongsTo',
      model: targetModel,
      foreignKey: options.foreignKey,
      targetKey: options.targetKey || this.getPrimaryKey(),
      as: alias,
      onDelete: options.onDelete || 'RESTRICT',
    });
  }

  /**
   * Has one relation
   * @param this
   * @param targetModel
   * @param options
   * @returns
   */
  public static hasOne(
    this: typeof Model,
    targetModel: typeof Model,
    options: {
      foreignKey: string;
      as?: string;
      targetKey?: string;
      onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    }
  ) {
    this.ensureOwnRelations();
    const alias = options.as || targetModel.name.toLowerCase();
    if (this.relations!.has(alias))
      throw new Error('Relation alias "' + alias + '" already exists on ' + this.name);
    this.relations!.set(alias, {
      type: 'hasOne',
      model: targetModel,
      foreignKey: options.foreignKey,
      targetKey: options.targetKey || this.getPrimaryKey(),
      as: alias,
      onDelete: options.onDelete || 'RESTRICT',
    });
  }

  /**
   * Many to many relation
   * @param this
   * @param targetModel
   * @param options
   * @returns
   */
  public static manyToMany(
    this: typeof Model,
    targetModel: typeof Model,
    options: {
      foreignKey: string;
      as?: string;
      targetKey?: string;
      onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    }
  ) {
    this.ensureOwnRelations();
    const alias = options.as || targetModel.name.toLowerCase();
    if (this.relations!.has(alias))
      throw new Error('Relation alias "' + alias + '" already exists on ' + this.name);
    this.relations!.set(alias, {
      type: 'manyToMany',
      model: targetModel,
      foreignKey: options.foreignKey,
      targetKey: options.targetKey || this.getPrimaryKey(),
      as: alias,
      onDelete: options.onDelete || 'RESTRICT',
    });
  }

  private static ensureOwnRelations(this: typeof Model) {
    if (
      !Object.prototype.hasOwnProperty.call(this, 'relations') ||
      !(this.relations instanceof Map)
    ) {
      this.relations = new Map<string, Relation>();
    }
  }

  public static getRelations(this: typeof Model): Map<string, Relation> {
    this.ensureOwnRelations();
    return this.relations!;
  }

  public static getRelation(this: typeof Model, alias: string): Relation | undefined {
    this.ensureOwnRelations();
    return this.relations!.get(alias);
  }

  private static validateRelation(
    this: typeof Model,
    targetModel: typeof Model,
    foreignKey: string
  ) {
    const metadata = MetadataStorage.getTableMetadata(targetModel);
    if (!metadata || !metadata.columns.has(foreignKey)) {
      throw new Error(
        'Foreign key "' + foreignKey + '" does not exist on model ' + targetModel.name
      );
    }
  }

  protected static getPrimaryKey(this: typeof Model): string {
    const metadata = MetadataStorage.getTableMetadata(this);
    if (!metadata) throw new Error('No metadata found for model ' + this.name);
    const primaryColumn = Array.from(metadata.columns.values()).find((col) => col.primaryKey);
    if (!primaryColumn) throw new Error('Model ' + this.name + ' must define a primary key.');
    return primaryColumn.name;
  }

  private static buildJoins(this: typeof Model, includes: IncludeOption[], parentAlias?: string) {
    const joins: any[] = [];
    for (const inc of includes) {
      const alias = inc.as;
      if (!alias) throw new Error('Include must define "as"');
      const relation = this.getRelations().get(alias);
      if (!relation) throw new Error('Relation "' + alias + '" not found on model ' + this.name);
      joins.push({
        type: relation.type,
        sourceTable: parentAlias || this.getTableName(),
        targetTable: relation.model.getTableName(),
        foreignKey: relation.foreignKey,
        targetKey: relation.targetKey,
        as: alias,
      });
      if (inc.include) {
        joins.push(...relation.model.buildJoins(inc.include, alias));
      }
    }
    return joins;
  }
}
