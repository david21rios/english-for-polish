import assert from "node:assert/strict";
import test from "node:test";
import { compareCanonicalTarget } from "../migration/legacyMigrationTargetComparison.js";

const expected = {
  exists: true,
  comparable: true,
  entityType: "identity",
  targetId: "uid-1",
  tenantId: "tenant-1",
  semanticFields: { uid: "uid-1", email: "person@example.com", emailVerified: true },
} as const;

test("canonical target comparison covers all four closed outcomes", () => {
  assert.equal(compareCanonicalTarget(expected, { ...expected, exists: false }), "TARGET_ABSENT");
  assert.equal(compareCanonicalTarget(expected, { ...expected, semanticFields: { ...expected.semanticFields } }), "SEMANTIC_MATCH");
  assert.equal(compareCanonicalTarget(expected, { ...expected, semanticFields: { ...expected.semanticFields, email: "other@example.com" } }), "CONFLICT");
  assert.equal(compareCanonicalTarget(expected, { ...expected, comparable: false }), "UNCOMPARABLE");
});

test("comparison includes all supplied stable business fields and ignores no field", () => {
  const withExtraStableField = { ...expected, semanticFields: { ...expected.semanticFields, displayName: "Person" } };
  assert.equal(compareCanonicalTarget(expected, withExtraStableField), "CONFLICT");
});
