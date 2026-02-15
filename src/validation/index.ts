import {
  SchemaData,
  PrimaryKey,
  Field,
  FieldConstraints,
  ListItems,
  NestedField,
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

const SCALAR_TYPES = ['string', 'number', 'boolean', 'timestamp'];
const COLLECTION_TYPES = ['list', 'map', 'stringSet', 'numberSet'];
const ALL_FIELD_TYPES = [...SCALAR_TYPES, ...COLLECTION_TYPES];
const LIST_ITEM_TYPES = [...SCALAR_TYPES, 'map'];

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
      !ALL_FIELD_TYPES.includes(field.type)
    ) {
      throw new Error(
        `Field '${field.name}' must have a valid type: ${ALL_FIELD_TYPES.join(', ')}`
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

    const isCollection = COLLECTION_TYPES.includes(field.type);

    // Reject default, enum, constraints on collection types
    if (isCollection) {
      if (field.default !== undefined) {
        throw new Error(
          `Field '${field.name}' of type '${field.type}' cannot have a default value`
        );
      }
      if (field.enum) {
        throw new Error(
          `Field '${field.name}' of type '${field.type}' cannot have enum values`
        );
      }
      if (field.constraints) {
        throw new Error(
          `Field '${field.name}' of type '${field.type}' cannot have constraints`
        );
      }
    }

    // Validate enum values if present (scalar types only)
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

    // Validate list type: items is required
    let validatedItems: ListItems | undefined;
    if (field.type === 'list') {
      if (!field.items || typeof field.items !== 'object') {
        throw new Error(
          `Field '${field.name}' of type 'list' must include an 'items' definition`
        );
      }
      validatedItems = validateListItems(field.name, field.items);
    }

    // Validate map type: fields is required
    let validatedNestedFields: NestedField[] | undefined;
    if (field.type === 'map') {
      if (!Array.isArray(field.fields) || field.fields.length === 0) {
        throw new Error(
          `Field '${field.name}' of type 'map' must include a non-empty 'fields' array`
        );
      }
      validatedNestedFields = validateNestedFields(field.name, field.fields);
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
      items: validatedItems,
      fields: validatedNestedFields,
    });
  }

  return validatedFields;
}

/**
 * Validate the items definition for a list field.
 */
function validateListItems(fieldName: string, items: any): ListItems {
  if (!items.type || !LIST_ITEM_TYPES.includes(items.type)) {
    throw new Error(
      `Field '${fieldName}' items must have a valid type: ${LIST_ITEM_TYPES.join(', ')}`
    );
  }

  let validatedFields: NestedField[] | undefined;
  if (items.type === 'map') {
    if (!Array.isArray(items.fields) || items.fields.length === 0) {
      throw new Error(
        `Field '${fieldName}' items of type 'map' must include a non-empty 'fields' array`
      );
    }
    validatedFields = validateNestedFields(fieldName, items.fields);
  }

  return {
    type: items.type,
    fields: validatedFields,
  };
}

/**
 * Validate nested field definitions for map types.
 * Nested fields only support name + scalar type (no constraints, annotations, etc.).
 */
function validateNestedFields(parentFieldName: string, fields: any[]): NestedField[] {
  const nestedNames = new Set<string>();
  const validated: NestedField[] = [];

  for (const nf of fields) {
    if (!nf.name || typeof nf.name !== 'string') {
      throw new Error(
        `Nested field in '${parentFieldName}' must include name as a string`
      );
    }
    if (!nf.type || !SCALAR_TYPES.includes(nf.type)) {
      throw new Error(
        `Nested field '${nf.name}' in '${parentFieldName}' must have a valid type: ${SCALAR_TYPES.join(', ')}`
      );
    }
    if (nestedNames.has(nf.name)) {
      throw new Error(
        `Duplicate nested field name '${nf.name}' in '${parentFieldName}'`
      );
    }
    nestedNames.add(nf.name);

    validated.push({ name: nf.name, type: nf.type });
  }

  return validated;
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
