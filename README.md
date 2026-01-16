# chaim-bprint-spec

**Chaim Blueprint Specification (`.bprint`)**  
A lightweight, versioned schema format for defining application data structures that drive **code generation, validation, and governance**.

## Overview

The **Blueprint Spec** (`.bprint`) is the foundation of Chaim's developer tools.  
It provides a declarative way to define data schemas that can be:

- Translated into **strongly typed POJOs/DTOs** (Java today; Python/Node.js later)
- Used by runtime clients to validate data shapes and enforce constraints
- Referenced by the Chaim CDK **ChaimBinder** to bind infrastructure (e.g., DynamoDB)
- Versioned automatically via a `chaim_version` field

## Why `.bprint`?

- **Cloud-agnostic** (works across providers)
- **Developer-first** (simple, readable)
- **Shift-left** (great in CI/CD + IaC)
- **Extensible** (room for privacy/security annotations later)
- **CDK-ready** (supports single-table design with DynamoDB)

## Installation

```bash
npm install @chaim-tools/chaim-bprint-spec
```

## Usage

### TypeScript Types

```typescript
import {
  SchemaData,
  PrimaryKey,
  Field,
} from '@chaim-tools/chaim-bprint-spec';

const userSchema: SchemaData = {
  schemaVersion: 1.0,
  entityName: 'User',
  description: 'User account information',
  primaryKey: {
    partitionKey: 'userId',
  },
  fields: [
    {
      name: 'userId',
      type: 'string',
      required: true,
    },
    {
      name: 'email',
      type: 'string',
      required: true,
    },
    {
      name: 'isActive',
      type: 'boolean',
      default: true,
    },
  ],
};
```

### Schema Validation

```typescript
import { validateSchema } from '@chaim-tools/chaim-bprint-spec';

try {
  const validatedUserSchema = validateSchema(userSchema);
  console.log('User schema is valid:', validatedUserSchema);
} catch (error) {
  console.error('Schema validation failed:', error.message);
}
```

## Schema Format

### Minimal Example

```json
{
  "schemaVersion": 1.0,
  "entityName": "User",
  "description": "User account information",
  "primaryKey": { "partitionKey": "userId" },
  "fields": [
    { "name": "userId", "type": "string", "required": true },
    { "name": "email", "type": "string", "required": true },
    { "name": "isActive", "type": "boolean", "default": true }
  ]
}
```

### Advanced Example with Constraints

```json
{
  "schemaVersion": 1.0,
  "entityName": "User",
  "description": "User account information with field constraints",
  "primaryKey": { "partitionKey": "userId" },
  "fields": [
    { "name": "userId", "type": "string", "required": true },
    {
      "name": "email",
      "type": "string",
      "required": true,
      "constraints": {
        "minLength": 5,
        "maxLength": 254,
        "pattern": "^[^@]+@[^@]+\\.[^@]+$"
      }
    },
    {
      "name": "membershipTier",
      "type": "string",
      "enum": ["bronze", "silver", "gold", "platinum"]
    },
    {
      "name": "age",
      "type": "number",
      "constraints": { "min": 0, "max": 150 }
    },
    { "name": "isActive", "type": "boolean", "default": true },
    { "name": "createdAt", "type": "timestamp", "required": true }
  ]
}
```

## Schema Requirements

### Required Fields

- `schemaVersion` (number): Schema version number (e.g., 1.0, 2.0)
- `entityName` (string): Entity name (e.g., "User", "Order", "Product")
- `description` (string): Human-readable description of the entity
- `primaryKey` (object): Primary key definition with `partitionKey` and optional `sortKey`
- `fields[]` (array): Array of field definitions (minimum 1)

### Primary Key Requirements

- `partitionKey` (string): Required partition key field name
- `sortKey` (string, optional): Sort key field name for composite keys

### Field Constraints

- `name` (string): Field identifier
- `type` (enum): One of `string`, `number`, `boolean`, `timestamp`
- `required` (boolean): Field requirement (default: false)
- `default` (any): Default value for the field
- `enum` (array): Optional enumerated values for string fields

### Advanced Features

- **Sort Keys**: Optional `sortKey` in primaryKey for composite keys
- **Constraints**: Validation constraints for fields (`minLength`, `maxLength`, `pattern`, `min`, `max`)
- **Annotations**: Extensible custom metadata for fields
- **Descriptions**: Human-readable descriptions for fields

## Examples

The repository includes comprehensive examples organized by industry:

- **Basic**: Simple schemas for getting started
- **E-commerce**: Customer, product, order, and inventory management
- **Financial**: Customer KYC, accounts, transactions, and compliance
- **Healthcare**: Patient, provider, appointment, and medical records
- **IoT**: Device management, sensor readings, and alerts

## Development

### Scripts

```bash
npm run build          # Build TypeScript to JavaScript
npm run test           # Run test suite
npm run validate:examples  # Validate all examples
npm run validate:single    # Validate single file
npm run check          # Full validation & quality check
npm run format         # Format code
npm run lint           # Lint code
```

### Testing

- **Unit Tests**: Core validation logic
- **Integration Tests**: End-to-end workflows
- **Test Fixtures**: Real-world examples (valid & invalid)
- **Edge Cases**: Boundary conditions and error scenarios

## CDK Integration

The `.bprint` files are designed for seamless CDK integration via the `ChaimBinder` construct:

- **Entity Schema Binding**: Each `.bprint` describes an entity type that can be stored in a DynamoDB table
- **Single-Table Design**: Multiple `.bprint` schemas can bind to the same table (NoSQL best practice)
- **Schema Metadata**: `ChaimBinder` associates schema definitions with existing tables for validation and governance
- **Namespace Organization**: Use namespaces to logically group related entity schemas

```typescript
import { ChaimBinder } from '@chaim-tools/cdk-lib';

// Create one DynamoDB table
const dataTable = new dynamodb.Table(this, 'DataTable', { ... });

// Bind multiple entity schemas to the same table
new ChaimBinder(this, 'UserSchema', {
  schemaPath: './schemas/user.bprint',
  table: dataTable,
});

new ChaimBinder(this, 'OrderSchema', {
  schemaPath: './schemas/order.bprint',
  table: dataTable,  // Same table, different entity type
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `npm run check`
5. Follow the code style: `npm run format`
6. Submit a pull request

## License

Apache-2.0 - see [LICENSE](LICENSE) for details.
