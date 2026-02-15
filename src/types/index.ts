/**
 * TypeScript types for Chaim Blueprint (.bprint) schema format
 * Based on the official JSON schema specification
 */
export interface SchemaData {
  schemaVersion: number;
  entityName: string;
  description: string;
  primaryKey: PrimaryKey;
  fields: Field[];
}

export interface PrimaryKey {
  partitionKey: string;
  sortKey?: string;
}

/**
 * Scalar types map to simple language primitives.
 * Collection types (list, map, stringSet, numberSet) require additional metadata.
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'timestamp'
  | 'list'
  | 'map'
  | 'stringSet'
  | 'numberSet';

export interface Field {
  name: string;
  nameOverride?: string;
  type: FieldType;
  required?: boolean;
  default?: string | number | boolean;
  enum?: string[];
  description?: string;
  constraints?: FieldConstraints;
  annotations?: FieldAnnotations;
  /** Element type definition (required when type is 'list') */
  items?: ListItems;
  /** Nested field definitions (required when type is 'map') */
  fields?: NestedField[];
}

/**
 * Element type definition for list fields.
 * When items.type is 'map', items.fields defines the map structure.
 */
export interface ListItems {
  type: 'string' | 'number' | 'boolean' | 'timestamp' | 'map';
  /** Nested fields when items type is 'map' */
  fields?: NestedField[];
}

/**
 * Simplified field definition for nested map structures.
 * Only name and type -- no constraints, annotations, or other metadata.
 */
export interface NestedField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'timestamp';
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
