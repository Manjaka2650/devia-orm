import {
  WhereOptions,
  FindOptions,
  UpdateOptions,
  DestroyOptions,
  Operator,
} from "./Types";

/**
 * Classe pour construire des requêtes SQL
 */
export class QueryBuilder {
  /**
   * Construire une requête SELECT
   */
  public static buildSelect<T>(
    tableName: string,
    options: FindOptions<T> = {}
  ): { sql: string; params: any[] } {
    let sql = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

    // WHERE clause
    if (options.where) {
      const whereClause = this.buildWhereClause(options.where, params);
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
    }

    // ORDER BY clause
    if (options.order && options.order.length > 0) {
      const orderParts = options.order.map(([field, direction]) => {
        return `${String(field)} ${direction}`;
      });
      sql += ` ORDER BY ${orderParts.join(", ")}`;
    }

    // LIMIT clause
    if (options.limit !== undefined) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    // OFFSET clause
    if (options.offset !== undefined) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }

    return { sql, params };
  }

  /**
   * Construire une requête INSERT
   */
  public static buildInsert<T extends Record<string, any>>(
    tableName: string,
    data: T
  ): { sql: string; params: any[] } {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const columns = keys.join(", ");
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

    return { sql, params: values };
  }

  /**
   * Construire une requête UPDATE
   */
  public static buildUpdate<T extends Record<string, any>>(
    tableName: string,
    data: Partial<T>,
    options: UpdateOptions<T> = {}
  ): { sql: string; params: any[] } {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) {
      throw new Error("No data to update");
    }

    const setParts = keys.map((key) => `${key} = ?`);
    let sql = `UPDATE ${tableName} SET ${setParts.join(", ")}`;

    const params: any[] = [...values];

    // WHERE clause
    if (options.where) {
      const whereClause = this.buildWhereClause(options.where, params);
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
    }

    return { sql, params };
  }

  /**
   * Construire une requête DELETE
   */
  public static buildDelete<T>(
    tableName: string,
    options: DestroyOptions<T> = {}
  ): { sql: string; params: any[] } {
    let sql = `DELETE FROM ${tableName}`;
    const params: any[] = [];

    // WHERE clause
    if (options.where) {
      const whereClause = this.buildWhereClause(options.where, params);
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
    }

    return { sql, params };
  }

  /**
   * Construire la clause WHERE
   */
  private static buildWhereClause<T>(
    where: WhereOptions<T>,
    params: any[]
  ): string {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(where)) {
      if (value === null || value === undefined) {
        conditions.push(`${key} IS NULL`);
      } else if (this.isOperator(value)) {
        // Gérer les opérateurs
        const operatorConditions = this.buildOperatorCondition(
          key,
          value as Operator,
          params
        );
        conditions.push(operatorConditions);
      } else {
        // Égalité simple
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }

    return conditions.join(" AND ");
  }

  /**
   * Vérifier si une valeur est un opérateur
   */
  private static isOperator(value: any): boolean {
    return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      (value.$gt !== undefined ||
        value.$lt !== undefined ||
        value.$gte !== undefined ||
        value.$lte !== undefined ||
        value.$like !== undefined ||
        value.$in !== undefined ||
        value.$ne !== undefined)
    );
  }

  /**
   * Construire une condition avec opérateur
   */
  private static buildOperatorCondition(
    key: string,
    operator: Operator,
    params: any[]
  ): string {
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
      const placeholders = operator.$in.map(() => "?").join(", ");
      conditions.push(`${key} IN (${placeholders})`);
      params.push(...operator.$in);
    }

    return conditions.join(" AND ");
  }

  /**
   * Construire une requête CREATE TABLE
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
        def += " PRIMARY KEY";
        if (col.autoIncrement) {
          def += " AUTOINCREMENT";
        }
      }

      if (col.nullable === false) {
        def += " NOT NULL";
      }

      if (col.unique) {
        def += " UNIQUE";
      }

      if (col.defaultValue !== undefined) {
        def += ` DEFAULT ${this.formatValue(col.defaultValue)}`;
      }

      return def;
    });

    return `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(", ")})`;
  }

  /**
   * Formater une valeur pour SQL
   */
  private static formatValue(value: any): string {
    if (typeof value === "string") {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (value === null) {
      return "NULL";
    }
    return String(value);
  }
}
