/**
 * Opérateurs pour les requêtes WHERE
 */
export type Operator = {
  $gt?: number;
  $lt?: number;
  $gte?: number;
  $lte?: number;
  $like?: string;
  $in?: any[];
  $ne?: any;
};

/**
 * Options WHERE avec support des opérateurs
 */
export type WhereOptions<T> = {
  [P in keyof T]?: T[P] | Operator;
};

/**
 * Options pour les requêtes find
 */
export type FindOptions<T> = {
  where?: WhereOptions<T>;
  limit?: number;
  offset?: number;
  order?: [keyof T, "ASC" | "DESC"][];
};

/**
 * Options pour les requêtes update
 */
export type UpdateOptions<T> = {
  where?: WhereOptions<T>;
};

/**
 * Options pour les requêtes destroy
 */
export type DestroyOptions<T> = {
  where?: WhereOptions<T>;
};

/**
 * Types de colonnes SQLite
 */
export type ColumnType = "INTEGER" | "TEXT" | "REAL" | "BLOB" | "NULL";

/**
 * Métadonnées d'une colonne
 */
export interface ColumnMetadata {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  nullable?: boolean;
  unique?: boolean;
  defaultValue?: any;
}

/**
 * Métadonnées d'une table
 */
export interface TableMetadata {
  tableName: string;
  columns: Map<string, ColumnMetadata>;
}

/**
 * Résultat d'exécution SQL
 */
export interface QueryResult {
  rows: any[];
  insertId?: number;
  rowsAffected?: number;
}
