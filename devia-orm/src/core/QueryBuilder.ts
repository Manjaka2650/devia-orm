import { WhereOptions, FindOptions, UpdateOptions, DestroyOptions, Operator } from './Types';

/**
 * Classe pour creer les sql
 */

export class QueryBuilder {
  /**
   * Construire une requete SELECT
   * @param tableName nom de la table
   * @param options options de la requete
   * @param joins jointures
   * @returns sql et les parametres
   */
  public static buildSelect<T>(
    tableName: string,
    options: FindOptions<T> = {},
    joins: any[] = []
  ): { sql: string; params: any[] } {
    // BUG FIX: joins must come right after FROM, before WHERE/ORDER/LIMIT/OFFSET
    let sql = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

    if (joins.length > 0) {
      sql +=
        ' ' +
        joins
          .map((join) => {
            return `LEFT JOIN ${join.targetTable} AS ${join.as} ON ${join.sourceTable}.${join.targetKey} = ${join.as}.${join.foreignKey}`;
          })
          .join(' ');
    }

    if (options.where) {
      const whereClause = this.buildWhereClause(options.where, params);
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
    }

    if (options.order && options.order.length > 0) {
      const orderParts = options.order.map(([field, direction]) => `${String(field)} ${direction}`);
      sql += ` ORDER BY ${orderParts.join(', ')}`;
    }

    if (options.limit !== undefined) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset !== undefined) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }

    return { sql, params };
  }

  /**
   * Construire une requete INSERT
   * @param tableName nom de la table
   * @param data donnees a inserer
   * @returns sql et les parametres
   */
  public static buildInsert<T extends Record<string, any>>(
    tableName: string,
    data: T
  ): { sql: string; params: any[] } {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    return { sql, params: values };
  }

  /**
   * Construire une requete UPDATE
   * @param tableName nom de la table
   * @param data donnees a mettre a jour
   * @param options options de la requete
   * @returns sql et les parametres
   */
  public static buildUpdate<T extends Record<string, any>>(
    tableName: string,
    data: Partial<T>,
    options: UpdateOptions<T> = {}
  ): { sql: string; params: any[] } {
    const keys = Object.keys(data);
    const values = Object.values(data);
    if (keys.length === 0) throw new Error('No data to update');
    const setParts = keys.map((key) => `${key} = ?`);
    let sql = `UPDATE ${tableName} SET ${setParts.join(', ')}`;
    const params: any[] = [...values];
    if (options.where) {
      const whereClause = this.buildWhereClause(options.where, params);
      if (whereClause) sql += ` WHERE ${whereClause}`;
    }
    return { sql, params };
  }

  /**
   * Construire une requete DELETE
   * @param tableName nom de la table
   * @param options options de la requete
   * @returns sql et les parametres
   */
  public static buildDelete<T>(
    tableName: string,
    options: DestroyOptions<T> = {}
  ): { sql: string; params: any[] } {
    let sql = `DELETE FROM ${tableName}`;
    const params: any[] = [];
    if (options.where) {
      const whereClause = this.buildWhereClause(options.where, params);
      if (whereClause) sql += ` WHERE ${whereClause}`;
    }
    return { sql, params };
  }

  /**
   * Construire une clause WHERE
   * @param where options de la requete
   * @param params parametres de la requete
   * @returns clause WHERE
   */
  public static buildWhereClause<T>(where: WhereOptions<T>, params: any[]): string {
    const conditions: string[] = [];
    for (const [key, value] of Object.entries(where)) {
      if (value === null || value === undefined) {
        conditions.push(`${key} IS NULL`);
      } else if (this.isOperator(value)) {
        conditions.push(this.buildOperatorCondition(key, value as Operator, params));
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    return conditions.join(' AND ');
  }

  /**
   * Verifier si une valeur est un operateur
   * @param value valeur a verifier
   * @returns true si la valeur est un operateur, false sinon
   */
  private static isOperator(value: any): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      ('$gt' in value ||
        '$lt' in value ||
        '$gte' in value ||
        '$lte' in value ||
        '$like' in value ||
        '$in' in value ||
        '$ne' in value)
    );
  }

  /**
   * Construire une condition d'operateur
   * @param key cle de la condition
   * @param operator operateur
   * @param params parametres de la requete
   * @returns condition d'operateur
   */
  private static buildOperatorCondition(key: string, operator: Operator, params: any[]): string {
    const conditions: string[] = [];
    if (operator.$gt !== undefined) {
      conditions.push(`${key} > ?`);
      params.push(operator.$gt);
    }
    if (operator.$gte !== undefined) {
      conditions.push(`${key} >= ?`);
      params.push(operator.$gte);
    }
    if (operator.$lt !== undefined) {
      conditions.push(`${key} < ?`);
      params.push(operator.$lt);
    }
    if (operator.$lte !== undefined) {
      conditions.push(`${key} <= ?`);
      params.push(operator.$lte);
    }
    if (operator.$ne !== undefined) {
      conditions.push(`${key} != ?`);
      params.push(operator.$ne);
    }
    if (operator.$like !== undefined) {
      conditions.push(`${key} LIKE ?`);
      params.push(operator.$like);
    }
    if (operator.$in !== undefined) {
      const placeholders = operator.$in.map(() => '?').join(', ');
      conditions.push(`${key} IN (${placeholders})`);
      params.push(...operator.$in);
    }
    return conditions.join(' AND ');
  }

  /**
   * Construire une requete CREATE TABLE
   * @param tableName nom de la table
   * @param columns colonnes de la table
   * @returns sql de la requete
   */
  public static buildCreateTable(
    tableName: string,
    columns: Array<{
      name: string;
      type: string;
      primaryKey?: boolean;
      autoIncrement?: boolean;
      nullable?: boolean;
      unique?: boolean;
      defaultValue?: any;
    }>
  ): string {
    const columnDefs = columns.map((col) => {
      let def = `${col.name} ${col.type}`;
      if (col.primaryKey) {
        def += ' PRIMARY KEY';
        if (col.autoIncrement) def += ' AUTOINCREMENT';
      }
      if (col.nullable === false) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.defaultValue !== undefined) def += ` DEFAULT ${this.formatValue(col.defaultValue)}`;
      return def;
    });
    return `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(', ')})`;
  }

  /**
   * Formater une valeur pour SQL
   * @param value valeur a formater
   * @returns valeur formatee
   */
  private static formatValue(value: any): string {
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (value === null) return 'NULL';
    return String(value);
  }
}
