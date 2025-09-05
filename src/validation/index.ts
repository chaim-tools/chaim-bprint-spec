import { SchemaData, Entity, PrimaryKey, Field } from '../types';

/**
 * Validates a schema object against the official chaim-bprint-spec
 */
export function validateSchema(schema: any): SchemaData {
  // Validate top-level required fields
  if (!schema.schemaVersion) {
    throw new Error('Schema must include schemaVersion field');
  }
  if (!schema.namespace) {
    throw new Error('Schema must include namespace field');
  }
  if (!schema.description) {
    throw new Error('Schema must include description field');
  }
  if (!schema.entity) {
    throw new Error('Schema must include entity field');
  }

  // Validate entity structure
  const entity = validateEntity(schema.entity);

  // Return validated schema
  return {
    schemaVersion: schema.schemaVersion,
    namespace: schema.namespace,
    description: schema.description,
    entity,
  };
}

function validateEntity(entity: any): Entity {
  if (!entity.primaryKey) {
    throw new Error('Entity must include primaryKey field');
  }
  if (!Array.isArray(entity.fields) || entity.fields.length === 0) {
    throw new Error('Entity must include fields array with at least one field');
  }

  const primaryKey = validatePrimaryKey(entity.primaryKey);
  const fields = validateFields(entity.fields);

  return {
    primaryKey,
    fields,
    annotations: entity.annotations,
  };
}

function validatePrimaryKey(primaryKey: any): PrimaryKey {
  if (!primaryKey.partitionKey || typeof primaryKey.partitionKey !== 'string') {
    throw new Error('PrimaryKey must include partitionKey as a string');
  }

  return {
    partitionKey: primaryKey.partitionKey,
    sortKey: primaryKey.sortKey,
  };
}

function validateFields(fields: any[]): Field[] {
  const validatedFields: Field[] = [];
  const fieldNames = new Set<string>();

  for (const field of fields) {
    if (!field.name || typeof field.name !== 'string') {
      throw new Error('Field must include name as a string');
    }
    if (!field.type || !['string', 'number', 'boolean', 'timestamp'].includes(field.type)) {
      throw new Error(`Field '${field.name}' must have a valid type: string, number, boolean, or timestamp`);
    }

    // Check for duplicate field names
    if (fieldNames.has(field.name)) {
      throw new Error(`Duplicate field name: ${field.name}`);
    }
    fieldNames.add(field.name);

    // Validate enum values if present
    if (field.enum && (!Array.isArray(field.enum) || field.enum.length === 0)) {
      throw new Error(`Field '${field.name}' enum must be a non-empty array`);
    }

    // Validate default value type matches field type
    if (field.default !== undefined) {
      const isValidDefault = validateDefaultValue(field.default, field.type);
      if (!isValidDefault) {
        throw new Error(`Field '${field.name}' default value type does not match field type`);
      }
    }

    validatedFields.push({
      name: field.name,
      type: field.type,
      required: field.required ?? false,
      default: field.default,
      enum: field.enum,
      description: field.description,
      annotations: field.annotations,
    });
  }

  return validatedFields;
}

/**
 * Validates that default value type matches field type
 */
function validateDefaultValue(defaultValue: any, fieldType: string): boolean {
  switch (fieldType) {
    case 'string':
      return typeof defaultValue === 'string';
    case 'number':
      return typeof defaultValue === 'number';
    case 'boolean':
      return typeof defaultValue === 'boolean';
    case 'timestamp':
      return typeof defaultValue === 'string';
    default:
      return false;
  }
}
