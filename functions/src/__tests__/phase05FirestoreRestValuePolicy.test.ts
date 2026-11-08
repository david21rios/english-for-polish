import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_REST_VALUE_NODE_COUNT,
  MAX_REST_VALUE_RECURSION_DEPTH,
  PHASE05_FIRESTORE_REST_VALUE_DISCRIMINATORS,
  PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION,
  readPhase05FirestoreKnownScalar,
  validatePhase05FirestoreRestValue,
} from "../migration/phase05FirestoreRestValuePolicy.js";

const accepted = (value: unknown) => {
  const result = validatePhase05FirestoreRestValue(value);
  assert.equal(result.ok, true, JSON.stringify(result));
  return result;
};

const rejected = (value: unknown, code?: string) => {
  const result = validatePhase05FirestoreRestValue(value);
  assert.equal(result.ok, false);
  if (!result.ok && code !== undefined) assert.equal(result.failureCode, code);
  return result;
};

const nestedMaps = (containerCount: number): unknown => {
  let result: unknown = { stringValue: "leaf" };
  for (let index = 0; index < containerCount; index += 1) result = { mapValue: { fields: { child: result } } };
  return result;
};

test("policy version and discriminator set are frozen", () => {
  assert.equal(PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION, "phase05-firestore-rest-value-v1");
  assert.deepEqual(PHASE05_FIRESTORE_REST_VALUE_DISCRIMINATORS, [
    "arrayValue", "booleanValue", "bytesValue", "doubleValue", "geoPointValue", "integerValue",
    "mapValue", "nullValue", "referenceValue", "stringValue", "timestampValue",
  ]);
});

test("null and boolean use exact JSON types", () => {
  assert.equal(accepted({ nullValue: null }).providerType, "nullValue");
  rejected({ nullValue: "NULL_VALUE" });
  assert.equal(accepted({ booleanValue: false }).providerType, "booleanValue");
  assert.equal(accepted({ booleanValue: true }).providerType, "booleanValue");
  rejected({ booleanValue: 1 });
});

test("int64 accepts exact canonical boundaries and rejects coercion or noncanonical forms", () => {
  for (const integer of ["0", "1", "-1", "9223372036854775807", "-9223372036854775808"]) {
    assert.equal(accepted({ integerValue: integer }).providerType, "integerValue");
  }
  for (const integer of ["00", "01", "-0", "-01", "+1", "1.0", "9223372036854775808", "-9223372036854775809", 1, null]) {
    rejected({ integerValue: integer });
  }
});

test("double accepts only finite JSON numbers and safe scalar extraction", () => {
  for (const number of [0, -0, 1.25, -1.5, Number.MAX_VALUE]) assert.equal(accepted({ doubleValue: number }).providerType, "doubleValue");
  for (const value of ["1", "NaN", "Infinity", "-Infinity", true, null, Number.NaN, Number.POSITIVE_INFINITY, {}]) {
    rejected({ doubleValue: value }, "FIRESTORE_DOUBLE_REPRESENTATION_UNSUPPORTED_BY_PHASE05_POLICY");
  }
  assert.deepEqual(readPhase05FirestoreKnownScalar({ doubleValue: 2.5 }, ["doubleValue"]), {
    ok: true, providerType: "doubleValue", value: 2.5,
  });
});

test("timestamp accepts Firestore precision through nine digits without normalizing", () => {
  for (const fraction of ["", ".1", ".123", ".123456", ".123456789"]) {
    assert.equal(accepted({ timestampValue: `2024-02-29T12:34:56${fraction}+02:30` }).providerType, "timestampValue");
  }
  const timestamp = "2024-02-29T12:34:56.123456789+02:30";
  assert.equal(readPhase05FirestoreKnownScalar({ timestampValue: timestamp }, ["timestampValue"]).ok, false);
  rejected({ timestampValue: "2024-02-29T12:34:56.1234567890Z" });
  for (const value of ["2023-02-29T12:34:56Z", "2024-13-01T00:00:00Z", "2024-01-01T24:00:00Z", "2024-01-01T00:60:00Z", "2024-01-01T00:00:60Z", "2024-01-01T00:00:00+24:00", "2024-01-01", "2024-01-01T00:00:00+01:99"]) {
    rejected({ timestampValue: value });
  }
});

test("strings include empty strings but never coerce", () => {
  assert.equal(accepted({ stringValue: "" }).providerType, "stringValue");
  rejected({ stringValue: 1 });
});

test("bytes accept canonical padded base64url only", () => {
  for (const encoded of ["", "AA==", "AQI=", "-_8="]) assert.equal(accepted({ bytesValue: encoded }).providerType, "bytesValue");
  for (const encoded of ["+/8=", "AA", "A===", "AAA==", "AB==", "AQI", "AA==x"]) rejected({ bytesValue: encoded });
});

test("references require exact project, database, and even document-path segments", () => {
  for (const reference of [
    "projects/p/databases/(default)/documents/c/d",
    "projects/p/databases/(default)/documents/c1/d1/c2/d2",
    "projects/p/databases/(default)/documents/levels/A1/lessons/A1_1",
  ]) {
    assert.equal(accepted({ referenceValue: reference }).providerType, "referenceValue");
  }
  for (const reference of [
    "",
    "projects/p/extra/databases/(default)/documents/c/d",
    "projects/p/databases/db/extra/documents/c/d",
    "projects/databases/(default)/documents/c/d",
    "projects/p/databases/documents/c/d",
    "projects//databases/(default)/documents/c/d",
    "projects/p/databases//documents/c/d",
    "projects/p/database/(default)/documents/c/d",
    "projects/p/databases/(default)/c/d",
    "projects/p/databases/(default)/documents/c/d/",
    "projects/p/databases/(default)/documents/c//d",
    "projects/p/databases/(default)/documents/c",
    "projects/p/databases/(default)/documents/c/d/e",
    "projects/p/databases/(default)/documents",
  ]) {
    rejected({ referenceValue: reference });
  }
});

test("GeoPoint validates exact finite coordinates and ranges", () => {
  assert.equal(accepted({ geoPointValue: { latitude: -90, longitude: 180 } }).providerType, "geoPointValue");
  assert.equal(accepted({ geoPointValue: { latitude: 90, longitude: -180 } }).providerType, "geoPointValue");
  rejected({ geoPointValue: { latitude: Number.NaN, longitude: 0 } });
  rejected({ geoPointValue: { latitude: 90.01, longitude: 0 } });
  rejected({ geoPointValue: { latitude: 0, longitude: 180.01 } });
  rejected({ geoPointValue: { latitude: 0, longitude: 0, extra: true } }, "REST_VALUE_EXTRA_PROPERTY");
});

test("arrays require explicit values and recursively validate children", () => {
  assert.equal(accepted({ arrayValue: { values: [] } }).providerType, "arrayValue");
  assert.equal(accepted({ arrayValue: { values: [{ stringValue: "x" }, { integerValue: "2" }] } }).providerType, "arrayValue");
  rejected({ arrayValue: {} });
  rejected({ arrayValue: { values: {} } });
  rejected({ arrayValue: { values: [], extra: true } }, "REST_VALUE_EXTRA_PROPERTY");
  rejected({ arrayValue: { values: [{ arrayValue: { values: [] } }] } }, "REST_VALUE_INVALID_NESTED_VALUE");
  assert.equal(accepted({ arrayValue: { values: [{ mapValue: { fields: { nested: { arrayValue: { values: [] } } } } }] } }).providerType, "arrayValue");
});

test("maps require explicit plain fields and recursively validate children", () => {
  assert.equal(accepted({ mapValue: { fields: {} } }).providerType, "mapValue");
  assert.equal(accepted({ mapValue: { fields: { nested: { stringValue: "x" } } } }).providerType, "mapValue");
  rejected({ mapValue: {} });
  rejected({ mapValue: { fields: [] } });
  rejected({ mapValue: { fields: {}, extra: true } }, "REST_VALUE_EXTRA_PROPERTY");
});

test("union cardinality, unknown discriminators, and extra properties fail closed", () => {
  rejected({}, "REST_VALUE_ZERO_DISCRIMINATORS");
  rejected({ booleanValue: true, stringValue: "x" }, "REST_VALUE_MULTIPLE_DISCRIMINATORS");
  rejected({ fieldReferenceValue: "x" }, "REST_VALUE_UNKNOWN_DISCRIMINATOR");
  rejected({ stringValue: "x", extra: true }, "REST_VALUE_EXTRA_PROPERTY");
});

test("plain object and non-JSON graph restrictions are deterministic", () => {
  class Value { stringValue = "x"; }
  rejected(new Value(), "REST_VALUE_MALFORMED_VARIANT");
  const cyclic: Record<string, unknown> = { mapValue: { fields: {} } };
  (cyclic.mapValue as { fields: Record<string, unknown> }).fields.self = cyclic;
  rejected(cyclic, "REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
  const shared = { stringValue: "x" };
  rejected({ mapValue: { fields: { a: shared, b: shared } } }, "REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
});

test("depth and node count accept the boundary and reject one beyond", () => {
  assert.equal(MAX_REST_VALUE_RECURSION_DEPTH, 20);
  assert.equal(MAX_REST_VALUE_NODE_COUNT, 4096);
  assert.equal(accepted(nestedMaps(20)).ok, true);
  rejected(nestedMaps(21), "REST_VALUE_DEPTH_EXCEEDED");
  const atNodeLimit = { arrayValue: { values: Array.from({ length: MAX_REST_VALUE_NODE_COUNT - 1 }, () => ({ nullValue: null })) } };
  assert.equal(accepted(atNodeLimit).ok, true);
  const overNodeLimit = { arrayValue: { values: Array.from({ length: MAX_REST_VALUE_NODE_COUNT }, () => ({ nullValue: null })) } };
  rejected(overNodeLimit, "REST_VALUE_NODE_COUNT_EXCEEDED");
});
