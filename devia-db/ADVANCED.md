# 🚀 Guide Avancé - Fonctionnalités Bonus

Ce guide explique comment implémenter des fonctionnalités avancées dans expo-mini-orm.

## 🎣 Hooks (Lifecycle Events)

Les hooks permettent d'exécuter du code avant/après certaines opérations.

### Implémentation

```typescript
// src/core/Hooks.ts
export type HookCallback<T> = (instance: T) => void | Promise<void>;

export interface Hooks<T> {
  beforeCreate?: HookCallback<T>;
  afterCreate?: HookCallback<T>;
  beforeUpdate?: HookCallback<T>;
  afterUpdate?: HookCallback<T>;
  beforeDestroy?: HookCallback<T>;
  afterDestroy?: HookCallback<T>;
  beforeFind?: () => void | Promise<void>;
  afterFind?: (results: T[]) => void | Promise<void>;
}
```

### Utilisation

```typescript
@Table("users")
class User extends Model<UserAttributes> {
  // ... colonnes

  // Hooks
  static hooks: Hooks<UserAttributes> = {
    beforeCreate: async (user) => {
      // Hasher le mot de passe
      user.createdAt = new Date().toISOString();
      console.log("Before create:", user);
    },
    
    afterCreate: async (user) => {
      console.log("User created:", user.id);
      // Envoyer un email de bienvenue
    },
    
    beforeUpdate: async (user) => {
      user.updatedAt = new Date().toISOString();
    },
  };
}
```

### Modification du Model.ts

```typescript
// Dans Model.create()
public static async create<M extends typeof Model>(
  this: M,
  data: any
): Promise<any> {
  // Exécuter beforeCreate hook
  if ((this as any).hooks?.beforeCreate) {
    await (this as any).hooks.beforeCreate(data);
  }

  const tableName = this.getTableName();
  const { sql, params } = QueryBuilder.buildInsert(tableName, data);
  const result = await this.db.execute(sql, params);

  const created = { ...data, id: result.insertId };

  // Exécuter afterCreate hook
  if ((this as any).hooks?.afterCreate) {
    await (this as any).hooks.afterCreate(created);
  }

  return created;
}
```

## 🗑️ Soft Delete

Le soft delete permet de "supprimer" des enregistrements sans les supprimer physiquement.

### Implémentation

```typescript
// Ajouter une colonne deletedAt
@Table("users")
class User extends Model<UserAttributes> {
  @PrimaryKey()
  id!: number;

  @Column("TEXT")
  email!: string;

  @Column("TEXT")
  deletedAt?: string; // NULL = non supprimé

  // Options de soft delete
  static softDelete = true;
}

// Modifier les méthodes du Model
public static async destroy<M extends typeof Model>(
  this: M,
  options: DestroyOptions<any>
): Promise<number> {
  const tableName = this.getTableName();

  // Si soft delete est activé
  if ((this as any).softDelete) {
    return this.update(
      { deletedAt: new Date().toISOString() } as any,
      options
    );
  }

  // Sinon, suppression physique
  const { sql, params } = QueryBuilder.buildDelete(tableName, options);
  const result = await this.db.execute(sql, params);
  return result.rowsAffected || 0;
}

// Modifier findAll pour exclure les soft deleted
public static async findAll<M extends typeof Model>(
  this: M,
  options?: FindOptions<any>
): Promise<any[]> {
  // Si soft delete, ajouter where deletedAt IS NULL
  if ((this as any).softDelete) {
    options = {
      ...options,
      where: {
        ...options?.where,
        deletedAt: null,
      } as any,
    };
  }

  const tableName = this.getTableName();
  const { sql, params } = QueryBuilder.buildSelect(tableName, options || {});
  const result = await this.db.execute(sql, params);
  return result.rows;
}

// Méthode pour récupérer aussi les soft deleted
public static async findAllWithDeleted<M extends typeof Model>(
  this: M,
  options?: FindOptions<any>
): Promise<any[]> {
  const tableName = this.getTableName();
  const { sql, params } = QueryBuilder.buildSelect(tableName, options || {});
  const result = await this.db.execute(sql, params);
  return result.rows;
}

// Restaurer un soft deleted
public static async restore<M extends typeof Model>(
  this: M,
  options: UpdateOptions<any>
): Promise<number> {
  return this.update({ deletedAt: null } as any, options);
}
```

### Utilisation

```typescript
// Soft delete
await User.destroy({ where: { id: 1 } });
// Dans la DB: deletedAt = '2024-02-14T...'

// Restaurer
await User.restore({ where: { id: 1 } });
// Dans la DB: deletedAt = NULL

// Trouver avec les supprimés
const allUsers = await User.findAllWithDeleted();
```

## 🔗 Relations (Associations)

### HasMany / BelongsTo

```typescript
// src/core/Relations.ts
export type RelationType = "hasMany" | "belongsTo" | "hasOne";

export interface Relation {
  type: RelationType;
  model: typeof Model;
  foreignKey: string;
  as?: string;
}

// Décorateur HasMany
export function HasMany(
  model: () => typeof Model,
  foreignKey: string,
  as?: string
) {
  return function (target: any, propertyKey: string) {
    if (!target.constructor.relations) {
      target.constructor.relations = new Map();
    }
    target.constructor.relations.set(propertyKey, {
      type: "hasMany",
      model: model(),
      foreignKey,
      as: as || propertyKey,
    });
  };
}

// Décorateur BelongsTo
export function BelongsTo(
  model: () => typeof Model,
  foreignKey: string,
  as?: string
) {
  return function (target: any, propertyKey: string) {
    if (!target.constructor.relations) {
      target.constructor.relations = new Map();
    }
    target.constructor.relations.set(propertyKey, {
      type: "belongsTo",
      model: model(),
      foreignKey,
      as: as || propertyKey,
    });
  };
}
```

### Utilisation

```typescript
interface UserAttributes {
  id?: number;
  name: string;
}

interface AchatAttributes {
  id?: number;
  userId: number;
  montant: number;
}

@Table("users")
class User extends Model<UserAttributes> {
  @PrimaryKey()
  id!: number;

  @Column("TEXT")
  name!: string;

  @HasMany(() => Achat, "userId", "achats")
  achats?: AchatAttributes[];
}

@Table("achats")
class Achat extends Model<AchatAttributes> {
  @PrimaryKey()
  id!: number;

  @Column("INTEGER")
  userId!: number;

  @Column("REAL")
  montant!: number;

  @BelongsTo(() => User, "userId", "user")
  user?: UserAttributes;
}

// Méthode include dans Model
public static async findAll<M extends typeof Model>(
  this: M,
  options?: FindOptions<any> & { include?: string[] }
): Promise<any[]> {
  const results = await this.findAllBase(options);

  // Si include est spécifié, charger les relations
  if (options?.include && (this as any).relations) {
    for (const result of results) {
      for (const relationName of options.include) {
        const relation = (this as any).relations.get(relationName);
        if (relation) {
          if (relation.type === "hasMany") {
            result[relationName] = await relation.model.findAll({
              where: { [relation.foreignKey]: result.id },
            });
          } else if (relation.type === "belongsTo") {
            result[relationName] = await relation.model.findByPk(
              result[relation.foreignKey]
            );
          }
        }
      }
    }
  }

  return results;
}

// Utilisation
const users = await User.findAll({
  include: ["achats"],
});
// users[0].achats = [{ id: 1, montant: 100, ... }, ...]

const achats = await Achat.findAll({
  include: ["user"],
});
// achats[0].user = { id: 1, name: "John", ... }
```

## 💾 Transactions

```typescript
// Dans Database.ts - déjà implémenté
public async transaction(callback: () => Promise<void>): Promise<void> {
  const db = this.getDb();
  try {
    await db.execAsync("BEGIN TRANSACTION");
    await callback();
    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}

// Utilisation
await Database.getInstance().transaction(async () => {
  await User.create({ name: "John" });
  await Achat.create({ userId: 1, montant: 100 });
  // Si une erreur se produit, tout est annulé
});
```

## 🔍 Scopes (Requêtes prédéfinies)

```typescript
@Table("users")
class User extends Model<UserAttributes> {
  // ... colonnes

  // Scopes
  static scopes = {
    active: {
      where: { isActive: true },
    },
    adults: {
      where: { age: { $gte: 18 } },
    },
    recent: {
      order: [["createdAt", "DESC"] as [keyof UserAttributes, "ASC" | "DESC"]],
      limit: 10,
    },
  };

  // Méthode scope
  static scope(scopeName: string) {
    const scopeOptions = this.scopes[scopeName];
    if (!scopeOptions) {
      throw new Error(`Scope ${scopeName} not found`);
    }
    return {
      findAll: (options?: FindOptions<UserAttributes>) =>
        this.findAll({ ...scopeOptions, ...options }),
    };
  }
}

// Utilisation
const activeUsers = await User.scope("active").findAll();
const recentAdults = await User.scope("adults").findAll({
  order: [["createdAt", "DESC"]],
  limit: 5,
});
```

## 📊 Agrégations

```typescript
// Ajouter dans Model.ts
public static async sum<M extends typeof Model>(
  this: M,
  column: string,
  options?: FindOptions<any>
): Promise<number> {
  const tableName = this.getTableName();
  let sql = `SELECT SUM(${column}) as total FROM ${tableName}`;
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
  return result.rows[0]?.total || 0;
}

public static async avg<M extends typeof Model>(
  this: M,
  column: string,
  options?: FindOptions<any>
): Promise<number> {
  const tableName = this.getTableName();
  let sql = `SELECT AVG(${column}) as average FROM ${tableName}`;
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
  return result.rows[0]?.average || 0;
}

public static async min<M extends typeof Model>(
  this: M,
  column: string,
  options?: FindOptions<any>
): Promise<number> {
  const tableName = this.getTableName();
  let sql = `SELECT MIN(${column}) as minimum FROM ${tableName}`;
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
  return result.rows[0]?.minimum;
}

public static async max<M extends typeof Model>(
  this: M,
  column: string,
  options?: FindOptions<any>
): Promise<number> {
  const tableName = this.getTableName();
  let sql = `SELECT MAX(${column}) as maximum FROM ${tableName}`;
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
  return result.rows[0]?.maximum;
}

// Utilisation
const totalAchats = await Achat.sum("montant");
const avgAge = await User.avg("age");
const minPrice = await Product.min("price", {
  where: { category: "Electronics" },
});
const maxStock = await Product.max("stock");
```

## 🎯 Validation

```typescript
// src/core/Validation.ts
export interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

export function Validate(rules: ValidationRule[]): PropertyDecorator {
  return function (target: any, propertyKey: string) {
    if (!target.constructor.validations) {
      target.constructor.validations = new Map();
    }
    target.constructor.validations.set(propertyKey, rules);
  };
}

// Validators prédéfinis
export const Validators = {
  required: (): ValidationRule => ({
    validator: (value) => value !== null && value !== undefined && value !== "",
    message: "This field is required",
  }),
  
  email: (): ValidationRule => ({
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Invalid email format",
  }),
  
  minLength: (min: number): ValidationRule => ({
    validator: (value) => typeof value === "string" && value.length >= min,
    message: `Minimum length is ${min}`,
  }),
  
  min: (min: number): ValidationRule => ({
    validator: (value) => typeof value === "number" && value >= min,
    message: `Minimum value is ${min}`,
  }),
};

// Utilisation
@Table("users")
class User extends Model<UserAttributes> {
  @Validate([Validators.required(), Validators.email()])
  @Column("TEXT")
  email!: string;

  @Validate([Validators.required(), Validators.minLength(3)])
  @Column("TEXT")
  name!: string;

  @Validate([Validators.min(0)])
  @Column("INTEGER")
  age?: number;
}

// Dans Model.create(), valider avant insertion
public static async create<M extends typeof Model>(
  this: M,
  data: any
): Promise<any> {
  // Valider
  this.validate(data);

  // ... reste du code
}

private static validate(data: any): void {
  if (!this.validations) return;

  const errors: string[] = [];
  
  for (const [field, rules] of this.validations) {
    const value = data[field];
    for (const rule of rules) {
      if (!rule.validator(value)) {
        errors.push(`${field}: ${rule.message}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
}
```

## 🎨 Résumé

Ces fonctionnalités avancées transforment expo-mini-orm en une ORM puissante :

✅ **Hooks** - Logique avant/après opérations
✅ **Soft Delete** - Suppression sécurisée
✅ **Relations** - Associations entre modèles
✅ **Transactions** - Opérations atomiques
✅ **Scopes** - Requêtes réutilisables
✅ **Agrégations** - Statistiques faciles
✅ **Validation** - Données cohérentes

Vous avez maintenant une ORM complète pour Expo ! 🚀
