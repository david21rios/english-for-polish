import assert from "node:assert/strict";
import test from "node:test";
import {
  PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION,
  PHASE05_RECOGNIZED_LESSON_FIELDS,
  collectPhase05UnknownLessonFields,
  isPhase05RecognizedLessonField,
} from "../migration/phase05LessonUnknownFieldPolicy.js";
import { PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION } from "../migration/phase05FirestoreRestValuePolicy.js";

const context = {
  sourceSurface: "DIRECT_LEVEL_LESSON" as const,
  sourceReference: { collectionPath: "levels/A1/lessons/A1_1", entityKind: "level_lesson", recordId: "A1_1" },
  restValuePolicyVersion: PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION,
};

test("unknown-field policy version and exact recognized names are frozen", () => {
  assert.equal(PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION, "phase05-lesson-unknown-fields-v1");
  assert.deepEqual(PHASE05_RECOGNIZED_LESSON_FIELDS, ["level", "levelId", "lessonId", "moduleId", "moduleTitle", "nivel", "orderInModule", "status", "title", "titulo"]);
  assert.equal(isPhase05RecognizedLessonField("title"), true);
  assert.equal(isPhase05RecognizedLessonField("Title"), false);
  assert.equal(isPhase05RecognizedLessonField("nested.title"), false);
});

test("unknown evidence is sanitized, exact, and ordinally sorted", () => {
  const result = collectPhase05UnknownLessonFields({
    ...context,
    fields: {
      zeta: { booleanValue: true },
      title: { stringValue: "known-value" },
      alpha: { mapValue: { fields: { childUnknown: { stringValue: "secret" } } } },
      Zeta: { nullValue: null },
    },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.unknownFields.map((field) => field.fieldPath), ["Zeta", "alpha", "zeta"]);
  assert.deepEqual(result.unknownFields.map((field) => field.providerType), ["nullValue", "mapValue", "booleanValue"]);
  assert.ok(result.unknownFields.every((field) => field.presence === "PRESENT" && field.migrationRelevance === "UNKNOWN"));
  assert.ok(result.unknownFields.every((field) => !("rawValue" in field) && !("deterministicHash" in field)));
  assert.equal(JSON.stringify(result).includes("secret"), false);
});

test("invalid unknown values and policy-version mismatches fail without evidence", () => {
  assert.deepEqual(collectPhase05UnknownLessonFields({ ...context, fields: { unknown: { stringValue: 3 } } }), {
    ok: false, failureCode: "REST_VALUE_MALFORMED_VARIANT",
  });
  assert.equal(collectPhase05UnknownLessonFields({ ...context, restValuePolicyVersion: "wrong", fields: {} }).ok, false);
  assert.equal(collectPhase05UnknownLessonFields({ ...context, fields: [] }).ok, false);
});

test("empty unknown list is returned only after a complete successful scan", () => {
  assert.deepEqual(collectPhase05UnknownLessonFields({ ...context, fields: { title: { stringValue: "ok" } } }), {
    ok: true, unknownFields: [], nodeCount: 1,
  });
  assert.equal(collectPhase05UnknownLessonFields({ ...context, fields: { title: { stringValue: "ok" }, bad: { nullValue: "NULL_VALUE" } } }).ok, false);
});

test("nested map keys are structurally checked but do not produce unknown evidence", () => {
  const result = collectPhase05UnknownLessonFields({
    ...context,
    fields: { title: { mapValue: { fields: { nestedExtra: { stringValue: "x" } } } } },
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.unknownFields, []);
});
