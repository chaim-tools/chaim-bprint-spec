/**
 * Validation helper functions for bprint schemas
 */

/**
 * Check for duplicate entity names
 * @param {Array} entities - Array of entity objects
 * @returns {Array} Array of duplicate entity names
 */
export const findDuplicateEntityNames = entities => {
  const entityNames = entities.map(e => e.name);
  return entityNames.filter(
    (name, index) => entityNames.indexOf(name) !== index
  );
};

/**
 * Check for duplicate field names within an entity
 * @param {Object} entity - Entity object
 * @returns {Array} Array of duplicate field names
 */
export const findDuplicateFieldNames = entity => {
  const fieldNames = entity.fields.map(f => f.name);
  return fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
};

/**
 * Validate custom business rules beyond JSON Schema
 * @param {Object} json - Parsed bprint JSON
 * @returns {Array} Array of validation error messages
 */
export const validateCustomRules = json => {
  const errors = [];

  if (!json.entities || !Array.isArray(json.entities)) {
    return errors;
  }

  // Check for duplicate entity names
  const duplicateEntities = findDuplicateEntityNames(json.entities);
  if (duplicateEntities.length > 0) {
    errors.push(`Duplicate entity names: ${duplicateEntities.join(', ')}`);
  }

  // Check for duplicate field names per entity
  json.entities.forEach(entity => {
    if (entity.fields && Array.isArray(entity.fields)) {
      const duplicateFields = findDuplicateFieldNames(entity);
      if (duplicateFields.length > 0) {
        errors.push(
          `Entity '${entity.name}' has duplicate field names: ${duplicateFields.join(', ')}`
        );
      }
    }
  });

  return errors;
};

/**
 * Count entities and fields in a bprint file
 * @param {Object} json - Parsed bprint JSON
 * @returns {Object} Counts object
 */
export const countEntitiesAndFields = json => {
  const entityCount = json.entities?.length || 0;
  const fieldCount =
    json.entities?.reduce((sum, e) => sum + (e.fields?.length || 0), 0) || 0;

  return { entityCount, fieldCount };
};

/**
 * Format validation errors for display
 * @param {Array} errors - Array of validation errors
 * @returns {string} Formatted error string
 */
export const formatValidationErrors = errors => {
  if (!errors || errors.length === 0) return '';

  return errors
    .map(error => {
      if (error.message) {
        return `   - ${error.message}`;
      } else {
        return `   - ${error.instancePath || 'root'}: ${error.message || error.keyword}`;
      }
    })
    .join('\n');
};

/**
 * Validate field type constraints
 * @param {Object} field - Field object
 * @returns {Array} Array of validation error messages
 */
export const validateFieldConstraints = field => {
  const errors = [];

  // Check if enum values are provided when type is string
  if (field.type === 'string' && field.enum && Array.isArray(field.enum)) {
    if (field.enum.length === 0) {
      errors.push(`Field '${field.name}' has empty enum array`);
    }

    // Check for duplicate enum values
    const duplicateEnumValues = field.enum.filter(
      (value, index) => field.enum.indexOf(value) !== index
    );
    if (duplicateEnumValues.length > 0) {
      errors.push(
        `Field '${field.name}' has duplicate enum values: ${duplicateEnumValues.join(', ')}`
      );
    }
  }

  return errors;
};
