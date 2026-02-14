import { MetadataStorage } from "../utils/MetadataStorage";
import { ColumnType, ColumnMetadata } from "../core/Types";

/**
 * Options pour le décorateur @Column
 */
export interface ColumnOptions {
  type?: ColumnType;
  name?: string;
  nullable?: boolean;
  unique?: boolean;
  defaultValue?: any;
}

/**
 * Décorateur de propriété pour définir une colonne
 * @param typeOrOptions - Type de colonne ou options complètes
 */
export function Column(typeOrOptions?: ColumnType | ColumnOptions): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propName = String(propertyKey);

    // Déterminer les options
    let options: ColumnOptions;
    if (typeof typeOrOptions === "string") {
      options = { type: typeOrOptions };
    } else {
      options = typeOrOptions || {};
    }

    // Inférer le type depuis TypeScript si non fourni
    const tsType = Reflect.getMetadata?.("design:type", target, propertyKey);
    if (!options.type && tsType) {
      options.type = inferSQLiteType(tsType.name);
    }

    const metadata: ColumnMetadata = {
      name: options.name || propName,
      type: options.type || "TEXT",
      nullable: options.nullable,
      unique: options.unique,
      defaultValue: options.defaultValue,
    };

    MetadataStorage.registerColumn(target, propName, metadata);
  };
}

/**
 * Décorateur pour marquer une colonne comme clé primaire
 */
export function PrimaryKey(autoIncrement: boolean = true): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propName = String(propertyKey);

    const metadata: ColumnMetadata = {
      name: propName,
      type: "INTEGER",
      primaryKey: true,
      autoIncrement,
      nullable: false,
    };

    MetadataStorage.registerColumn(target, propName, metadata);
  };
}

/**
 * Décorateur combiné pour ID auto-incrémenté
 */
export function AutoIncrement(): PropertyDecorator {
  return PrimaryKey(true);
}

/**
 * Décorateur pour colonne non nullable
 */
export function NotNull(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propName = String(propertyKey);
    
    // Récupérer ou créer les métadonnées
    const existing = MetadataStorage.getTableMetadata(target.constructor);
    const existingColumn = existing?.columns.get(propName);

    const metadata: ColumnMetadata = {
      ...(existingColumn || { name: propName, type: "TEXT" }),
      nullable: false,
    };

    MetadataStorage.registerColumn(target, propName, metadata);
  };
}

/**
 * Décorateur pour colonne unique
 */
export function Unique(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propName = String(propertyKey);
    
    const existing = MetadataStorage.getTableMetadata(target.constructor);
    const existingColumn = existing?.columns.get(propName);

    const metadata: ColumnMetadata = {
      ...(existingColumn || { name: propName, type: "TEXT" }),
      unique: true,
    };

    MetadataStorage.registerColumn(target, propName, metadata);
  };
}

/**
 * Décorateur pour définir une valeur par défaut
 */
export function Default(value: any): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propName = String(propertyKey);
    
    const existing = MetadataStorage.getTableMetadata(target.constructor);
    const existingColumn = existing?.columns.get(propName);

    const metadata: ColumnMetadata = {
      ...(existingColumn || { name: propName, type: "TEXT" }),
      defaultValue: value,
    };

    MetadataStorage.registerColumn(target, propName, metadata);
  };
}

/**
 * Inférer le type SQLite depuis le type TypeScript
 */
function inferSQLiteType(typeName: string): ColumnType {
  switch (typeName.toLowerCase()) {
    case "number":
      return "INTEGER";
    case "string":
      return "TEXT";
    case "boolean":
      return "INTEGER"; // SQLite n'a pas de type boolean natif
    default:
      return "TEXT";
  }
}
