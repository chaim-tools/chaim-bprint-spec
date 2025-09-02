import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadSchema } from '../../scripts/utils/schema-loader.mjs';
import { validateCustomRules, countEntitiesAndFields } from '../../scripts/utils/validation-helpers.mjs';

/**
 * Integration test that demonstrates the full validation workflow
 */
test('End-to-End Validation Workflow', async (t) => {
  
  await t.test('complete validation workflow with real examples', async () => {
    // 1. Load schema
    const validate = await loadSchema();
    
    // 2. Test a complex valid example
    const productsExample = JSON.parse(
      await readFile('tests/fixtures/valid/products.bprint', 'utf8')
    );
    
    // 3. Validate against JSON Schema
    const schemaValid = validate(productsExample);
    assert.equal(schemaValid, true, 'Products example should pass schema validation');
    
    // 4. Apply custom business rules
    const customErrors = validateCustomRules(productsExample);
    assert.equal(customErrors.length, 0, 'Products example should pass custom validation');
    
    // 5. Count entities and fields
    const { entityCount, fieldCount } = countEntitiesAndFields(productsExample);
    assert.equal(entityCount, 1, 'Should have 1 entity');
    assert.equal(fieldCount, 7, 'Should have 7 fields');
    
    // 6. Verify metadata is present
    assert.ok(productsExample.metadata, 'Should have metadata');
    assert.equal(productsExample.metadata.owner, 'product-team');
    
    // 7. Verify complex field types
    const productEntity = productsExample.entities[0];
    const tagsField = productEntity.fields.find(f => f.name === 'tags');
    assert.ok(tagsField.enum, 'Tags field should have enum values');
    assert.deepEqual(tagsField.enum, ['electronics', 'clothing', 'books']);
    
    // 8. Verify annotations
    assert.ok(productEntity.annotations, 'Should have annotations');
    assert.equal(productEntity.annotations.pii, false);
    assert.equal(productEntity.annotations.retention, '7years');
  });
  
  await t.test('validation rejects invalid schemas appropriately', async () => {
    const validate = await loadSchema();
    
    // Test invalid enum
    const invalidEnumExample = JSON.parse(
      await readFile('tests/fixtures/invalid/invalid-enum.bprint', 'utf8')
    );
    
    const isValid = validate(invalidEnumExample);
    assert.equal(isValid, false, 'Invalid enum should be rejected');
    
    // Test missing partition key
    const missingKeyExample = JSON.parse(
      await readFile('tests/fixtures/invalid/missing-partition-key.bprint', 'utf8')
    );
    
    const isKeyValid = validate(missingKeyExample);
    assert.equal(isKeyValid, false, 'Missing partition key should be rejected');
  });
  
  await t.test('custom validation rules catch business logic errors', async () => {
    // Test duplicate entity names
    const duplicateEntities = {
      schemaVersion: 'v1',
      namespace: 'test',
      entities: [
        { name: 'User', primaryKey: { partitionKey: 'id' }, fields: [{ name: 'id', type: 'string', required: true }] },
        { name: 'User', primaryKey: { partitionKey: 'id' }, fields: [{ name: 'id', type: 'string', required: true }] }
      ]
    };
    
    const errors = validateCustomRules(duplicateEntities);
    assert.ok(errors.length > 0, 'Should detect duplicate entity names');
    assert.ok(errors.some(e => e.includes('Duplicate entity names')), 'Should have duplicate entity error');
    
    // Test duplicate field names
    const duplicateFields = {
      schemaVersion: 'v1',
      namespace: 'test',
      entities: [{
        name: 'User',
        primaryKey: { partitionKey: 'id' },
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'id', type: 'string', required: true }
        ]
      }]
    };
    
    const fieldErrors = validateCustomRules(duplicateFields);
    assert.ok(fieldErrors.length > 0, 'Should detect duplicate field names');
    assert.ok(fieldErrors.some(e => e.includes('duplicate field names')), 'Should have duplicate field error');
  });
});
