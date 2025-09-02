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
    // Test duplicate entity names
    const duplicateEntities = await loadFixture(
      'tests/fixtures/invalid/duplicate-entity-names.bprint'
    );
    const errors = validateCustomRules(duplicateEntities);

    assert.ok(errors.length > 0, 'Should detect duplicate entity names');
    assert.ok(
      errors.some(e => e.includes('Duplicate entity names')),
      'Should have duplicate entity error'
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
        entities: [
          {
            name: 'TestEntity',
            primaryKey: { partitionKey: 'id' },
            fields: [{ name: 'testField', type: fieldType, required: true }],
          },
        ],
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
      entities: [
        {
          name: 'TestEntity',
          primaryKey: { partitionKey: 'id' },
          fields: [{ name: 'testField', type: 'invalid_type', required: true }],
        },
      ],
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Invalid field type should be rejected');
  });
});

// Test suite for edge cases
test('Edge Cases', async t => {
  await t.test('empty entities array is rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 'v1',
      namespace: 'test',
      entities: [],
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Empty entities array should be rejected');
  });

  await t.test('entity without fields is rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 'v1',
      namespace: 'test',
      entities: [
        {
          name: 'TestEntity',
          primaryKey: { partitionKey: 'id' },
          fields: [],
        },
      ],
    };

    const ok = validate(testSchema);
    assert.equal(ok, false, 'Entity without fields should be rejected');
  });

  await t.test('missing required fields are rejected', async () => {
    const validate = await loadSchema();

    const testSchema = {
      schemaVersion: 'v1',
      namespace: 'test',
      entities: [
        {
          name: 'TestEntity',
          primaryKey: { partitionKey: 'id' },
          // Missing fields array
        },
      ],
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

// Cleanup after tests
test.after(async () => {
  resetSchema();
});
