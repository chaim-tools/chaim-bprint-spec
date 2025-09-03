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
- **CDK-ready** (clean 1:1 mapping to DynamoDB tables).

## Repository Structure

```
chaim-bprint-spec/
├── schema/
│   └── bprint.schema.json        # JSON Schema for validation
├── examples/                      # Sample .bprint files organized by industry
│   ├── basic/                    # Basic examples for getting started
│   │   ├── simple.bprint         # Minimal single entity
│   │   └── orders.bprint         # Basic order management
│   ├── ecommerce/                # E-commerce platform examples
│   │   ├── customer.bprint       # Customer profile management
│   │   ├── product.bprint        # Product catalog
│   │   ├── order.bprint          # Order processing
│   │   └── inventory.bprint      # Inventory tracking
│   ├── financial/                # Financial services examples
│   │   ├── customer.bprint       # KYC & compliance
│   │   ├── account.bprint        # Bank accounts
│   │   ├── transaction.bprint    # Financial transactions
│   │   └── compliance-audit.bprint # Regulatory compliance
│   ├── healthcare/               # Healthcare system examples
│   │   ├── patient.bprint        # Patient demographics
│   │   ├── provider.bprint       # Healthcare providers
│   │   ├── appointment.bprint    # Appointment scheduling
│   │   └── medical-record.bprint # Medical records
│   └── iot/                      # IoT sensor examples
│       ├── device.bprint         # Device management
│       ├── sensor-reading.bprint # Time-series data
│       ├── alert.bprint          # Device alerts
│       └── device-group.bprint   # Device grouping
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

## Minimal Example (.bprint JSON)

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
      { "name": "amount", "type": "number", "required": true },
      { "name": "currency", "type": "string", "required": false }
    ]
  }
}
```

## Advanced Example with Annotations

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
      { "name": "firstName", "type": "string", "required": true },
      { "name": "lastName", "type": "string", "required": true },
      {
        "name": "membershipTier",
        "type": "string",
        "enum": ["bronze", "silver", "gold", "platinum"],
        "required": false
      },
      {
        "name": "isActive",
        "type": "boolean",
        "required": false,
        "default": true
      },
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

## Features

### ✅ **JSON Schema Validation**

- Comprehensive schema with validation rules
- Required fields: `schemaVersion`, `namespace`, `description`, `entity`
- Entity requirements: `primaryKey.partitionKey`, `fields[]`
- Field type constraints: `string`, `number`, `boolean`, `timestamp`
- Support for `default` values and `enum` constraints

### 🔍 **Custom Business Rules**

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
- Recursive file discovery in subdirectories
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

# Validate all examples (recursively searches subdirectories)
npm run validate:examples

# Validate a single file
npm run validate:single examples/ecommerce/customer.bprint

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
- `enum` (array): Optional enumerated values for string fields (non-empty)

### Advanced Features

- **Sort Keys**: Optional `sortKey` in primaryKey for composite keys
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
- `products.bprint` - Complex product catalog with annotations

### **Invalid Examples**

- `missing-partition-key.bprint` - Schema validation errors
- `duplicate-field-names.bprint` - Business rule violations
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
- **Recursive Discovery**: Efficiently find all .bprint files in subdirectories
- **Memory Optimization**: Minimal memory footprint for large schemas
- **Fast Validation**: Optimized validation algorithms with Ajv

## Error Handling

- **Graceful Degradation**: Continue validation even if individual files fail
- **Detailed Error Messages**: Clear, actionable error descriptions
- **Context Information**: File paths, line numbers, and validation context
- **Error Aggregation**: Collect all errors for comprehensive reporting

## CDK Integration

The `.bprint` files are designed for seamless CDK integration:

### **1:1 Table Mapping**

- Each `.bprint` file maps to one DynamoDB table
- Clean namespace-based table naming
- Automatic primary key configuration

### **Infrastructure Integration**

- Database configuration managed in CDK
- Environment-specific settings
- Table naming and key configuration

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
- **CDK Constructs**: Infrastructure components for DynamoDB binding
