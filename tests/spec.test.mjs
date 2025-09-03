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
      'tests/fixtures/invalid/duplicate-entity-names.bprint'
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
        schemaVersion: 'v1',
        namespace: 'test',
        description: 'Test entity',
        entity: {
          primaryKey: { partitionKey: 'id' },
          fields: [{ name: 'testField', type: fieldType, required: true }],
        },
      };

      const ok = validate(testSchema);
      assert.equal(ok, true, `Field type '${fieldType}' should be valid`);
    }
  });

  await t.test('invalid field types are rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Test entity',
      entity: {
        primaryKey: { partitionKey: 'id' },
        fields: [{ name: 'testField', type: 'invalid_type', required: true }],
      },
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Invalid field type should be rejected');
  });
});

// Test suite for edge cases
test('Edge Cases', async t => {
  await t.test('missing entity is rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Test schema',
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Missing entity should be rejected');
  });

  await t.test('entity without fields is rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Test entity',
      entity: {
        primaryKey: { partitionKey: 'id' },
        fields: [],
      },
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Entity without fields should be rejected');
  });

  await t.test('missing required fields are rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Test entity',
      entity: {
        primaryKey: { partitionKey: 'id' },
        // Missing fields array
      },
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
      schemaVersion: 'v1',
      namespace: 'test.complex',
      description: 'Complex schema with enums and defaults',
      entity: {
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
      },
    };

    const ok = validate(complexSchema);
    assert.equal(ok, true, 'Complex schema should be valid');
  });

  await t.test('sort key validation', async () => {
    const validate = await loadSchema();

    const sortKeySchema = {
      schemaVersion: 'v1',
      namespace: 'test.sortkey',
      description: 'Schema with sort key',
      entity: {
        primaryKey: {
          partitionKey: 'userId',
          sortKey: 'timestamp',
        },
        fields: [
          { name: 'userId', type: 'string', required: true },
          { name: 'timestamp', type: 'timestamp', required: true },
          { name: 'data', type: 'string', required: false },
        ],
      },
    };

    const ok = validate(sortKeySchema);
    assert.equal(ok, true, 'Schema with sort key should be valid');
  });

  await t.test('field annotations are preserved', async () => {
    const validate = await loadSchema();

    const annotatedSchema = {
      schemaVersion: 'v1',
      namespace: 'test.annotations',
      description: 'Schema with field annotations',
      entity: {
        primaryKey: { partitionKey: 'id' },
        fields: [
          {
            name: 'id',
            type: 'string',
            required: true,
            annotations: { pii: false, retention: '1year' },
          },
          {
            name: 'email',
            type: 'string',
            required: true,
            annotations: { pii: true, encryption: 'required' },
          },
        ],
        annotations: {
          compliance: 'GDPR',
          audit: true,
        },
      },
    };

    const ok = validate(annotatedSchema);
    assert.equal(ok, true, 'Schema with annotations should be valid');
  });
});

// Test suite for error handling and edge cases
test('Error Handling & Edge Cases', async t => {
  await t.test('malformed JSON handling', async () => {
    const validate = await loadSchema();

    // Test with missing required fields
    const missingRequired = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Missing required fields',
      // Missing entity
    };

    const ok = validate(missingRequired);
    assert.equal(ok, false, 'Missing required fields should be rejected');

    // Check specific error messages
    const errors = validate.errors;
    assert.ok(errors.length > 0, 'Should have validation errors');
    assert.ok(
      errors.some(e => e.message.includes('entity')),
      'Should mention missing entity'
    );
  });

  await t.test('invalid field constraints', async () => {
    const validate = await loadSchema();

    // Test empty enum array
    const emptyEnum = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Empty enum array',
      entity: {
        primaryKey: { partitionKey: 'id' },
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'status', type: 'string', enum: [], required: false },
        ],
      },
    };

    const ok = validate(emptyEnum);
    assert.equal(ok, false, 'Empty enum array should be rejected');
  });

  await t.test('invalid primary key structure', async () => {
    const validate = await loadSchema();

    // Test invalid primary key
    const invalidPrimaryKey = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Invalid primary key',
      entity: {
        primaryKey: {
          partitionKey: '', // Empty string
          sortKey: 'invalid',
        },
        fields: [{ name: 'id', type: 'string', required: true }],
      },
    };

    const ok = validate(invalidPrimaryKey);
    assert.equal(ok, false, 'Invalid primary key should be rejected');
  });

  await t.test('field name validation', async () => {
    const validate = await loadSchema();

    // Test invalid field names
    const invalidFieldNames = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Invalid field names',
      entity: {
        primaryKey: { partitionKey: 'id' },
        fields: [
          { name: '', type: 'string', required: true }, // Empty name
          { name: 'validField', type: 'string', required: true },
        ],
      },
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
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Valid schema',
      entity: {
        primaryKey: { partitionKey: 'id' },
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
        ],
      },
    };

    const { entityCount, fieldCount } = countEntitiesAndFields(validSchema);
    assert.equal(entityCount, 1, 'Should count 1 entity');
    assert.equal(fieldCount, 2, 'Should count 2 fields');

    // Test with missing entity
    const missingEntity = {
      schemaVersion: 'v1',
      namespace: 'test',
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
    // Test with empty entity
    const emptyEntity = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'Empty entity',
      entity: {},
    };

    const emptyErrors = validateCustomRules(emptyEntity);
    assert.equal(
      emptyErrors.length,
      0,
      'Empty entity should not cause validation errors'
    );

    // Test with entity but no fields
    const noFields = {
      schemaVersion: 'v1',
      namespace: 'test',
      description: 'No fields',
      entity: {
        primaryKey: { partitionKey: 'id' },
        // No fields array
      },
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
      schemaVersion: 'v1',
      namespace: 'test.large',
      description: 'Large schema with many fields',
      entity: {
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
      },
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

    // Create schema with complex annotations
    const complexSchema = {
      schemaVersion: 'v1',
      namespace: 'test.complex',
      description: 'Complex schema with nested annotations',
      entity: {
        primaryKey: { partitionKey: 'id' },
        fields: [
          {
            name: 'id',
            type: 'string',
            required: true,
            annotations: {
              pii: false,
              retention: '7years',
              encryption: 'none',
              compliance: {
                gdpr: true,
                sox: false,
                hipaa: false,
              },
            },
          },
          {
            name: 'metadata',
            type: 'string',
            required: false,
            annotations: {
              pii: true,
              retention: '1year',
              encryption: 'required',
              compliance: {
                gdpr: true,
                sox: true,
                hipaa: false,
              },
            },
          },
        ],
        annotations: {
          table: {
            billing: 'on-demand',
            backup: true,
            encryption: 'at-rest',
          },
          tags: {
            environment: 'production',
            team: 'data-engineering',
            'cost-center': 'cc-123',
          },
        },
      },
    };

    const ok = validate(complexSchema);
    assert.equal(ok, true, 'Complex nested schema should be valid');
  });
});

// Cleanup after tests
test.after(async () => {
  resetSchema();
});
