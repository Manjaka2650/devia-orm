import { MetadataStorage } from "../utils/MetadataStorage";

/**
 * Décorateur de classe pour définir le nom de la table
 * @param tableName - Nom de la table dans la base de données
 */
export function Table(tableName: string): ClassDecorator {
  return function (target: any) {
    MetadataStorage.registerTable(target, tableName);
    
    // Définir aussi la propriété statique tableName pour compatibilité
    target.tableName = tableName;
  };
}
