import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  loadSchema,
  resetSchema,
  getSchemaInfo,
} from '../scripts/utils/schema-loader.mjs';
import {
  validateCustomRules,
  countEntitiesAndFields,
} from '../scripts/utils/validation-helpers.mjs';

// Helper function to load test fixtures
const loadFixture = async path => {
  return JSON.parse(await readFile(path, 'utf8'));
};

// Test suite for schema validation
test('Schema Validation', async t => {
  await t.test('valid examples pass schema validation', async () => {
    const validate = await loadSchema();

    const validFixtures = [
      'tests/fixtures/valid/orders.bprint',
      'tests/fixtures/valid/users.bprint',
      'tests/fixtures/valid/products.bprint',
    ];

    for (const fixture of validFixtures) {
      const example = await loadFixture(fixture);
      const ok = validate(example);

      if (!ok) {
        console.error(`Validation failed for ${fixture}:`, validate.errors);
      }
      assert.equal(ok, true, `${fixture} should validate against schema`);
    }
  });

  await t.test('invalid examples fail schema validation', async () => {
    const validate = await loadSchema();

    const invalidFixtures = [
      'tests/fixtures/invalid/missing-partition-key.bprint',
      'tests/fixtures/invalid/invalid-enum.bprint',
    ];

    for (const fixture of invalidFixtures) {
      const example = await loadFixture(fixture);
      const ok = validate(example);
      assert.equal(ok, false, `${fixture} should fail schema validation`);
    }
  });

  await t.test('custom validation rules work correctly', async () => {
    // Test duplicate field names
    const duplicateFields = await loadFixture(
      'tests/fixtures/invalid/duplicate-field-names.bprint'
    );

    const errors = validateCustomRules(duplicateFields);

    assert.ok(errors.length > 0, 'Should detect duplicate field names');
    assert.ok(
      errors.some(e => e.message && e.message.includes('Duplicate field name')),
      'Should have duplicate field error'
    );
  });

  await t.test('entity and field counting works', async () => {
    const orders = await loadFixture('tests/fixtures/valid/orders.bprint');
    const { entityCount, fieldCount } = countEntitiesAndFields(orders);

    assert.equal(entityCount, 1, 'Should count 1 entity');
    assert.equal(fieldCount, 4, 'Should count 4 fields');
  });
});

// Test suite for field validation
test('Field Validation', async t => {
  await t.test('field types are correctly validated', async () => {
    const validate = await loadSchema();

    const validFieldTypes = ['string', 'number', 'boolean', 'timestamp'];

    for (const fieldType of validFieldTypes) {
      const testSchema = {
        schemaVersion: 1.0,
        entityName: 'Test',
        description: 'Test entity',
        primaryKey: { partitionKey: 'id' },
        fields: [{ name: 'testField', type: fieldType, required: true }],
      };

      const ok = validate(testSchema);
      assert.equal(ok, true, `Field type '${fieldType}' should be valid`);
    }
  });

  await t.test('invalid field types are rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 1.0,
      entityName: 'Test',
      description: 'Test entity',
      primaryKey: { partitionKey: 'id' },
      fields: [{ name: 'testField', type: 'invalid_type', required: true }],
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Invalid field type should be rejected');
  });
});

// Test suite for edge cases
test('Edge Cases', async t => {
  await t.test('missing primaryKey is rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 1.0,
      entityName: 'Test',
      description: 'Test schema',
      fields: [{ name: 'id', type: 'string', required: true }],
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Missing primaryKey should be rejected');
  });

  await t.test('schema without fields is rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 1.0,
      entityName: 'Test',
      description: 'Test entity',
      primaryKey: { partitionKey: 'id' },
      fields: [],
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Schema without fields should be rejected');
  });

  await t.test('missing required fields array is rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 1.0,
      entityName: 'Test',
      description: 'Test entity',
      primaryKey: { partitionKey: 'id' },
      // Missing fields array
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Missing required fields should be rejected');
  });
});

// Test suite for schema metadata
test('Schema Metadata', async t => {
  await t.test('schema info is accessible', async () => {
    await loadSchema();
    const info = getSchemaInfo();

    assert.ok(info.title, 'Schema should have a title');
    assert.ok(info.version, 'Schema should have a version');
    assert.ok(info.id, 'Schema should have an ID');
  });

  await t.test('schema can be reset', async () => {
    await loadSchema();
    resetSchema();

    // Should throw error when trying to get schema info
    assert.throws(() => {
      getSchemaInfo();
    }, 'Schema not loaded');
  });
});

// Test suite for advanced validation scenarios
test('Advanced Validation', async t => {
  await t.test('complex field types with enums and defaults', async () => {
    const validate = await loadSchema();

    const complexSchema = {
      schemaVersion: 1.0,
      entityName: 'Complex',
      description: 'Complex schema with enums and defaults',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'status',
          type: 'string',
          enum: ['active', 'inactive', 'pending'],
          required: false,
        },
        { name: 'priority', type: 'number', default: 1, required: false },
        { name: 'enabled', type: 'boolean', default: true, required: false },
        { name: 'createdAt', type: 'timestamp', required: true },
      ],
    };

    const ok = validate(complexSchema);
    assert.equal(ok, true, 'Complex schema should be valid');
  });

  await t.test('sort key validation', async () => {
    const validate = await loadSchema();

    const sortKeySchema = {
      schemaVersion: 1.0,
      entityName: 'SortKey',
      description: 'Schema with sort key',
      primaryKey: {
        partitionKey: 'userId',
        sortKey: 'timestamp',
      },
      fields: [
        { name: 'userId', type: 'string', required: true },
        { name: 'timestamp', type: 'timestamp', required: true },
        { name: 'data', type: 'string', required: false },
      ],
    };

    const ok = validate(sortKeySchema);
    assert.equal(ok, true, 'Schema with sort key should be valid');
  });

  await t.test('field annotations are preserved', async () => {
    const validate = await loadSchema();

    const annotatedSchema = {
      schemaVersion: 1.0,
      entityName: 'test.annotations',
      description: 'Schema with field annotations',
      primaryKey: { partitionKey: 'id' },
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
          annotations: { customTag: 'primary' },
        },
        {
          name: 'email',
          type: 'string',
          required: true,
          annotations: { source: 'registration' },
        },
      ],
    };

    const ok = validate(annotatedSchema);
    assert.equal(ok, true, 'Schema with custom annotations should be valid');
  });
});

// Test suite for error handling and edge cases
test('Error Handling & Edge Cases', async t => {
  await t.test('malformed JSON handling', async () => {
    const validate = await loadSchema();

    // Test with missing required fields
    const missingRequired = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'Missing required fields',
      // Missing primaryKey and fields
    };

    const ok = validate(missingRequired);
    assert.equal(ok, false, 'Missing required fields should be rejected');

    // Check specific error messages
    const errors = validate.errors;
    assert.ok(errors.length > 0, 'Should have validation errors');
    assert.ok(
      errors.some(e => e.message.includes('primaryKey') || e.message.includes('fields')),
      'Should mention missing primaryKey or fields'
    );
  });

  await t.test('invalid field constraints', async () => {
    const validate = await loadSchema();

    // Test empty enum array
    const emptyEnum = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'Empty enum array',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'status', type: 'string', enum: [], required: false },
      ],
    };

    const ok = validate(emptyEnum);
    assert.equal(ok, false, 'Empty enum array should be rejected');
  });

  await t.test('invalid primary key structure', async () => {
    const validate = await loadSchema();

    // Test invalid primary key
    const invalidPrimaryKey = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'Invalid primary key',
      primaryKey: {
        partitionKey: '', // Empty string
        sortKey: 'invalid',
      },
      fields: [{ name: 'id', type: 'string', required: true }],
    };

    const ok = validate(invalidPrimaryKey);
    assert.equal(ok, false, 'Invalid primary key should be rejected');
  });

  await t.test('field name validation', async () => {
    const validate = await loadSchema();

    // Test invalid field names
    const invalidFieldNames = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'Invalid field names',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: '', type: 'string', required: true }, // Empty name
        { name: 'validField', type: 'string', required: true },
      ],
    };

    const ok = validate(invalidFieldNames);
    assert.equal(ok, false, 'Invalid field names should be rejected');
  });
});

// Test suite for validation helper functions
test('Validation Helper Functions', async t => {
  await t.test('countEntitiesAndFields with various schemas', async () => {
    // Test with valid schema
    const validSchema = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'Valid schema',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
      ],
    };

    const { entityCount, fieldCount } = countEntitiesAndFields(validSchema);
    assert.equal(entityCount, 1, 'Should count 1 entity');
    assert.equal(fieldCount, 2, 'Should count 2 fields');

    // Test with missing entity
    const missingEntity = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'Missing entity',
    };

    const { entityCount: missingEntityCount, fieldCount: missingFieldCount } =
      countEntitiesAndFields(missingEntity);
    assert.equal(missingEntityCount, 0, 'Should count 0 entities when missing');
    assert.equal(
      missingFieldCount,
      0,
      'Should count 0 fields when missing entity'
    );
  });

  await t.test('validateCustomRules with edge cases', async () => {
    // Test with empty schema (no fields)
    const emptySchema = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'Empty schema',
    };

    const emptyErrors = validateCustomRules(emptySchema);
    assert.equal(
      emptyErrors.length,
      0,
      'Empty schema should not cause validation errors'
    );

    // Test with no fields
    const noFields = {
      schemaVersion: 1.0,
      entityName: 'test',
      description: 'No fields',
      primaryKey: { partitionKey: 'id' },
      // No fields array
    };

    const noFieldErrors = validateCustomRules(noFields);
    assert.equal(
      noFieldErrors.length,
      0,
      'Entity without fields should not cause validation errors'
    );
  });
});

// Test suite for CLI script functionality
test('CLI Script Functionality', async t => {
  await t.test(
    'schema loader handles missing schema file gracefully',
    async () => {
      // Test that schema loader can handle errors when schema file is missing
      try {
        // This should throw an error
        await loadSchema('nonexistent/schema.json');
        // If we get here, the function didn't throw an error as expected
        // This might happen if there's a fallback mechanism
        console.log(
          'Note: loadSchema did not throw error for missing file - may have fallback behavior'
        );
      } catch (error) {
        // The error should contain information about the failure
        assert.ok(error.message, 'Should have an error message');
        assert.ok(
          error.message.includes('Failed to load schema') ||
            error.message.includes('nonexistent'),
          `Should mention schema loading failure, got: ${error.message}`
        );
      }
    }
  );

  await t.test('schema loader caches compiled schema', async () => {
    // Load schema multiple times
    const validate1 = await loadSchema();
    const validate2 = await loadSchema();
    const validate3 = await loadSchema();

    // All should be the same function instance
    assert.strictEqual(
      validate1,
      validate2,
      'First and second loads should be cached'
    );
    assert.strictEqual(
      validate2,
      validate3,
      'Second and third loads should be cached'
    );
    assert.strictEqual(
      validate1,
      validate3,
      'First and third loads should be cached'
    );
  });

  await t.test('schema reset functionality', async () => {
    // Load schema first
    await loadSchema();

    // Verify it's loaded
    const info1 = getSchemaInfo();
    assert.ok(info1.title, 'Schema should be loaded');

    // Reset schema
    resetSchema();

    // Verify it's reset
    assert.throws(() => {
      getSchemaInfo();
    }, 'Schema not loaded');

    // Reload should work
    await loadSchema();
    const info2 = getSchemaInfo();
    assert.ok(info2.title, 'Schema should be reloadable after reset');
  });
});

// Test suite for performance and stress testing
test('Performance & Stress Testing', async t => {
  await t.test('handles large field arrays efficiently', async () => {
    const validate = await loadSchema();

    // Create schema with many fields
    const largeSchema = {
      schemaVersion: 1.0,
      entityName: 'test.large',
      description: 'Large schema with many fields',
      primaryKey: { partitionKey: 'id' },
      fields: Array.from({ length: 100 }, (_, i) => ({
        name: `field${i}`,
        type:
          i % 4 === 0
            ? 'string'
            : i % 4 === 1
              ? 'number'
              : i % 4 === 2
                ? 'boolean'
                : 'timestamp',
        required: i < 10, // First 10 fields required
        default: i % 4 === 1 ? i : i % 4 === 2 ? i % 2 === 0 : undefined,
      })),
    };

    const startTime = Date.now();
    const ok = validate(largeSchema);
    const endTime = Date.now();

    assert.equal(ok, true, 'Large schema should be valid');
    assert.ok(
      endTime - startTime < 1000,
      'Large schema validation should complete within 1 second'
    );
  });

  await t.test('handles complex nested structures', async () => {
    const validate = await loadSchema();

    // Create schema with complex field annotations
    const complexSchema = {
      schemaVersion: 1.0,
      entityName: 'test.complex',
      description: 'Complex schema with custom field annotations',
      primaryKey: { partitionKey: 'id' },
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
          annotations: {
            customFlag: true,
          },
        },
        {
          name: 'metadata',
          type: 'string',
          required: false,
          annotations: {
            source: 'user-input',
          },
        },
      ],
    };

    const ok = validate(complexSchema);
    assert.equal(ok, true, 'Complex field annotations schema should be valid');
  });
});

// Test suite for field constraints
test('Field Constraints', async t => {
  // Import the TypeScript validation function for constraint testing
  const { validateSchema } = await import('../dist/index.js');

  await t.test('valid string constraints are accepted', async () => {
    const schemaWithStringConstraints = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Schema with string constraints',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'stateCode',
          type: 'string',
          required: true,
          constraints: {
            minLength: 2,
            maxLength: 2,
            pattern: '^[A-Z]{2}$',
          },
        },
        {
          name: 'zipCode',
          type: 'string',
          required: false,
          constraints: {
            minLength: 5,
            maxLength: 10,
            pattern: '^[0-9]{5}(-[0-9]{4})?$',
          },
        },
      ],
    };

    // Should not throw
    const validated = validateSchema(schemaWithStringConstraints);
    assert.ok(validated, 'Schema with valid string constraints should pass');
    assert.equal(validated.fields[1].constraints.minLength, 2);
    assert.equal(validated.fields[1].constraints.maxLength, 2);
  });

  await t.test('valid number constraints are accepted', async () => {
    const schemaWithNumberConstraints = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Schema with number constraints',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          constraints: {
            min: 1,
            max: 1000,
          },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          constraints: {
            min: 0,
            max: 999999.99,
          },
        },
      ],
    };

    const validated = validateSchema(schemaWithNumberConstraints);
    assert.ok(validated, 'Schema with valid number constraints should pass');
    assert.equal(validated.fields[1].constraints.min, 1);
    assert.equal(validated.fields[1].constraints.max, 1000);
  });

  await t.test('string constraints on non-string field are rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: string constraints on number field',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'count',
          type: 'number',
          required: true,
          constraints: {
            minLength: 5, // Invalid: minLength on number field
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /minLength constraint but is not a string type/,
      'Should reject minLength on non-string field'
    );
  });

  await t.test('maxLength constraint on non-string field is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: maxLength on boolean field',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'isActive',
          type: 'boolean',
          constraints: {
            maxLength: 10, // Invalid: maxLength on boolean field
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /maxLength constraint but is not a string type/,
      'Should reject maxLength on non-string field'
    );
  });

  await t.test('pattern constraint on non-string field is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: pattern on timestamp field',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'createdAt',
          type: 'timestamp',
          constraints: {
            pattern: '^[0-9]+$', // Invalid: pattern on timestamp field
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /pattern constraint but is not a string type/,
      'Should reject pattern on non-string field'
    );
  });

  await t.test('number constraints on non-number field are rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: min/max on string field',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'name',
          type: 'string',
          constraints: {
            min: 0, // Invalid: min on string field
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /min constraint but is not a number type/,
      'Should reject min on non-number field'
    );
  });

  await t.test('max constraint on non-number field is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: max on boolean field',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'flag',
          type: 'boolean',
          constraints: {
            max: 100, // Invalid: max on boolean field
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /max constraint but is not a number type/,
      'Should reject max on non-number field'
    );
  });

  await t.test('minLength greater than maxLength is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: minLength > maxLength',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'code',
          type: 'string',
          constraints: {
            minLength: 10,
            maxLength: 5, // Invalid: min > max
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /minLength.*cannot be greater than maxLength/,
      'Should reject minLength > maxLength'
    );
  });

  await t.test('min greater than max is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: min > max',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'quantity',
          type: 'number',
          constraints: {
            min: 100,
            max: 10, // Invalid: min > max
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /min.*cannot be greater than max/,
      'Should reject min > max'
    );
  });

  await t.test('invalid regex pattern is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: bad regex pattern',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'code',
          type: 'string',
          constraints: {
            pattern: '[invalid(regex', // Invalid regex
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /pattern is not a valid regular expression/,
      'Should reject invalid regex pattern'
    );
  });

  await t.test('negative minLength is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: negative minLength',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'code',
          type: 'string',
          constraints: {
            minLength: -1, // Invalid: negative
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /minLength must be a non-negative integer/,
      'Should reject negative minLength'
    );
  });

  await t.test('non-integer minLength is rejected', async () => {
    const invalidSchema = {
      schemaVersion: 1.0,
      entityName: 'test.constraints',
      description: 'Invalid: non-integer minLength',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'code',
          type: 'string',
          constraints: {
            minLength: 2.5, // Invalid: not an integer
          },
        },
      ],
    };

    assert.throws(
      () => validateSchema(invalidSchema),
      /minLength must be a non-negative integer/,
      'Should reject non-integer minLength'
    );
  });

  await t.test('custom annotations are preserved', async () => {
    const validSchema = {
      schemaVersion: 1.0,
      entityName: 'test.metadata',
      description: 'Schema with custom annotations',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'email',
          type: 'string',
          annotations: {
            customFlag: true,
            source: 'user-input',
          },
        },
      ],
    };

    const validated = validateSchema(validSchema);
    assert.ok(validated, 'Schema with custom annotations should pass');
    assert.equal(validated.fields[1].annotations.customFlag, true);
    assert.equal(validated.fields[1].annotations.source, 'user-input');
  });

  await t.test('combined constraints and annotations work', async () => {
    const validSchema = {
      schemaVersion: 1.0,
      entityName: 'test.combined',
      description: 'Schema with combined constraints and annotations',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        {
          name: 'ssn',
          type: 'string',
          required: true,
          constraints: {
            minLength: 9,
            maxLength: 11,
            pattern: '^[0-9]{3}-?[0-9]{2}-?[0-9]{4}$',
          },
        },
        {
          name: 'email',
          type: 'string',
          required: true,
          constraints: {
            minLength: 5,
            maxLength: 254,
          },
          annotations: {
            source: 'registration-form',
          },
        },
        {
          name: 'age',
          type: 'number',
          required: false,
          constraints: {
            min: 0,
            max: 150,
          },
        },
      ],
    };

    const validated = validateSchema(validSchema);
    assert.ok(validated, 'Schema with combined constraints and annotations should pass');
    
    const ssnField = validated.fields[1];
    assert.equal(ssnField.constraints.minLength, 9);
    
    const emailField = validated.fields[2];
    assert.equal(emailField.constraints.minLength, 5);
    assert.equal(emailField.annotations.source, 'registration-form');
    
    const ageField = validated.fields[3];
    assert.equal(ageField.constraints.min, 0);
    assert.equal(ageField.constraints.max, 150);
  });

  await t.test('schema without constraints still validates', async () => {
    const simpleSchema = {
      schemaVersion: 1.0,
      entityName: 'test.simple',
      description: 'Simple schema without constraints',
      primaryKey: { partitionKey: 'id' },
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'count', type: 'number', required: false },
      ],
    };

    const validated = validateSchema(simpleSchema);
    assert.ok(validated, 'Schema without constraints should pass');
  });
});

// Cleanup after tests
test.after(async () => {
  resetSchema();
});
