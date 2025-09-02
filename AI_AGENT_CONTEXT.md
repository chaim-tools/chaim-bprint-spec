# AI Agent Context: chaim-bprint-spec

**Purpose**: This document provides structured context for AI agents to understand, analyze, and work with the chaim-bprint-spec codebase programmatically.

**Target Audience**: AI coding assistants, code analysis tools, and automated development systems.

**Last Updated**: 2025-09-02
**Version**: 1.0.0

## 🎯 **Project Overview**

### **Core Purpose**
The chaim-bprint-spec is a **Blueprint Specification (.bprint)** system that defines a lightweight, versioned schema format for application data structures. It enables code generation, validation, and governance through declarative schema definitions.

### **Key Value Proposition**
- **Schema-driven development** with JSON Schema validation
- **Custom business rules** beyond standard JSON validation
- **CLI tooling** for validation and testing
- **Comprehensive testing** with real-world fixtures
- **CI/CD integration** ready

## 🏗️ **Architecture & Structure**

### **File Organization**
```
chaim-bprint-spec/
├── schema/                    # Core schema definitions
├── scripts/                   # CLI tools and utilities
│   ├── utils/                # Reusable modules
│   └── *.mjs                 # Main validation scripts
├── tests/                     # Test suite and fixtures
│   ├── fixtures/             # Test data (valid/invalid)
│   └── integration/          # End-to-end tests
├── config/                    # Configuration files
├── examples/                  # Sample .bprint files
└── .github/workflows/         # CI/CD pipeline
```

### **Technology Stack**
- **Runtime**: Node.js 18+ (ESM modules)
- **Validation**: Ajv 8.x with custom formats
- **Testing**: Node.js built-in test runner
- **Code Quality**: ESLint 9.x, Prettier 3.x
- **CI/CD**: GitHub Actions

## 🔧 **Core Components**

### **1. Schema System**
- **File**: `schema/bprint.schema.json`
- **Purpose**: JSON Schema definition for .bprint file validation
- **Key Features**: 
  - Required fields validation
  - Field type constraints
  - Custom validation rules
  - Extensible annotations

### **2. Validation Engine**
- **Files**: `scripts/validate-*.mjs`
- **Purpose**: CLI tools for schema validation
- **Capabilities**:
  - Single file validation
  - Batch validation
  - Custom business rule enforcement
  - Detailed error reporting

### **3. Utility Modules**
- **Files**: `scripts/utils/*.mjs`
- **Purpose**: Reusable validation and schema loading functions
- **Key Functions**:
  - Schema caching and compilation
  - Custom business rule validation
  - Error formatting and reporting

### **4. Test Infrastructure**
- **Files**: `tests/*.mjs`
- **Purpose**: Comprehensive testing of validation logic
- **Coverage**: Unit tests, integration tests, edge cases

## 📋 **Schema Specification**

### **Core Schema Structure**
```json
{
  "schemaVersion": "string",      // Required: Version identifier
  "namespace": "string",          // Required: Logical namespace
  "entities": [                   // Required: Array of entities
    {
      "name": "string",           // Required: Entity identifier
      "primaryKey": {             // Required: Primary key definition
        "partitionKey": "string"  // Required: Partition key
      },
      "fields": [                 // Required: Array of fields
        {
          "name": "string",       // Required: Field identifier
          "type": "enum",         // Required: Field type
          "required": "boolean"   // Optional: Field requirement
        }
      ]
    }
  ]
}
```

### **Field Types**
- `string`: Text data (supports enum constraints)
- `number`: Numeric data
- `boolean`: True/false values
- `timestamp`: Date/time data

### **Validation Rules**
1. **Schema Level**: JSON Schema compliance
2. **Business Level**: Custom rule enforcement
3. **Constraint Level**: Field-specific validations

## 🚀 **Usage Patterns**

### **For AI Agents Working with Code**

#### **1. Schema Validation**
```javascript
// Load and use schema
import { loadSchema } from './scripts/utils/schema-loader.mjs';
const validate = await loadSchema();
const isValid = validate(bprintData);
```

#### **2. Custom Validation**
```javascript
// Apply business rules
import { validateCustomRules } from './scripts/utils/validation-helpers.mjs';
const errors = validateCustomRules(bprintData);
```

#### **3. File Processing**
```javascript
// Validate individual files
import { validateSingleFile } from './scripts/validate-single.mjs';
const result = await validateSingleFile('path/to/file.bprint');
```

### **Common AI Agent Tasks**

#### **Schema Analysis**
- Parse .bprint files for structure understanding
- Validate schema compliance
- Extract entity and field information
- Analyze relationships and constraints

#### **Code Generation**
- Generate validation code based on schemas
- Create test fixtures from schema definitions
- Produce documentation from schema metadata
- Generate client libraries for different languages

#### **Quality Assurance**
- Validate .bprint files in CI/CD pipelines
- Check schema consistency across projects
- Enforce naming conventions and patterns
- Monitor schema evolution and breaking changes

## 🔍 **Key Functions & APIs**

### **Schema Loading**
```javascript
// Primary function for AI agents
export const loadSchema = async (schemaPath = 'schema/bprint.schema.json') => {
  // Returns compiled validation function
  // Handles caching and error handling
}
```

### **Custom Validation**
```javascript
// Business rule enforcement
export const validateCustomRules = (json) => {
  // Returns array of validation errors
  // Checks duplicates, constraints, etc.
}
```

### **File Validation**
```javascript
// Single file validation with detailed results
export const validateSingleFile = async (filePath) => {
  // Returns validation result object
  // Includes errors, counts, metadata
}
```

## 📊 **Data Models**

### **Validation Result Structure**
```typescript
interface ValidationResult {
  file: string;           // File path
  valid: boolean;         // Validation success
  errors: Error[];        // Array of validation errors
  entityCount: number;    // Number of entities
  fieldCount: number;     // Number of fields
  schemaInfo?: SchemaInfo; // Schema metadata
}
```

### **Error Structure**
```typescript
interface ValidationError {
  message: string;        // Human-readable error
  instancePath?: string;  // JSON path to error
  keyword?: string;       // Validation keyword
}
```

## 🧪 **Testing & Validation**

### **Test Fixtures Available**
- **Valid Examples**: `tests/fixtures/valid/*.bprint`
- **Invalid Examples**: `tests/fixtures/invalid/*.bprint`
- **Integration Tests**: `tests/integration/*.mjs`

### **Test Commands**
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

## 🔧 **Configuration Options**

### **Validation Configuration**
File: `config/validation.json`
```json
{
  "strictMode": false,
  "maxErrors": 100,
  "customRules": {
    "checkDuplicateNames": true,
    "validateEnumValues": true
  }
}
```

### **Code Quality Configuration**
- **ESLint**: `eslint.config.js` (ESLint v9 flat config)
- **Prettier**: `.prettierrc` (code formatting rules)
- **Editor**: `.editorconfig` (editor consistency)

## 🚨 **Common Issues & Solutions**

### **For AI Agents**

#### **1. Schema Loading Failures**
- **Cause**: Missing or malformed schema file
- **Solution**: Check file path and JSON syntax
- **Code**: Use try-catch around `loadSchema()`

#### **2. Validation Errors**
- **Cause**: Schema violations or business rule failures
- **Solution**: Check error messages and fix violations
- **Code**: Parse `ValidationResult.errors` array

#### **3. Performance Issues**
- **Cause**: Large schemas or many files
- **Solution**: Schema is cached after first load
- **Code**: Reuse `loadSchema()` result

## 🔮 **Future Extensibility**

### **Planned Features**
- Schema version migration tools
- IDE extensions and plugins
- Code generation for multiple languages
- Cloud provider integrations
- Schema registry and management

### **Extension Points**
- Custom validation rules in `validation-helpers.mjs`
- New field types in schema definition
- Additional CLI commands in `scripts/`
- Enhanced test fixtures and scenarios

## 📚 **Related Documentation**

- **README.md**: Human-focused project overview
- **LICENSE**: Apache-2.0 license terms
- **package.json**: Dependencies and scripts
- **CI/CD**: `.github/workflows/ci.yml`

## 🤖 **AI Agent Best Practices**

### **When Working with This Codebase**

1. **Always validate schemas** before processing .bprint files
2. **Use utility functions** from `scripts/utils/` for common tasks
3. **Handle errors gracefully** with proper error parsing
4. **Cache schema instances** when processing multiple files
5. **Follow established patterns** in test fixtures and examples
6. **Respect configuration** in `config/validation.json`

### **Code Generation Guidelines**

1. **Generate comprehensive tests** for new features
2. **Follow existing naming conventions** and patterns
3. **Include proper error handling** and validation
4. **Add documentation** for new functions and APIs
5. **Update configuration** when adding new options

---

**Note for AI Agents**: This document is designed to be parsed programmatically. Use the structured sections and code examples to understand how to interact with the codebase effectively. When in doubt, refer to the test fixtures and utility functions for implementation patterns.
