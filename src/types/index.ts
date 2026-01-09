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
  constraints?: FieldConstraints;
  annotations?: FieldAnnotations;
}

/**
 * Field-level validation constraints
 */
export interface FieldConstraints {
  // String constraints
  /** Minimum string length (applies to string type) */
  minLength?: number;
  /** Maximum string length (applies to string type) */
  maxLength?: number;
  /** Regex pattern for validation (applies to string type) */
  pattern?: string;

  // Number constraints
  /** Minimum value (applies to number type) */
  min?: number;
  /** Maximum value (applies to number type) */
  max?: number;
}

/**
 * Field-level metadata annotations (extensible)
 */
export interface FieldAnnotations {
  /** Additional custom annotations */
  [key: string]: unknown;
}
