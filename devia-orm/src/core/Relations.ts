import { Model } from './Model';

// src/core/Relations.ts
export type RelationType = 'hasMany' | 'belongsTo' | 'hasOne' | 'manyToMany';

export interface Relation {
  type: RelationType;
  model: typeof Model;
  foreignKey: string;
  targetKey: string; // usually "id"
  as: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}
