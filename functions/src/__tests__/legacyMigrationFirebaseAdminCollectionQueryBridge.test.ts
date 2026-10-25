import assert from "node:assert/strict";
import test from "node:test";
import {
  createLegacyMigrationFirebaseAdminCollectionQueryBridge,
} from "../migration/legacyMigrationFirebaseAdminCollectionQueryBridge.js";
import {
  createLegacyMigrationFirestoreCollectionReadAdapter,
  type LegacyMigrationFirestoreCollectionPageQueryInput,
} from "../migration/legacyMigrationFirestoreCollectionReadAdapter.js";
import {
  DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  LESSON_INITIAL_FIELD_PROJECTION,
  LESSON_INVENTORY_READ_PURPOSE_VERSION,
  validateLessonCollectionReadRequest,
} from "../migration/legacyLessonSourceDiscoveryContracts.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
} from "../migration/legacyMigrationSourceDiscovery.js";

const app = { options: { projectId: "legacy-project" } };
const queryInput = (overrides: Partial<LegacyMigrationFirestoreCollectionPageQueryInput> = {}): LegacyMigrationFirestoreCollectionPageQueryInput => ({
  projectId: "legacy-project",
  databaseId: "named-db",
  collectionPath: "levels/A1/lessons",
  fieldProjection: ["lessonId", "title"],
  pageSize: 2,
  startAfterDocumentId: null,
  order: "DOCUMENT_PATH_ASC",
  ...overrides,
});

type Calls = { events: string[]; getFirestore: string[]; get: number };

const harness = (documents: readonly unknown[] = []) => {
  const calls: Calls = { events: [], getFirestore: [], get: 0 };
  const query = {
    select: (...fields: string[]) => { calls.events.push(`select:${fields.join(",")}`); return query; },
    orderBy: (field: unknown, direction: "asc") => { calls.events.push(`order:${String(field)}:${direction}`); return query; },
    startAfter: (...values: unknown[]) => { calls.events.push(`startAfter:${String(values[0])}`); return query; },
    limit: (value: number) => { calls.events.push(`limit:${value}`); return query; },
    get: async () => {
      calls.events.push("get");
      calls.get += 1;
      return { docs: documents as readonly { id: string; ref: { path: string }; data: () => unknown }[] };
    },
  };
  const dependency = createLegacyMigrationFirebaseAdminCollectionQueryBridge({
    app,
    runtime: {
      getFirestore: (_app, databaseId) => {
        calls.getFirestore.push(databaseId);
        return { collection: (path: string) => { calls.events.push(`collection:${path}`); return query; } };
      },
      documentId: () => "__document_id__",
    },
  });
  return { dependency, calls };
};

const document = (id: string, data: unknown = { lessonId: id, title: `Title ${id}` }, path = `levels/A1/lessons/${id}`) => ({
  id,
  ref: { path },
  data: () => data,
});

const adapterRequest = validateLessonCollectionReadRequest({
  logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  sourceSurface: "DIRECT_LEVEL_LESSON",
  projectId: "legacy-project",
  databaseId: "named-db",
  collectionPath: "levels/A1/lessons",
  fieldProjection: [...LESSON_INITIAL_FIELD_PROJECTION],
  pageSize: 2,
  pageToken: null,
  maxPages: 10,
  maxDocuments: 20,
  order: "DOCUMENT_PATH_ASC",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  readPurposeVersion: LESSON_INVENTORY_READ_PURPOSE_VERSION,
});

test("constructs the exact first-page query and converts provider-neutral documents", async () => {
  const source = { lessonId: "A1_1", title: "First" };
  const { dependency, calls } = harness([document("A1_1", source)]);
  assert.equal(calls.get, 0);
  const result = await dependency.runCollectionPageQuery(queryInput());
  assert.deepEqual(calls.getFirestore, ["named-db"]);
  assert.deepEqual(calls.events, [
    "collection:levels/A1/lessons",
    "select:lessonId,title",
    "order:__document_id__:asc",
    "limit:2",
    "get",
  ]);
  assert.equal(calls.get, 1);
  assert.deepEqual(result, [{ id: "A1_1", path: "levels/A1/lessons/A1_1", data: source }]);
  assert.notEqual(result[0]?.data, source);
});

test("uses the exact continuation cursor after document-ID ordering", async () => {
  const { dependency, calls } = harness([]);
  await dependency.runCollectionPageQuery(queryInput({ startAfterDocumentId: "A1_1", pageSize: 7 }));
  assert.deepEqual(calls.events, [
    "collection:levels/A1/lessons",
    "select:lessonId,title",
    "order:__document_id__:asc",
    "startAfter:A1_1",
    "limit:7",
    "get",
  ]);
});

test("preserves order, supports empty results, and keeps nested values untouched", async () => {
  const nested = { providerLike: true };
  const { dependency } = harness([document("A1_2", { nested }), document("A1_3", null)]);
  const result = await dependency.runCollectionPageQuery(queryInput());
  assert.equal(result[0]?.id, "A1_2");
  assert.equal((result[0]?.data as { nested: unknown }).nested, nested);
  assert.deepEqual(result[1]?.data, null);
  const empty = harness([]);
  assert.deepEqual(await empty.dependency.runCollectionPageQuery(queryInput()), []);
  assert.equal(empty.calls.get, 1);
});

test("rejects invalid binding and query inputs before Firestore resolution or get", async () => {
  const { dependency, calls } = harness([]);
  for (const invalid of [
    queryInput({ projectId: "" }),
    queryInput({ projectId: "other" }),
    queryInput({ databaseId: "" }),
    queryInput({ collectionPath: "levels/A1/lessons/A1_1" }),
    queryInput({ fieldProjection: [] }),
    queryInput({ pageSize: 0 }),
    queryInput({ pageSize: -1 }),
    queryInput({ pageSize: 1.5 }),
    queryInput({ pageSize: Number.MAX_SAFE_INTEGER + 1 }),
    queryInput({ order: "DOCUMENT_PATH_DESC" as never }),
    queryInput({ startAfterDocumentId: "" }),
  ]) {
    await assert.rejects(dependency.runCollectionPageQuery(invalid));
  }
  assert.deepEqual(calls.getFirestore, []);
  assert.equal(calls.get, 0);
});

test("requires an App project identity and forwards an explicitly supplied default database", async () => {
  const missingProject = harness([]);
  const missingProjectBridge = createLegacyMigrationFirebaseAdminCollectionQueryBridge({
    app: { options: {} },
    runtime: {
      getFirestore: () => { throw new Error("must not resolve Firestore"); },
      documentId: () => "__document_id__",
    },
  });
  await assert.rejects(missingProjectBridge.runCollectionPageQuery(queryInput()));
  assert.deepEqual(missingProject.calls.getFirestore, []);

  const explicitDefault = harness([]);
  await explicitDefault.dependency.runCollectionPageQuery(queryInput({ databaseId: "(default)" }));
  assert.deepEqual(explicitDefault.calls.getFirestore, ["(default)"]);
});

test("rethrows provider errors unchanged and never exposes write methods", async () => {
  const error = Object.assign(new Error("unavailable"), { code: 14 });
  const source = harness([]);
  const failingQuery = {
    select: () => failingQuery,
    orderBy: () => failingQuery,
    startAfter: () => failingQuery,
    limit: () => failingQuery,
    get: async () => { throw error; },
  };
  const failing = createLegacyMigrationFirebaseAdminCollectionQueryBridge({
    app,
    runtime: {
      getFirestore: () => ({ collection: () => failingQuery }),
      documentId: () => "__document_id__",
    },
  });
  await assert.rejects(failing.runCollectionPageQuery(queryInput()), (received) => received === error);
  assert.equal("set" in source.dependency, false);
  assert.equal("delete" in source.dependency, false);
});

test("published adapter rejects unsupported nested provider values through the bridge", async () => {
  const nested = { providerLike: true };
  const { dependency } = harness([document("A1_1", { lessonId: "A1_1", title: nested })]);
  const adapter = createLegacyMigrationFirestoreCollectionReadAdapter({
    dependency,
    selectedProjectId: "legacy-project",
    selectedDatabaseId: "named-db",
  });
  const result = await adapter.listDocuments(adapterRequest);
  assert.deepEqual(result, {
    kind: "failure",
    failure: { code: "MALFORMED_PROVIDER_RESPONSE", message: "The provider returned malformed lesson data." },
  });
});

test("published adapter preserves its error taxonomy on bridge provider failures", async () => {
  for (const [code, expected] of [[7, "PERMISSION_DENIED"], [14, "PROVIDER_UNAVAILABLE"], [5, "NOT_FOUND"], ["other", "PROVIDER_READ_FAILED"]] as const) {
    const throwingQuery = {
      select: () => throwingQuery,
      orderBy: () => throwingQuery,
      startAfter: () => throwingQuery,
      limit: () => throwingQuery,
      get: async () => { throw Object.assign(new Error("provider"), { code }); },
    };
    const bridge = createLegacyMigrationFirebaseAdminCollectionQueryBridge({
      app,
      runtime: {
        getFirestore: () => ({ collection: () => throwingQuery }),
        documentId: () => "__document_id__",
      },
    });
    const adapter = createLegacyMigrationFirestoreCollectionReadAdapter({
      dependency: bridge,
      selectedProjectId: "legacy-project",
      selectedDatabaseId: "named-db",
    });
    const result = await adapter.listDocuments(adapterRequest);
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") assert.equal(result.failure.code, expected);
  }
});
