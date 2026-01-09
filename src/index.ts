// Export the main types
export { SchemaData, Entity, PrimaryKey, Field, FieldConstraints, FieldAnnotations } from './types';

// Export validation functions
export { validateSchema } from './validation';

// Export the JSON schema
export { default as schema } from '../schema/bprint.schema.json';
