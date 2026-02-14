import { TableMetadata, ColumnMetadata } from "../core/Types";

/**
 * Stockage global des métadonnées des modèles
 */
export class MetadataStorage {
  private static tables = new Map<string, TableMetadata>();

  /**
   * Enregistrer une table
   */
  public static registerTable(target: any, tableName: string): void {
    const className = target.name;

    if (!this.tables.has(className)) {
      this.tables.set(className, {
        tableName,
        columns: new Map(),
      });
    } else {
      const metadata = this.tables.get(className)!;
      metadata.tableName = tableName;
    }
  }

  /**
   * Enregistrer une colonne
   */
  public static registerColumn(
    target: any,
    propertyKey: string,
    metadata: ColumnMetadata
  ): void {
    const className = target.constructor.name;

    if (!this.tables.has(className)) {
      this.tables.set(className, {
        tableName: className.toLowerCase(),
        columns: new Map(),
      });
    }

    const tableMetadata = this.tables.get(className)!;
    tableMetadata.columns.set(propertyKey, metadata);
  }

  /**
   * Obtenir les métadonnées d'une table
   */
  public static getTableMetadata(target: any): TableMetadata | undefined {
    const className = typeof target === "function" ? target.name : target.constructor.name;
    return this.tables.get(className);
  }

  /**
   * Obtenir toutes les tables
   */
  public static getAllTables(): Map<string, TableMetadata> {
    return this.tables;
  }

  /**
   * Réinitialiser le stockage (pour les tests)
   */
  public static clear(): void {
    this.tables.clear();
  }
}
