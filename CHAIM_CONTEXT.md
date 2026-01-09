# AI Agent Context: chaim-bprint-spec

**Purpose**: Structured context for AI agents to understand and work with the chaim-bprint-spec codebase.

**Package**: `@chaim-tools/chaim-bprint-spec`  
**Version**: 0.1.1  
**License**: Apache-2.0

---

## Project Overview

The chaim-bprint-spec is a **Blueprint Specification (.bprint)** system—a lightweight, versioned JSON schema format for defining data entity structures. Each `.bprint` file describes one entity type that can be stored in a NoSQL database (e.g., DynamoDB). Multiple entity schemas can coexist in a single table (single-table design pattern).

### Key Capabilities

- **TypeScript types** for type-safe schema definitions
- **Programmatic validation** via exported functions
- **JSON Schema validation** using Ajv
- **CLI tooling** for batch validation
- **CDK integration** with ChaimBinder for infrastructure binding

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript 5.x |
| Module System | CommonJS (`"type": "commonjs"`) |
| Runtime | Node.js 18+ |
| Validation | Ajv 8.x with ajv-formats |
| Testing | Node.js built-in test runner |
| Code Quality | ESLint 9.x, Prettier 3.x |

---

## Repository Structure

```
chaim-bprint-spec/
├── src/                          # TypeScript source
│   ├── index.ts                  # Main exports
│   ├── types/index.ts            # TypeScript interfaces
│   └── validation/index.ts       # Validation logic
├── dist/                         # Compiled output (generated)
├── schema/
│   └── bprint.schema.json        # JSON Schema definition
├── scripts/                      # CLI validation tools
│   ├── utils/                    # Reusable modules
│   ├── validate-examples.mjs     # Batch validation
│   └── validate-single.mjs       # Single file validation
├── examples/                     # Sample .bprint files
│   ├── basic/                    # Simple examples
│   ├── ecommerce/                # Customer, product, order, inventory
│   ├── financial/                # Account, transaction, compliance
│   ├── healthcare/               # Patient, provider, appointment
│   └── iot/                      # Device, sensor, alert
├── tests/
│   ├── fixtures/                 # Valid and invalid test cases
│   └── integration/              # End-to-end tests
├── package.json
└── tsconfig.json
```

---

## Schema Specification

### Core Structure

Each `.bprint` file defines **exactly one entity**:

```json
{
  "schemaVersion": "string",    // Required: Version identifier (e.g., "v1")
  "namespace": "string",        // Required: Logical namespace (e.g., "order")
  "description": "string",      // Required: Human-readable description
  "entity": {                   // Required: Single entity definition
    "primaryKey": {
      "partitionKey": "string", // Required: Partition key field name
      "sortKey": "string"       // Optional: Sort key for composite keys
    },
    "fields": [                 // Required: At least one field
      {
        "name": "string",       // Required: Field identifier
        "type": "enum",         // Required: string | number | boolean | timestamp
        "required": false,      // Optional: Default false
        "default": "any",       // Optional: Default value
        "enum": ["..."],        // Optional: Allowed values (string fields)
        "description": "string",// Optional: Field documentation
        "constraints": {},      // Optional: Validation constraints
        "annotations": {}       // Optional: Custom metadata (extensible)
      }
    ]
  }
}
```

### Field Types

| Type | Description | Default Type |
|------|-------------|--------------|
| `string` | Text data, supports `enum` constraints | `string` |
| `number` | Numeric values | `number` |
| `boolean` | True/false values | `boolean` |
| `timestamp` | Date/time (ISO 8601 strings) | `string` |

### Field Constraints

Fields support a `constraints` object for validation rules:

| Constraint | Applies To | Description |
|------------|------------|-------------|
| `minLength` | string | Minimum string length (non-negative integer) |
| `maxLength` | string | Maximum string length (non-negative integer) |
| `pattern` | string | Regex pattern for validation |
| `min` | number | Minimum numeric value |
| `max` | number | Maximum numeric value |

**Example - length constraints:**

```json
{
  "name": "username",
  "type": "string",
  "required": true,
  "constraints": {
    "minLength": 3,
    "maxLength": 30
  }
}
```

**Example - pattern constraint:**

```json
{
  "name": "phoneNumber",
  "type": "string",
  "constraints": {
    "pattern": "^\\+?[1-9]\\d{1,14}$"
  }
}
```

**Example - number constraints:**

```json
{
  "name": "quantity",
  "type": "number",
  "required": true,
  "constraints": {
    "min": 1,
    "max": 1000
  }
}
```

### Field Annotations

Fields support an optional `annotations` object for custom metadata. This is an extensible object that can hold any additional information needed for code generation, documentation, or other tooling.

```json
{
  "name": "email",
  "type": "string",
  "required": true,
  "annotations": {
    "customFlag": true,
    "generatedBy": "user-service"
  }
}
```

> **Note:** Index definitions (GSI/LSI) are managed at the infrastructure level in CDK, not in the `.bprint` schema. The CDK binding validates that index keys reference fields defined in the schema.

---

## Package Exports

### npm Installation

```bash
npm install @chaim-tools/chaim-bprint-spec
```

### Exported API

```typescript
// TypeScript types
import { SchemaData, Entity, PrimaryKey, Field } from '@chaim-tools/chaim-bprint-spec';

// Validation function
import { validateSchema } from '@chaim-tools/chaim-bprint-spec';

// JSON Schema (for Ajv or other validators)
import { schema } from '@chaim-tools/chaim-bprint-spec';
// Or: import schema from '@chaim-tools/chaim-bprint-spec/schema';
```

### TypeScript Interfaces

```typescript
interface SchemaData {
  schemaVersion: string;
  namespace: string;
  description: string;
  entity: Entity;
}

interface Entity {
  primaryKey: PrimaryKey;
  fields: Field[];
}

interface PrimaryKey {
  partitionKey: string;
  sortKey?: string;
}

interface Field {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'timestamp';
  required?: boolean;
  default?: string | number | boolean;
  enum?: string[];
  description?: string;
  constraints?: FieldConstraints;
  annotations?: FieldAnnotations;
}

interface FieldConstraints {
  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // Number constraints
  min?: number;
  max?: number;
}

interface FieldAnnotations {
  [key: string]: unknown;  // Extensible for custom metadata
}
```

### Validation Usage

```typescript
import { validateSchema } from '@chaim-tools/chaim-bprint-spec';

try {
  const validated = validateSchema(rawData);
  // Returns typed SchemaData on success
} catch (error) {
  // Throws Error with descriptive message on failure
}
```

---

## CLI Scripts

### Validate All Examples

```bash
npm run validate:examples
```

### Validate Single File

```bash
npm run validate:single -- path/to/file.bprint
```

### Full Quality Check

```bash
npm run check  # Runs prettier, eslint, validation, and tests
```

---

## Validation Rules

### JSON Schema Level
- Required fields: `schemaVersion`, `namespace`, `description`, `entity`
- Entity requires: `primaryKey.partitionKey`, `fields[]` (min 1 item)
- Field types constrained to enum values
- No additional properties allowed (`additionalProperties: false`)

### Business Rules (Custom Validation)
- Duplicate field names within an entity
- Empty enum arrays
- Duplicate enum values
- Default value type must match field type

### Constraint Validation
- `minLength`/`maxLength`/`pattern` only valid on `string` type fields
- `min`/`max` only valid on `number` type fields
- `minLength` must be ≤ `maxLength` when both specified
- `min` must be ≤ `max` when both specified
- `pattern` must be a valid regular expression

---

## CDK Integration

The `.bprint` format is designed for seamless AWS CDK integration via the `ChaimBinder` construct:

```typescript
import { ChaimBinder } from '@chaim-tools/cdk-lib';

// Single table can hold multiple entity types (single-table design)
const dataTable = new dynamodb.Table(this, 'DataTable', { ... });

// Bind multiple schemas to the same table
new ChaimBinder(this, 'UserSchema', {
  schemaPath: './schemas/user.bprint',
  table: dataTable,
});

new ChaimBinder(this, 'OrderSchema', {
  schemaPath: './schemas/order.bprint',
  table: dataTable,  // Same table, different entity type
});
```

### Key Concepts

- **Entity-to-Table Binding**: A `.bprint` describes an entity type, not a table
- **Single-Table Design**: Multiple entity schemas can bind to one DynamoDB table
- **Schema Binding**: `ChaimBinder` associates schema metadata with an existing table
- **Table Independence**: Tables are created separately; schemas describe data shape

---

## Example: Minimal .bprint File

```json
{
  "schemaVersion": "v1",
  "namespace": "simple.example",
  "description": "Minimal example with single entity for basic usage",
  "entity": {
    "primaryKey": { "partitionKey": "id" },
    "fields": [
      { "name": "id", "type": "string", "required": true },
      { "name": "name", "type": "string", "required": true },
      { "name": "email", "type": "string", "required": true }
    ]
  }
}
```

---

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to dist/ |
| `npm test` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run validate:examples` | Validate all example files |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run check` | Full CI check (format + lint + validate + test) |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript interface definitions |
| `src/validation/index.ts` | Programmatic validation logic |
| `schema/bprint.schema.json` | JSON Schema (Draft 2020-12) |
| `scripts/utils/schema-loader.mjs` | Ajv schema compilation utilities |
| `scripts/utils/validation-helpers.mjs` | Custom business rule validators |

---

## Test Fixtures

- **Valid schemas**: `tests/fixtures/valid/*.bprint`
- **Invalid schemas**: `tests/fixtures/invalid/*.bprint`
  - `duplicate-field-names.bprint`
  - `invalid-enum.bprint`
  - `missing-partition-key.bprint`

---

## Common Validation Errors

| Error | Cause |
|-------|-------|
| `Schema must include description field` | Missing required `description` |
| `Entity must include primaryKey field` | Missing `primaryKey` object |
| `PrimaryKey must include partitionKey as a string` | Missing or invalid partition key |
| `Field must have a valid type` | Type not in allowed enum |
| `Duplicate field name: X` | Field names must be unique within entity |

---

**Note**: This document reflects the actual codebase structure. When working with `.bprint` files, remember that each file defines exactly **one entity** (not an array of entities). The package is designed as both a TypeScript library for programmatic use and a validation toolkit for CI/CD pipelines.
