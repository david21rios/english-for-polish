import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePhase05LessonInventoryDocument,
  type Phase05LessonInventorySourceContext,
} from "../migration/phase05LessonInventoryDocumentParser.js";
import { PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION } from "../migration/phase05FirestoreRestValuePolicy.js";
import { PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION } from "../migration/phase05LessonUnknownFieldPolicy.js";

const context = (nested = false): Phase05LessonInventorySourceContext => {
  const path = nested ? "levels/A1/modules/A1_M01_pruebaa1/lessons/A1_1" : "levels/A1/lessons/A1_1";
  const resourceName = `projects/english-for-polish/databases/(default)/documents/${path}`;
  const sourceKind = nested ? "level_module_lesson" : "level_lesson";
  return {
    sourceSurface: nested ? "NESTED_MODULE_LESSON" : "DIRECT_LEVEL_LESSON",
    expectedLevelId: "A1",
    expectedLessonId: "A1_1",
    expectedModuleId: nested ? "A1_M01_pruebaa1" : null,
    expectedDocumentPath: path,
    expectedDocumentName: resourceName,
    sourceReference: { collectionPath: path, entityKind: sourceKind, recordId: "A1_1" },
    logicalSourceId: nested ? "legacy.level_module_lesson" : "legacy.level_lesson",
    sourceKind,
    schemaVariant: "legacy-v1",
    discoveryStrategyVersion: "phase05-source-discovery-v1",
    restValuePolicyVersion: PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION,
    unknownFieldPolicyVersion: PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION,
  };
};

const document = (nested = false, fields: Record<string, unknown> = {
  lessonId: { stringValue: "A1_1" },
  level: { stringValue: "A1" },
  nivel: { nullValue: null },
  moduleTitle: { stringValue: "Module title" },
  title: { stringValue: "Lesson title" },
  titulo: { stringValue: "Título" },
  orderInModule: { integerValue: "2" },
  status: { stringValue: "published" },
  futureField: { booleanValue: true },
}): Record<string, unknown> => ({
  name: context(nested).expectedDocumentName,
  fields: nested ? { ...fields, moduleId: { stringValue: "A1_M01_pruebaa1" } } : fields,
  createTime: "2024-02-29T12:00:00Z",
  updateTime: "2024-03-01T12:00:00Z",
});

test("parses a complete direct document with trusted path provenance", () => {
  const result = parsePhase05LessonInventoryDocument(document(), context());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.record.sourceSurface, "DIRECT_LEVEL_LESSON");
  assert.equal(result.record.sourcePath, "levels/A1/lessons/A1_1");
  assert.deepEqual(result.record.logicalIdentity, { levelId: "A1", lessonId: "A1_1" });
  assert.equal(result.record.provenance.moduleId, null);
  assert.deepEqual(result.record.moduleId, { presence: "ABSENT" });
  assert.equal(Object.hasOwn(result.record, "nivel"), false);
  assert.equal(result.record.moduleTitle.presence, "PRESENT");
  if (result.record.moduleTitle.presence !== "PRESENT") return;
  assert.equal(result.record.moduleTitle.value, "Module title");
  assert.equal(result.record.orderInModule.presence, "PRESENT");
  if (result.record.orderInModule.presence !== "PRESENT") return;
  assert.equal(result.record.orderInModule.value, 2);
  assert.deepEqual(result.record.contentHashes, []);
  assert.deepEqual(result.record.unknownFields.map((field) => field.fieldPath), ["futureField"]);
  assert.equal("UNAVAILABLE" in result.record.title, false);
});

test("parses a complete nested document with path-derived module provenance", () => {
  const result = parsePhase05LessonInventoryDocument(document(true), context(true));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.record.sourceSurface, "NESTED_MODULE_LESSON");
  assert.equal(result.record.provenance.moduleId, "A1_M01_pruebaa1");
  assert.deepEqual(result.record.moduleId, { presence: "PRESENT", value: "A1_M01_pruebaa1" });
  assert.equal(result.record.provenance.logicalSourceId, "legacy.level_module_lesson");
});

test("optional fields may be absent but full success never emits unavailable", () => {
  const result = parsePhase05LessonInventoryDocument(document(false, {}), context());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  for (const field of [result.record.moduleTitle, result.record.title, result.record.titulo, result.record.orderInModule, result.record.status]) {
    assert.deepEqual(field, { presence: "ABSENT" });
  }
});

test("resource identity and present identity aliases are exact and fail closed", () => {
  assert.deepEqual(parsePhase05LessonInventoryDocument({ ...document(), name: "projects/other/databases/(default)/documents/levels/A1/lessons/A1_1" }, context()), {
    ok: false, failureCode: "PROVIDER_RESOURCE_IDENTITY_MISMATCH",
  });
  for (const field of [
    { lessonId: { stringValue: "A1_2" } },
    { levelId: { stringValue: "A2" } },
    { level: { stringValue: "A2" } },
    { nivel: { stringValue: "A2" } },
  ]) {
    assert.equal(parsePhase05LessonInventoryDocument(document(false, field), context()).ok, false);
  }
});

test("nivel null is preserved structurally and is not normalized", () => {
  const result = parsePhase05LessonInventoryDocument(document(false, { nivel: { nullValue: null } }), context());
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.validatedNivel, { presence: "PRESENT", value: null });
    assert.equal(Object.hasOwn(result.record, "nivel"), false);
  }
});

test("nested module ID must match its trusted path and direct module linkage fails", () => {
  const nestedDocument = document(true);
  assert.equal(parsePhase05LessonInventoryDocument({
    ...nestedDocument,
    fields: { ...(nestedDocument.fields as Record<string, unknown>), moduleId: { stringValue: "A1_M02_wrong" } },
  }, context(true)).ok, false);
  assert.equal(parsePhase05LessonInventoryDocument(document(false, { moduleId: { stringValue: "A1_M01_pruebaa1" } }), context()).ok, false);
});

test("known provider types, integer safety, and finite doubles are enforced", () => {
  assert.equal(parsePhase05LessonInventoryDocument(document(false, { status: { booleanValue: true } }), context()).ok, false);
  assert.equal(parsePhase05LessonInventoryDocument(document(false, { orderInModule: { integerValue: "9007199254740992" } }), context()).ok, false);
  const double = parsePhase05LessonInventoryDocument(document(false, { orderInModule: { doubleValue: 2.5 } }), context());
  assert.equal(double.ok, true);
  if (double.ok) {
    assert.equal(double.record.orderInModule.presence, "PRESENT");
    if (double.record.orderInModule.presence === "PRESENT") assert.equal(double.record.orderInModule.value, 2.5);
  }
  assert.equal(parsePhase05LessonInventoryDocument(document(false, { orderInModule: { doubleValue: "2.5" } }), context()).ok, false);
});

test("malformed unknown values abort the entire record and never leak payload", () => {
  const secret = "do-not-emit-this";
  const result = parsePhase05LessonInventoryDocument(document(false, { unknown: { stringValue: secret, extra: true } }), context());
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("envelope and fields shape are strict; metadata is discarded", () => {
  assert.equal(parsePhase05LessonInventoryDocument({ ...document(), extra: true }, context()).ok, false);
  assert.equal(parsePhase05LessonInventoryDocument({ name: context().expectedDocumentName }, context()).ok, false);
  assert.equal(parsePhase05LessonInventoryDocument({ name: context().expectedDocumentName, fields: [] }, context()).ok, false);
});
