/**
 * TypeScript types for Chaim Blueprint (.bprint) schema format
 * Based on the official JSON schema specification
 */
export interface SchemaData {
  schemaVersion: string;
  namespace: string;
  description: string;
  entity: Entity;
}

export interface Entity {
  primaryKey: PrimaryKey;
  fields: Field[];
  annotations?: Record<string, any>;
}

export interface PrimaryKey {
  partitionKey: string;
  sortKey?: string;
}

export interface Field {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'timestamp';
  required?: boolean;
  default?: string | number | boolean;
  enum?: string[];
  description?: string;
  annotations?: Record<string, any>;
}
