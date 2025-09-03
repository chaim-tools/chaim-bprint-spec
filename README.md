# chaim-bprint-spec

**Chaim Blueprint Specification (`.bprint`)**  
A lightweight, versioned schema format for defining application data structures that drive **code generation, validation, and governance**.

## Overview

The **Blueprint Spec** (`.bprint`) is the foundation of Chaim's open-source developer tools.  
It provides a declarative way to define data schemas that can be:

- Translated into **strongly typed POJOs/DTOs** (Java today; Python/Node.js later).
- Used by runtime clients to validate data shapes and enforce constraints.
- Referenced by the Chaim CDK **ChaimBinder** to bind infrastructure (e.g., DynamoDB).
- Versioned automatically via a `chaim_version` field.

## Why `.bprint`?

- **Cloud-agnostic** (works across providers).
- **Developer-first** (simple, readable).
- **Shift-left** (great in CI/CD + IaC).
- **Extensible** (room for privacy/security annotations later).

## Repository Structure

```
chaim-bprint-spec/
├── schema/
│   └── bprint.schema.json        # JSON Schema for validation
├── examples/
│   └── orders.bprint             # Canonical demo schema
├── scripts/
│   ├── validate-examples.mjs     # CLI validation script
│   ├── validate-single.mjs       # Single file validator
│   └── utils/                    # Validation utilities
│       ├── schema-loader.mjs     # Schema loading & caching
│       └── validation-helpers.mjs # Custom validation rules
├── tests/
│   ├── spec.test.mjs             # Test suite
│   ├── integration/               # Integration tests
│   │   └── end-to-end.test.mjs   # End-to-end validation workflow
│   └── fixtures/                  # Test data
│       ├── valid/                 # Valid .bprint examples
│       └── invalid/               # Invalid .bprint examples
├── config/                        # Configuration files
└── .github/workflows/             # CI/CD pipeline
```

## Examples

The repository includes comprehensive examples organized by industry, with each `.bprint` file containing a single entity for clean CDK integration:

### **Basic Examples** (`examples/basic/`)
- **`simple.bprint`** - Minimal schema with single entity
- **`orders.bprint`** - Basic order management system

### **E-commerce Platform** (`examples/ecommerce/`)
- **`customer.bprint`** - Customer account and profile management
- **`product.bprint`** - Product catalog and pricing information
- **`order.bprint`** - Customer order processing and tracking
- **`inventory.bprint`** - Multi-warehouse inventory management

### **Financial Services** (`examples/financial/`)
- **`customer.bprint`** - Customer KYC and compliance information
- **`account.bprint`** - Bank account management and balances
- **`transaction.bprint`** - Financial transaction records and audit
- **`compliance-audit.bprint`** - Regulatory compliance and audit trails

### **Healthcare Systems** (`examples/healthcare/`)
- **`patient.bprint`** - Patient demographics and medical information
- **`provider.bprint`** - Healthcare provider credentials and specialties
- **`appointment.bprint`** - Patient appointment scheduling and management
- **`medical-record.bprint`** - Clinical records and medical history

### **IoT & Sensors** (`examples/iot/`)
- **`device.bprint`** - IoT device registration and metadata
- **`sensor-reading.bprint`** - Time-series sensor data readings
- **`alert.bprint`** - Device alerts and notification management
- **`device-group.bprint`** - Logical device grouping and organization

### **Example Features Demonstrated**
- **Single Entity Per File**: Clean 1:1 mapping for CDK table generation
- **Composite Keys**: Sort keys for time-series and relationship data
- **Enums**: Constrained field values for status, types, and categories
- **Annotations**: PII flags, retention policies, encryption requirements
- **Default Values**: Field defaults for common scenarios
- **Industry-Specific Compliance**: HIPAA, SOX, GDPR, PCI-DSS requirements
- **System-Determined Ownership**: Ownership and access control handled by authentication system
- **Centralized Metadata**: Database metadata managed in CDK layer, not in .bprint files

## Minimal Example (.bprint JSON)

```json
{
  "schemaVersion": "v1",
  "namespace": "acme.orders",
  "entities": [
    {
      "name": "Order",
      "primaryKey": { "partitionKey": "orderId" },
      "fields": [
        { "name": "orderId", "type": "string", "required": true },
        { "name": "customerId", "type": "string", "required": true },
        { "name": "amount", "type": "number", "required": true },
        { "name": "currency", "type": "string", "required": false }
      ]
    }
  ]
}
```

## Advanced Example with Metadata

```json
{
  "schemaVersion": "v1",
  "namespace": "acme.products",
  "metadata": {
    "owner": "product-team",
    "description": "Product catalog schema"
  },
  "entities": [
    {
      "name": "Product",
      "description": "Product information",
      "primaryKey": { 
        "partitionKey": "productId",
        "sortKey": "categoryId"
      },
      "fields": [
        { "name": "productId", "type": "string", "required": true },
        { "name": "categoryId", "type": "string", "required": true },
        { "name": "name", "type": "string", "required": true },
        { "name": "price", "type": "number", "required": true },
        { "name": "inStock", "type": "boolean", "required": false },
        { "name": "tags", "type": "string", "enum": ["electronics", "clothing", "books"], "required": false },
        { "name": "createdAt", "type": "timestamp", "required": true }
      ],
      "annotations": {
        "pii": false,
        "retention": "7years"
      }
    }
  ]
}
```

## Features

### ✅ **JSON Schema Validation**
- Comprehensive schema with validation rules
- Required fields: `schemaVersion`, `namespace`, `entities[]`
- Entity requirements: `name`, `primaryKey.partitionKey`, `fields[]`
- Field type constraints: `string`, `number`, `boolean`, `timestamp`
- Support for `default` values and `enum` constraints

### 🔍 **Custom Business Rules**
- No duplicate entity names
- No duplicate field names per entity
- Field constraint validation
- Enum value validation (non-empty arrays)
- Comprehensive error reporting with context

### 🛠️ **Developer Tools**
- **CLI Validation**: `npm run validate:examples`
- **Single File Validation**: `npm run validate:single <file>`
- **Test Suite**: `npm test`
- **Code Quality**: `npm run check`
- **Formatting**: `npm run format`
- **Linting**: `npm run lint`

### 📊 **Enhanced Output**
- Detailed error reporting with file paths and line numbers
- Entity and field counting with statistics
- Validation summary with success/failure counts
- Schema metadata display (title, version, ID)
- Performance metrics and timing information

### 🧪 **Comprehensive Testing**
- **Unit Tests**: Core validation logic
- **Integration Tests**: End-to-end workflows
- **Test Fixtures**: Real-world examples (valid & invalid)
- **Edge Cases**: Boundary conditions and error scenarios
- **Custom Rules**: Business logic validation testing

## Quick Start

```bash
# Install dependencies
npm install

# Validate all examples
npm run validate:examples

# Validate a single file
npm run validate:single examples/orders.bprint

# Run test suite
npm test

# Run specific test types
npm run test:unit
npm run test:integration

# Full validation & quality check
npm run check

# Format code
npm run format

# Lint code
npm run lint
```

## Validation Rules

### Required Fields
- `schemaVersion` (string): Semantic or opaque version string
- `namespace` (string): Logical namespace for entities
- `entities[]` (array): Array of entity definitions (minimum 1)

### Entity Requirements
- `name` (string): Unique entity identifier
- `primaryKey.partitionKey` (string): Required partition key
- `fields[]` (array): Array of field definitions (minimum 1)

### Field Constraints
- `name` (string): Field identifier
- `type` (enum): One of `string`, `number`, `boolean`, `timestamp`
- `required` (boolean): Field requirement (default: false)
- `default` (any): Default value for the field
- `enum` (array): Optional enumerated values for string fields (non-empty)

### Advanced Features
- **Sort Keys**: Optional `sortKey` in primaryKey for composite keys
- **Metadata**: Optional high-level metadata (owner, description, tags)
- **Annotations**: Extensible annotations for entities and fields
- **Descriptions**: Human-readable descriptions for entities and fields

## Configuration

Customize validation behavior in `config/validation.json`:

```json
{
  "strictMode": false,
  "maxErrors": 100,
  "customRules": {
    "checkDuplicateNames": true,
    "checkFieldConstraints": true,
    "validateEnumValues": true
  },
  "output": {
    "format": "detailed",
    "showSchemaInfo": true,
    "showStatistics": true
  },
  "paths": {
    "examples": "examples",
    "schema": "schema/bprint.schema.json"
  }
}
```

## Test Coverage

The test suite provides comprehensive coverage:

### **Valid Examples**
- `orders.bprint` - Basic order schema
- `users.bprint` - User account with default values
- `products.bprint` - Complex product catalog with metadata

### **Invalid Examples**
- `missing-partition-key.bprint` - Schema validation errors
- `duplicate-entity-names.bprint` - Business rule violations
- `invalid-enum.bprint` - Constraint validation errors

### **Test Categories**
- **Schema Validation**: JSON Schema compliance
- **Field Validation**: Type constraints and requirements
- **Edge Cases**: Boundary conditions and error handling
- **Custom Rules**: Business logic validation
- **Schema Metadata**: Schema information access
- **Integration**: End-to-end validation workflows

## Performance Features

- **Schema Caching**: Load and compile schema once, reuse for multiple validations
- **Parallel Processing**: Efficient validation of multiple files
- **Memory Optimization**: Minimal memory footprint for large schemas
- **Fast Validation**: Optimized validation algorithms with Ajv

## Error Handling

- **Graceful Degradation**: Continue validation even if individual files fail
- **Detailed Error Messages**: Clear, actionable error descriptions
- **Context Information**: File paths, line numbers, and validation context
- **Error Aggregation**: Collect all errors for comprehensive reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `npm run check`
5. Follow the code style: `npm run format`
6. Submit a pull request

### **Development Workflow**
```bash
# Make changes
npm run format          # Format code
npm run lint            # Check for issues
npm test                # Run tests
npm run check           # Full validation
```

## License

Apache-2.0 - see [LICENSE](LICENSE) for details.

## Roadmap

- **Schema Evolution**: Version migration tools
- **IDE Integration**: VS Code extension for .bprint files
- **Code Generation**: Java/Python/Node.js DTO generators
- **Cloud Integration**: AWS CDK, Azure Bicep, GCP support
- **Validation API**: REST API for remote validation
- **Schema Registry**: Centralized schema management
