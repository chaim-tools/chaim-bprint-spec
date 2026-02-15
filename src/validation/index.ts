import {
  SchemaData,
  PrimaryKey,
  Field,
  FieldConstraints,
} from '../types';

/**
 * Regex for a valid identifier in all supported target languages.
 */
const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Reserved keywords across supported target languages.
 * nameOverride must not collide with these.
 */
const RESERVED_WORDS = new Set<string>([
  // Java reserved keywords
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while',
  // Java literals
  'true', 'false', 'null',
  // Python reserved keywords (for future generators)
  'and', 'as', 'def', 'del', 'elif', 'except', 'from', 'global', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'with', 'yield',
  // Go reserved keywords (for future generators)
  'chan', 'defer', 'fallthrough', 'func', 'go', 'map', 'range', 'select',
  'struct', 'type', 'var',
]);

/**
 * Validates a schema object against the official chaim-bprint-spec
 */
export function validateSchema(schema: any): SchemaData {
  // Validate top-level required fields
  if (!schema.schemaVersion) {
    throw new Error('Schema must include schemaVersion field');
  }
  if (!schema.entityName) {
    throw new Error('Schema must include entityName field');
  }
  if (!schema.description) {
    throw new Error('Schema must include description field');
  }
  if (!schema.primaryKey) {
    throw new Error('Schema must include primaryKey field');
  }
  if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
    throw new Error('Schema must include fields array with at least one field');
  }

  // Validate primary key and fields
  const primaryKey = validatePrimaryKey(schema.primaryKey);
  const fields = validateFields(schema.fields);

  // Return validated schema
  return {
    schemaVersion: schema.schemaVersion,
    entityName: schema.entityName,
    description: schema.description,
    primaryKey,
    fields,
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
    if (
      !field.type ||
      !['string', 'number', 'boolean', 'timestamp'].includes(field.type)
    ) {
      throw new Error(
        `Field '${field.name}' must have a valid type: string, number, boolean, or timestamp`
      );
    }

    // Check for duplicate field names
    if (fieldNames.has(field.name)) {
      throw new Error(`Duplicate field name: ${field.name}`);
    }
    fieldNames.add(field.name);

    // Validate nameOverride if present
    if (field.nameOverride !== undefined && field.nameOverride !== null) {
      if (typeof field.nameOverride !== 'string') {
        throw new Error(
          `Field '${field.name}' nameOverride must be a string`
        );
      }
      if (!VALID_IDENTIFIER_REGEX.test(field.nameOverride)) {
        throw new Error(
          `Field '${field.name}' nameOverride '${field.nameOverride}' is not a valid identifier. Must match ${VALID_IDENTIFIER_REGEX}`
        );
      }
      if (RESERVED_WORDS.has(field.nameOverride)) {
        throw new Error(
          `Field '${field.name}' nameOverride '${field.nameOverride}' is a reserved keyword`
        );
      }
    }

    // Validate enum values if present
    if (field.enum && (!Array.isArray(field.enum) || field.enum.length === 0)) {
      throw new Error(`Field '${field.name}' enum must be a non-empty array`);
    }

    // Validate default value type matches field type
    if (field.default !== undefined) {
      const isValidDefault = validateDefaultValue(field.default, field.type);
      if (!isValidDefault) {
        throw new Error(
          `Field '${field.name}' default value type does not match field type`
        );
      }
    }

    // Validate field constraints
    if (field.constraints) {
      validateFieldConstraints(field.name, field.type, field.constraints);
    }

    validatedFields.push({
      name: field.name,
      nameOverride: field.nameOverride,
      type: field.type,
      required: field.required ?? false,
      default: field.default,
      enum: field.enum,
      description: field.description,
      constraints: field.constraints,
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

/**
 * Validates field constraints are appropriate for the field type
 */
function validateFieldConstraints(
  fieldName: string,
  fieldType: string,
  constraints: FieldConstraints
): void {
  // Validate string constraints only apply to string fields
  if (constraints.minLength !== undefined) {
    if (fieldType !== 'string') {
      throw new Error(
        `Field '${fieldName}' has minLength constraint but is not a string type`
      );
    }
    if (
      typeof constraints.minLength !== 'number' ||
      constraints.minLength < 0 ||
      !Number.isInteger(constraints.minLength)
    ) {
      throw new Error(
        `Field '${fieldName}' minLength must be a non-negative integer`
      );
    }
  }

  if (constraints.maxLength !== undefined) {
    if (fieldType !== 'string') {
      throw new Error(
        `Field '${fieldName}' has maxLength constraint but is not a string type`
      );
    }
    if (
      typeof constraints.maxLength !== 'number' ||
      constraints.maxLength < 0 ||
      !Number.isInteger(constraints.maxLength)
    ) {
      throw new Error(
        `Field '${fieldName}' maxLength must be a non-negative integer`
      );
    }
  }

  // Validate minLength <= maxLength when both are specified
  if (
    constraints.minLength !== undefined &&
    constraints.maxLength !== undefined
  ) {
    if (constraints.minLength > constraints.maxLength) {
      throw new Error(
        `Field '${fieldName}' minLength (${constraints.minLength}) cannot be greater than maxLength (${constraints.maxLength})`
      );
    }
  }

  if (constraints.pattern !== undefined) {
    if (fieldType !== 'string') {
      throw new Error(
        `Field '${fieldName}' has pattern constraint but is not a string type`
      );
    }
    if (typeof constraints.pattern !== 'string') {
      throw new Error(`Field '${fieldName}' pattern must be a string`);
    }
    // Validate that the pattern is a valid regex
    try {
      new RegExp(constraints.pattern);
    } catch {
      throw new Error(
        `Field '${fieldName}' pattern is not a valid regular expression`
      );
    }
  }

  // Validate number constraints only apply to number fields
  if (constraints.min !== undefined) {
    if (fieldType !== 'number') {
      throw new Error(
        `Field '${fieldName}' has min constraint but is not a number type`
      );
    }
    if (typeof constraints.min !== 'number') {
      throw new Error(`Field '${fieldName}' min must be a number`);
    }
  }

  if (constraints.max !== undefined) {
    if (fieldType !== 'number') {
      throw new Error(
        `Field '${fieldName}' has max constraint but is not a number type`
      );
    }
    if (typeof constraints.max !== 'number') {
      throw new Error(`Field '${fieldName}' max must be a number`);
    }
  }

  // Validate min <= max when both are specified
  if (constraints.min !== undefined && constraints.max !== undefined) {
    if (constraints.min > constraints.max) {
      throw new Error(
        `Field '${fieldName}' min (${constraints.min}) cannot be greater than max (${constraints.max})`
      );
    }
  }
}
