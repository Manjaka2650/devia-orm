/**
 * Expo Mini ORM
 * Une ORM TypeScript légère pour Expo SQLite
 */

// Core
export { Database } from "./core/Database";
export { Model } from "./core/Model";
export { QueryBuilder } from "./core/QueryBuilder";

// Types
export type {
  Operator,
  WhereOptions,
  FindOptions,
  UpdateOptions,
  DestroyOptions,
  ColumnType,
  ColumnMetadata,
  TableMetadata,
  QueryResult,
} from "./core/Types";

// Decorators
export { Table } from "./decorators/table";
export {
  Column,
  PrimaryKey,
  AutoIncrement,
  NotNull,
  Unique,
  Default,
} from "./decorators/column";
export type { ColumnOptions } from "./decorators/column";

// Utils
export { MetadataStorage } from "./utils/MetadataStorage";
