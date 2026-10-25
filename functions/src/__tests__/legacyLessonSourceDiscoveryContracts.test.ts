import assert from "node:assert/strict";
import test from "node:test";
import {
  DIRECT_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE,
  DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  DIRECT_LEGACY_LESSON_SOURCE_KIND,
  INVENTORY_COMPLETENESS_STATES,
  INVENTORY_FAILURE_CODES,
  LESSON_INITIAL_FIELD_PROJECTION,
  LESSON_INVENTORY_READ_PURPOSE_VERSION,
  NESTED_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE,
  deriveDirectLessonCollectionPath,
  deriveLessonCollectionReadRequestIdentity,
  deriveNestedLessonCollectionPath,
  mapLegacyLessonDescriptorToSurface,
  validateDirectLessonDescriptor,
  validateDirectLessonDocumentPath,
  validateInventoryCompletenessState,
  validateLessonCollectionPage,
  validateLessonCollectionPath,
  validateLessonCollectionReadFailure,
  validateLessonCollectionReadRequest,
  validateLessonListedDocument,
  validateNestedLessonDescriptor,
  validateNestedLessonDocumentPath,
  validateTerminalLessonCollectionPage,
} from "../migration/legacyLessonSourceDiscoveryContracts.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
} from "../migration/legacyMigrationSourceDiscovery.js";
import { resolveLegacyMigrationProviderSourcePlanForLogicalSource } from "../migration/legacyMigrationProviderSourcePlan.js";
import type { LegacyMigrationCollectionReadPort, LegacyMigrationSourceReadPort } from "../migration/legacyMigrationReadPorts.js";

const requestInput = (overrides: Record<string, unknown> = {}) => ({
  logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  sourceSurface: "DIRECT_LEVEL_LESSON",
  projectId: "legacy-project",
  databaseId: "legacy-database",
  collectionPath: "levels/A1/lessons",
  fieldProjection: [...LESSON_INITIAL_FIELD_PROJECTION],
  pageSize: 20,
  pageToken: null,
  maxPages: 10,
  maxDocuments: 200,
  order: "DOCUMENT_PATH_ASC",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  readPurposeVersion: LESSON_INVENTORY_READ_PURPOSE_VERSION,
  ...overrides,
});

const request = (overrides: Record<string, unknown> = {}) => validateLessonCollectionReadRequest(requestInput(overrides));

const listed = (overrides: Record<string, unknown> = {}) => validateLessonListedDocument({
  logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  sourceSurface: "DIRECT_LEVEL_LESSON",
  projectId: "legacy-project",
  databaseId: "legacy-database",
  collectionPath: "levels/A1/lessons",
  documentPath: "levels/A1/lessons/A1_1",
  documentId: "A1_1",
  projectedFields: { lessonId: "A1_1", levelId: "A1", title: "Hello" },
  sourceReference: { collectionPath: "levels/A1/lessons/A1_1", entityKind: "level_lesson", recordId: "A1_1" },
  readProvenance: {
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    readPurposeVersion: LESSON_INVENTORY_READ_PURPOSE_VERSION,
    pageIndex: 0,
  },
  ...overrides,
});

test("direct descriptor is additive and exact", () => {
  const descriptor = validateDirectLessonDescriptor();
  assert.equal(descriptor.logicalSourceId, DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID);
  assert.equal(descriptor.sourceKind, DIRECT_LEGACY_LESSON_SOURCE_KIND);
  assert.equal(descriptor.collectionPathTemplate, DIRECT_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE);
  assert.deepEqual(
    PROVEN_LEGACY_SOURCE_DESCRIPTORS.filter((item) => item.logicalSourceId === DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID),
    [descriptor],
  );
  assert.equal(PROVEN_LEGACY_SOURCE_DESCRIPTORS.length, 8);
});

test("nested descriptor remains unchanged and maps only to the nested surface", () => {
  const descriptor = validateNestedLessonDescriptor();
  assert.equal(descriptor.collectionPathTemplate, NESTED_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE);
  assert.equal(mapLegacyLessonDescriptorToSurface(DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID, DIRECT_LEGACY_LESSON_SOURCE_KIND), "DIRECT_LEVEL_LESSON");
  assert.equal(mapLegacyLessonDescriptorToSurface("legacy.level_module_lesson", "level_module_lesson"), "NESTED_MODULE_LESSON");
  assert.throws(() => mapLegacyLessonDescriptorToSurface("legacy.level_lesson", "level_module_lesson"));
  assert.throws(() => mapLegacyLessonDescriptorToSurface("legacy.unknown"));
});

test("source-plan recognition accepts the direct lesson descriptor without module dependencies", () => {
  const plan = resolveLegacyMigrationProviderSourcePlanForLogicalSource(DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID);
  assert.equal(plan.kind, "resolved");
  if (plan.kind !== "resolved") return;
  assert.equal(plan.entries[0]?.providerSurface, "FIRESTORE");
  assert.deepEqual(plan.entries[0]?.pathTemplate.bindings, ["levelId", "lessonId"]);
  assert.deepEqual(plan.entries[0]?.dependencies, [
    { binding: "levelId", requiresBindings: [] },
    { binding: "lessonId", requiresBindings: ["levelId"] },
  ]);
});

test("direct and nested collection paths are separate from document templates", () => {
  assert.equal(deriveDirectLessonCollectionPath({ levelId: "A1" }), "levels/A1/lessons");
  assert.equal(deriveNestedLessonCollectionPath({ levelId: "A1", moduleId: "M01" }), "levels/A1/modules/M01/lessons");
  assert.equal(validateLessonCollectionPath("levels/A1/lessons", "DIRECT_LEVEL_LESSON"), "levels/A1/lessons");
  assert.equal(validateLessonCollectionPath("levels/A1/modules/M01/lessons", "NESTED_MODULE_LESSON"), "levels/A1/modules/M01/lessons");
  assert.throws(() => deriveDirectLessonCollectionPath({ levelId: "../A1" }));
  assert.throws(() => deriveNestedLessonCollectionPath({ levelId: "A1", moduleId: "" }));
  assert.throws(() => validateLessonCollectionPath("levels/A1/lessons/{lessonId}", "DIRECT_LEVEL_LESSON"));
});

test("document path validators enforce descriptor, surface, and identity", () => {
  assert.equal(validateDirectLessonDocumentPath({ documentPath: "levels/A1/lessons/A1_1", documentId: "A1_1", logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID, sourceSurface: "DIRECT_LEVEL_LESSON" }), "levels/A1/lessons/A1_1");
  assert.equal(validateNestedLessonDocumentPath({ documentPath: "levels/A1/modules/M01/lessons/A1_1", documentId: "A1_1", logicalSourceId: "legacy.level_module_lesson", sourceSurface: "NESTED_MODULE_LESSON", moduleId: "M01" }), "levels/A1/modules/M01/lessons/A1_1");
  assert.throws(() => validateDirectLessonDocumentPath({ documentPath: "levels/A1/lessons/A1_1", documentId: "other", logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID, sourceSurface: "DIRECT_LEVEL_LESSON" }));
  assert.throws(() => validateNestedLessonDocumentPath({ documentPath: "levels/A1/modules/M01/lessons/A1_1", documentId: "A1_1", logicalSourceId: "legacy.level_module_lesson", sourceSurface: "NESTED_MODULE_LESSON", moduleId: "M02" }));
});

test("bounded request requires explicit project, database, projection, and bounds", () => {
  const valid = request();
  assert.deepEqual(valid.fieldProjection, LESSON_INITIAL_FIELD_PROJECTION);
  assert.equal(valid.pageToken, null);
  assert.throws(() => request({ projectId: "" }));
  assert.throws(() => request({ databaseId: "" }));
  assert.throws(() => request({ sourceSurface: "NESTED_MODULE_LESSON" }));
  assert.throws(() => request({ fieldProjection: [] }));
  assert.throws(() => request({ fieldProjection: ["*"] }));
  assert.throws(() => request({ fieldProjection: [...LESSON_INITIAL_FIELD_PROJECTION, "body"] }));
  assert.throws(() => request({ fieldProjection: [...LESSON_INITIAL_FIELD_PROJECTION].reverse() }));
  assert.throws(() => request({ fieldProjection: [...LESSON_INITIAL_FIELD_PROJECTION.slice(0, -1), "title", "status"] }));
  for (const field of ["pageSize", "maxPages", "maxDocuments"]) {
    const missing = requestInput() as Record<string, unknown>;
    delete missing[field];
    assert.throws(() => validateLessonCollectionReadRequest(missing));
    for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(() => request({ [field]: value }));
    }
  }
  assert.throws(() => request({ pageSize: 21, maxDocuments: 20 }));
  assert.throws(() => request({ pageToken: "" }));
  assert.equal(deriveLessonCollectionReadRequestIdentity(valid).includes("legacy-project"), true);
});

test("listed-document, page, empty-page, completeness, and failure contracts are provider-neutral", () => {
  const document = listed();
  assert.equal(document.documentPath, "levels/A1/lessons/A1_1");
  const page = validateLessonCollectionPage({
    requestIdentity: "identity",
    documents: [document],
    returnedDocumentCount: 1,
    nextPageToken: "opaque-token",
    pageIndex: 0,
    readMetadata: {
      projectId: "legacy-project",
      databaseId: "legacy-database",
      collectionPath: "levels/A1/lessons",
      sourceSurface: "DIRECT_LEVEL_LESSON",
    },
  });
  assert.equal(page.nextPageToken, "opaque-token");
  assert.throws(() => validateTerminalLessonCollectionPage(page));
  const empty = validateLessonCollectionPage({
    requestIdentity: "empty",
    documents: [],
    returnedDocumentCount: 0,
    nextPageToken: null,
    pageIndex: 0,
    readMetadata: {
      projectId: "legacy-project",
      databaseId: "legacy-database",
      collectionPath: "levels/A1/lessons",
      sourceSurface: "DIRECT_LEVEL_LESSON",
    },
  });
  assert.equal(empty.returnedDocumentCount, 0);
  assert.equal(validateTerminalLessonCollectionPage(empty).nextPageToken, null);
  assert.throws(() => validateLessonCollectionPage({ ...page, returnedDocumentCount: 0 }));
  assert.throws(() => listed({ documentPath: "levels/A1/lessons/A1_2" }));
  assert.throws(() => listed({ collectionPath: "levels/A2/lessons" }));
  assert.throws(() => listed({ projectedFields: { lessonId: "A1_2" } }));
  assert.throws(() => listed({ projectedFields: { levelId: "A2" } }));
  assert.doesNotThrow(() => listed({ projectedFields: { lessonId: "A1_1", levelId: "A1", moduleId: "M01" } }));
  assert.throws(() => listed({ projectedFields: { body: "forbidden" } }));
  assert.throws(() => listed({ documentId: 42 }));
  assert.throws(() => validateLessonCollectionPage({ ...page, readMetadata: { ...page.readMetadata, projectId: "other-project" } }));
  assert.throws(() => validateLessonCollectionPage({ ...page, readMetadata: { ...page.readMetadata, collectionPath: "levels/A2/lessons" } }));
  assert.throws(() => validateLessonCollectionPage({ ...page, pageIndex: 1 }));
  assert.throws(() => validateLessonCollectionPage({ ...page, documents: [listed({ readProvenance: { ...document.readProvenance, pageIndex: 1 } })] }));
  assert.throws(() => validateLessonCollectionPage({ ...page, documents: [listed({ databaseId: "other-database" })] }));
  assert.throws(() => validateLessonCollectionPage({ ...page, documents: [listed({ sourceSurface: "NESTED_MODULE_LESSON", logicalSourceId: "legacy.level_module_lesson", collectionPath: "levels/A1/modules/M01/lessons", documentPath: "levels/A1/modules/M01/lessons/A1_1", sourceReference: { collectionPath: "levels/A1/modules/M01/lessons/A1_1", entityKind: "level_module_lesson", recordId: "A1_1" } })] }));
  assert.deepEqual(validateLessonCollectionReadFailure({ code: "PROVIDER_READ_FAILED", message: "read failed" }), { code: "PROVIDER_READ_FAILED", message: "read failed" });
  assert.throws(() => validateLessonCollectionReadFailure({ code: "UNKNOWN", message: "bad" }));
  for (const state of INVENTORY_COMPLETENESS_STATES) assert.equal(validateInventoryCompletenessState(state), state);
  assert.throws(() => validateInventoryCompletenessState("NOT_A_COMPLETENESS_STATE"));
  assert.deepEqual(INVENTORY_FAILURE_CODES.includes("READ_BOUND_EXCEEDED"), true);
});

test("nested listed documents enforce collection and projected identity coherence", () => {
  const nested = (overrides: Record<string, unknown> = {}) => validateLessonListedDocument({
    logicalSourceId: "legacy.level_module_lesson",
    sourceSurface: "NESTED_MODULE_LESSON",
    projectId: "legacy-project",
    databaseId: "legacy-database",
    collectionPath: "levels/A1/modules/M01/lessons",
    documentPath: "levels/A1/modules/M01/lessons/A1_1",
    documentId: "A1_1",
    projectedFields: { lessonId: "A1_1", levelId: "A1", moduleId: "M01" },
    sourceReference: { collectionPath: "levels/A1/modules/M01/lessons/A1_1", entityKind: "level_module_lesson", recordId: "A1_1" },
    readProvenance: {
      schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
      discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
      readPurposeVersion: LESSON_INVENTORY_READ_PURPOSE_VERSION,
      pageIndex: 0,
    },
    ...overrides,
  });
  assert.throws(() => nested({ collectionPath: "levels/A1/modules/M02/lessons" }));
  assert.throws(() => nested({ projectedFields: { moduleId: "M02" } }));
  assert.throws(() => nested({ projectedFields: { levelId: "A2" } }));
  assert.throws(() => nested({ projectedFields: { lessonId: "A1_2" } }));
});

test("new collection port is additive beside the existing point-read port", () => {
  const pointPort: LegacyMigrationSourceReadPort = { readCandidates: async () => ({ kind: "source_discovery_required" }) };
  const collectionPort: LegacyMigrationCollectionReadPort = { listDocuments: async () => ({ kind: "failure", failure: { code: "SOURCE_DISCOVERY_REQUIRED", message: "not implemented" } }) };
  assert.equal(typeof pointPort.readCandidates, "function");
  assert.equal(typeof collectionPort.listDocuments, "function");
});
