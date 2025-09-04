# chaim-bprint-spec

**Chaim Blueprint Specification (`.bprint`)**  
A lightweight, versioned schema format for defining application data structures that drive **code generation, validation, and governance**.

## Overview

The **Blueprint Spec** (`.bprint`) is the foundation of Chaim's open-source developer tools.  
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
- **CDK-ready** (clean 1:1 mapping to DynamoDB tables)

## Installation

```bash
npm install @chaim/chaim-bprint-spec
```

## Usage

### TypeScript Types

```typescript
import { SchemaData, Entity, PrimaryKey, Field } from '@chaim/chaim-bprint-spec';

const schema: SchemaData = {
  schemaVersion: "v1",
  namespace: "acme.users",
  description: "User account information",
  entity: {
    primaryKey: {
      partitionKey: "userId"
    },
    fields: [
      {
        name: "userId",
        type: "string",
        required: true
      }
    ]
  }
};
```

### Schema Validation

```typescript
import { validateSchema } from '@chaim/chaim-bprint-spec';

try {
  const validatedSchema = validateSchema(rawSchema);
  console.log('Schema is valid:', validatedSchema);
} catch (error) {
  console.error('Schema validation failed:', error.message);
}
```

### JSON Schema Access

```typescript
import schema from '@chaim/chaim-bprint-spec/schema';

// Use the JSON schema for custom validation
console.log('Schema version:', schema.$schema);
```

## Schema Format

### Minimal Example

```json
{
  "schemaVersion": "v1",
  "namespace": "acme.orders",
  "description": "Basic order management system",
  "entity": {
    "primaryKey": { "partitionKey": "orderId" },
    "fields": [
      { "name": "orderId", "type": "string", "required": true },
      { "name": "customerId", "type": "string", "required": true },
      { "name": "amount", "type": "number", "required": true }
    ]
  }
}
```

### Advanced Example with Annotations

```json
{
  "schemaVersion": "v1",
  "namespace": "ecommerce.store.customer",
  "description": "Customer account information and profile data",
  "entity": {
    "primaryKey": { "partitionKey": "customerId" },
    "fields": [
      { "name": "customerId", "type": "string", "required": true },
      { "name": "email", "type": "string", "required": true },
      {
        "name": "membershipTier",
        "type": "string",
        "enum": ["bronze", "silver", "gold", "platinum"]
      },
      { "name": "isActive", "type": "boolean", "default": true },
      { "name": "createdAt", "type": "timestamp", "required": true }
    ],
    "annotations": {
      "pii": true,
      "retention": "7years",
      "encryption": "required"
    }
  }
}
```

## Schema Requirements

### Required Fields

- `schemaVersion` (string): Semantic or opaque version string
- `namespace` (string): Logical namespace for entities
- `description` (string): Human-readable description of the schema
- `entity` (object): Single entity definition

### Entity Requirements

- `primaryKey.partitionKey` (string): Required partition key
- `fields[]` (array): Array of field definitions (minimum 1)

### Field Constraints

- `name` (string): Field identifier
- `type` (enum): One of `string`, `number`, `boolean`, `timestamp`
- `required` (boolean): Field requirement (default: false)
- `default` (any): Default value for the field
- `enum` (array): Optional enumerated values for string fields

### Advanced Features

- **Sort Keys**: Optional `sortKey` in primaryKey for composite keys
- **Annotations**: Extensible annotations for entities and fields
- **Descriptions**: Human-readable descriptions for entities and fields

## Repository Structure

```
chaim-bprint-spec/
├── src/                           # TypeScript source code
│   ├── index.ts                   # Main exports
│   ├── types/                     # TypeScript interfaces
│   └── validation/                # Validation functions
├── dist/                          # Built files (generated)
├── schema/
│   └── bprint.schema.json         # JSON Schema for validation
├── examples/                       # Sample .bprint files by industry
├── scripts/                        # Validation utilities
├── tests/                          # Test suite
└── config/                         # Configuration files
```

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

The `.bprint` files are designed for seamless CDK integration:

- **1:1 Table Mapping**: Each `.bprint` file maps to one DynamoDB table
- **Clean Naming**: Namespace-based table naming conventions
- **Automatic Keys**: Primary key configuration from schema
- **Infrastructure**: Database configuration managed in CDK

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `npm run check`
5. Follow the code style: `npm run format`
6. Submit a pull request

## License

Apache-2.0 - see [LICENSE](LICENSE) for details.

