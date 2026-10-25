import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  LESSON_INITIAL_FIELD_PROJECTION,
  LESSON_INVENTORY_READ_PURPOSE_VERSION,
  NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  validateLessonCollectionReadRequest,
} from "../migration/legacyLessonSourceDiscoveryContracts.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
} from "../migration/legacyMigrationSourceDiscovery.js";
import {
  createLegacyMigrationFirestoreCollectionReadAdapter,
  deriveLessonCollectionPaginationScopeId,
  type LegacyMigrationFirestoreCollectionPageQueryInput,
  type LegacyMigrationFirestoreCollectionRawDocument,
} from "../migration/legacyMigrationFirestoreCollectionReadAdapter.js";

class LocalTimestampLike {}
class LocalDocumentReferenceLike {}
class LocalGeoPointLike {}

const requestInput = (overrides: Record<string, unknown> = {}) => ({
  logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  sourceSurface: "DIRECT_LEVEL_LESSON",
  projectId: "legacy-project",
  databaseId: "legacy-database",
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
  ...overrides,
});

const request = (overrides: Record<string, unknown> = {}) =>
  validateLessonCollectionReadRequest(requestInput(overrides));

const raw = (id: string, data: unknown = { lessonId: id, levelId: "A1", title: `Title ${id}` }): LegacyMigrationFirestoreCollectionRawDocument => ({
  id,
  path: `levels/A1/lessons/${id}`,
  data,
});

const rawWith = (value: Record<string, unknown>): LegacyMigrationFirestoreCollectionRawDocument => ({
  id: "A1_1",
  path: "levels/A1/lessons/A1_1",
  data: value,
});

const createHarness = (documents: readonly LegacyMigrationFirestoreCollectionRawDocument[] = []) => {
  const calls: LegacyMigrationFirestoreCollectionPageQueryInput[] = [];
  const adapter = createLegacyMigrationFirestoreCollectionReadAdapter({
    selectedProjectId: "legacy-project",
    selectedDatabaseId: "legacy-database",
    dependency: {
      runCollectionPageQuery: async (input) => {
        calls.push(input);
        return documents;
      },
    },
  });
  return { adapter, calls };
};

const tokenPayload = (token: string): Record<string, unknown> =>
  JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as Record<string, unknown>;

const tokenFromPayload = (payload: Record<string, unknown>, recomputeChecksum = false): string => {
  const next = { ...payload };
  if (recomputeChecksum) {
    const unsigned = { ...next };
    delete unsigned.checksum;
    next.checksum = createHash("sha256").update(JSON.stringify(unsigned), "utf8").digest("hex");
  }
  return Buffer.from(JSON.stringify(next), "utf8").toString("base64url");
};

test("adapter exposes only the additive bounded-list read method", () => {
  const { adapter } = createHarness();
  assert.deepEqual(Object.keys(adapter), ["listDocuments"]);
  assert.equal(typeof adapter.listDocuments, "function");
});

test("first page applies exact provider query inputs and emits a scoped continuation token", async () => {
  const { adapter, calls } = createHarness([raw("A1_1"), raw("A1_2")]);
  const result = await adapter.listDocuments(request());
  assert.equal(result.kind, "page");
  if (result.kind !== "page") return;
  assert.equal(result.page.pageIndex, 0);
  assert.equal(result.page.returnedDocumentCount, 2);
  assert.equal(result.page.documents[0]?.documentId, "A1_1");
  assert.equal(result.page.documents[0]?.projectedFields.title, "Title A1_1");
  assert.equal(typeof result.page.nextPageToken, "string");
  assert.deepEqual(calls, [{
    projectId: "legacy-project",
    databaseId: "legacy-database",
    collectionPath: "levels/A1/lessons",
    fieldProjection: LESSON_INITIAL_FIELD_PROJECTION,
    pageSize: 2,
    startAfterDocumentId: null,
    order: "DOCUMENT_PATH_ASC",
  }]);
});

test("continuation token resumes by document ID and advances page index", async () => {
  const first = createHarness([raw("A1_1"), raw("A1_2")]);
  const firstResult = await first.adapter.listDocuments(request());
  assert.equal(firstResult.kind, "page");
  if (firstResult.kind !== "page" || firstResult.page.nextPageToken === null) return;
  const second = createHarness([raw("A1_3")]);
  const secondResult = await second.adapter.listDocuments(request({ pageToken: firstResult.page.nextPageToken }));
  assert.equal(secondResult.kind, "page");
  if (secondResult.kind !== "page") return;
  assert.equal(secondResult.page.pageIndex, 1);
  assert.equal(secondResult.page.nextPageToken, null);
  assert.equal(second.calls[0]?.startAfterDocumentId, "A1_2");
  assert.equal(second.calls[0]?.pageSize, 2);
});

test("empty and short pages are terminal without lookahead", async () => {
  const empty = createHarness([]);
  const emptyResult = await empty.adapter.listDocuments(request());
  assert.equal(emptyResult.kind, "page");
  if (emptyResult.kind === "page") assert.equal(emptyResult.page.nextPageToken, null);
  assert.equal(empty.calls.length, 1);

  const short = createHarness([raw("A1_1")]);
  const shortResult = await short.adapter.listDocuments(request());
  assert.equal(shortResult.kind, "page");
  if (shortResult.kind === "page") assert.equal(shortResult.page.nextPageToken, null);
  assert.equal(short.calls.length, 1);
});

test("request, binding, token, and scope failures reject before provider access", async () => {
  const { adapter, calls } = createHarness([raw("A1_1")]);
  const invalid = await adapter.listDocuments({ ...requestInput(), pageSize: 0 } as never);
  assert.deepEqual(invalid, { kind: "failure", failure: { code: "INVALID_REQUEST", message: "The collection read request is invalid." } });
  const mismatch = await adapter.listDocuments(request({ projectId: "other-project" }));
  assert.deepEqual(mismatch, { kind: "failure", failure: { code: "PROVIDER_BINDING_MISMATCH", message: "The collection request does not match the selected provider binding." } });

  const first = await adapter.listDocuments(request());
  assert.equal(first.kind, "page");
  if (first.kind !== "page" || first.page.nextPageToken === null) return;
  const wrongScope = await adapter.listDocuments(request({ collectionPath: "levels/A2/lessons", pageToken: first.page.nextPageToken }));
  assert.equal(wrongScope.kind, "failure");
  if (wrongScope.kind === "failure") assert.equal(wrongScope.failure.code, "INVALID_REQUEST");
  const token = Buffer.from(first.page.nextPageToken, "base64url").toString("utf8");
  const payload = JSON.parse(token) as Record<string, unknown>;
  payload.pageIndex = 99;
  const tampered = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const invalidToken = await adapter.listDocuments(request({ pageToken: tampered }));
  assert.equal(invalidToken.kind, "failure");
  if (invalidToken.kind === "failure") assert.equal(invalidToken.failure.code, "INVALID_REQUEST");
  assert.equal(calls.length, 1);
});

test("every malformed or cross-scope token form is rejected before a provider call", async () => {
  const source = createHarness([raw("A1_1"), raw("A1_2")]);
  const sourceResult = await source.adapter.listDocuments(request());
  assert.equal(sourceResult.kind, "page");
  if (sourceResult.kind !== "page" || sourceResult.page.nextPageToken === null) return;
  const valid = sourceResult.page.nextPageToken;
  const payload = tokenPayload(valid);
  const canonical = (changes: Record<string, unknown> = {}, recompute = false) =>
    tokenFromPayload({ ...payload, ...changes }, recompute);
  const malformedJson = Buffer.from("{", "utf8").toString("base64url");
  const reordered = JSON.stringify({
    checksum: payload.checksum,
    pageIndex: payload.pageIndex,
    lastDocumentPath: payload.lastDocumentPath,
    lastDocumentId: payload.lastDocumentId,
    paginationScopeId: payload.paginationScopeId,
    version: payload.version,
  });
  const reorderedToken = Buffer.from(reordered, "utf8").toString("base64url");
  const invalids: readonly [string, Record<string, unknown>][] = [
    ["malformed base64url", { pageToken: "!not-base64" }],
    ["malformed JSON", { pageToken: malformedJson }],
    ["missing field", { pageToken: tokenFromPayload(Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "checksum"))) }],
    ["wrong version", { pageToken: canonical({ version: "lesson-collection-page-v0" }) }],
    ["checksum mismatch", { pageToken: canonical({ pageIndex: 8 }) }],
    ["noncanonical JSON", { pageToken: reorderedToken }],
    ["wrong document id", { pageToken: canonical({ lastDocumentId: "A1_9" }, true) }],
    ["wrong document path", { pageToken: canonical({ lastDocumentPath: "levels/A1/lessons/A1_9" }, true) }],
    ["empty token", { pageToken: "" }],
    ["whitespace token", { pageToken: "  " }],
  ];
  for (const [label, override] of invalids) {
    const harness = createHarness([raw("A1_1")]);
    const result = await harness.adapter.listDocuments(requestInput(override) as never);
    assert.equal(result.kind, "failure", label);
    assert.equal(harness.calls.length, 0, label);
  }

  const crossScopeRequests: readonly Record<string, unknown>[] = [
    { projectId: "other-project" },
    { databaseId: "other-database" },
    { collectionPath: "levels/A2/lessons" },
    { pageSize: 1 },
    { maxPages: 2 },
    { maxDocuments: 10 },
    { sourceSurface: "NESTED_MODULE_LESSON", logicalSourceId: NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID, collectionPath: "levels/A1/modules/M01/lessons" },
    { fieldProjection: [] },
    { order: "DOCUMENT_PATH_DESC" },
    { schemaVariant: "other-schema" },
    { discoveryStrategyVersion: "other-strategy" },
    { readPurposeVersion: "other-purpose" },
  ];
  for (const override of crossScopeRequests) {
    const harness = createHarness([raw("A1_1")]);
    const result = await harness.adapter.listDocuments(requestInput({ ...override, pageToken: valid }) as never);
    assert.equal(result.kind, "failure");
    assert.equal(harness.calls.length, 0);
  }
  assert.deepEqual(Object.keys(payload).sort(), ["checksum", "lastDocumentId", "lastDocumentPath", "pageIndex", "paginationScopeId", "version"]);
  assert.equal(Object.values(payload).some((value) => typeof value === "object" && value !== null), false);
  assert.equal("secret" in payload, false);
});

test("strict UTF-8 decoding and every required token field are enforced before provider access", async () => {
  const source = createHarness([raw("A1_1"), raw("A1_2")]);
  const sourceResult = await source.adapter.listDocuments(request());
  assert.equal(sourceResult.kind, "page");
  if (sourceResult.kind !== "page" || sourceResult.page.nextPageToken === null) return;
  const payload = tokenPayload(sourceResult.page.nextPageToken);
  const missingFields = [
    "version",
    "paginationScopeId",
    "lastDocumentId",
    "lastDocumentPath",
    "pageIndex",
    "checksum",
  ] as const;
  for (const field of missingFields) {
    const withoutField = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== field));
    const harness = createHarness([raw("A1_1")]);
    const result = await harness.adapter.listDocuments(requestInput({
      pageToken: tokenFromPayload(withoutField),
    }) as never);
    assert.equal(result.kind, "failure", `missing ${field}`);
    if (result.kind === "failure") assert.equal(result.failure.code, "INVALID_REQUEST", `missing ${field}`);
    assert.equal(harness.calls.length, 0, `missing ${field}`);
  }

  const invalidUtf8 = Buffer.from([0xff, 0xfe, 0xfd]).toString("base64url");
  const utf8Harness = createHarness([raw("A1_1")]);
  const utf8Result = await utf8Harness.adapter.listDocuments(requestInput({ pageToken: invalidUtf8 }) as never);
  assert.equal(utf8Result.kind, "failure");
  if (utf8Result.kind === "failure") assert.equal(utf8Result.failure.code, "INVALID_REQUEST");
  assert.equal(utf8Harness.calls.length, 0);
});

test("continuation page indexes require safe positive integers and safe advancement", async () => {
  const source = createHarness([raw("A1_1"), raw("A1_2")]);
  const sourceResult = await source.adapter.listDocuments(request());
  assert.equal(sourceResult.kind, "page");
  if (sourceResult.kind !== "page" || sourceResult.page.nextPageToken === null) return;
  const payload = tokenPayload(sourceResult.page.nextPageToken);
  const invalidIndexes: readonly [string, unknown][] = [
    ["negative", -1],
    ["zero", 0],
    ["fractional", 1.5],
    ["unsafe-large", Number.MAX_SAFE_INTEGER + 1],
    ["wrong-primitive", "1"],
    ["null", null],
  ];
  for (const [label, pageIndex] of invalidIndexes) {
    const harness = createHarness([raw("A1_1")]);
    const result = await harness.adapter.listDocuments(requestInput({
      pageToken: tokenFromPayload({ ...payload, pageIndex }, true),
    }) as never);
    assert.equal(result.kind, "failure", label);
    if (result.kind === "failure") assert.equal(result.failure.code, "INVALID_REQUEST", label);
    assert.equal(harness.calls.length, 0, label);
  }

  const maxSafeHarness = createHarness([raw("A1_1"), raw("A1_2")]);
  const maxSafeResult = await maxSafeHarness.adapter.listDocuments(requestInput({
    pageToken: tokenFromPayload({ ...payload, pageIndex: Number.MAX_SAFE_INTEGER }, true),
  }) as never);
  assert.equal(maxSafeResult.kind, "failure");
  if (maxSafeResult.kind === "failure") assert.equal(maxSafeResult.failure.code, "MALFORMED_PROVIDER_RESPONSE");
  assert.equal(maxSafeHarness.calls.length, 1);
});

test("pagination scope changes with immutable request dimensions and excludes page token", () => {
  const base = request();
  const sameWithoutToken = request({ pageToken: "opaque-but-not-in-scope" });
  assert.equal(deriveLessonCollectionPaginationScopeId(base), deriveLessonCollectionPaginationScopeId(sameWithoutToken));
  for (const override of [
    { projectId: "other" },
    { databaseId: "other" },
    { collectionPath: "levels/A2/lessons" },
    { pageSize: 1 },
    { maxPages: 2 },
    { maxDocuments: 10 },
    { sourceSurface: "NESTED_MODULE_LESSON", logicalSourceId: NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID, collectionPath: "levels/A1/modules/M01/lessons" },
  ]) {
    assert.notEqual(deriveLessonCollectionPaginationScopeId(base), deriveLessonCollectionPaginationScopeId(request(override)));
  }
});

test("normalization rejects unsupported scalars, unprojected fields, and incoherent paths", async () => {
  for (const bad of [
    raw("A1_1", { lessonId: "A1_1", body: "not projected" }),
    raw("A1_1", { lessonId: "A1_1", title: { nested: true } }),
    { id: "A1_1", path: "levels/A1/lessons/A1_2", data: {} },
    { id: "A1_1", path: "levels/A1/lessons/A1_1", data: { lessonId: "A1_2" } },
  ] as readonly LegacyMigrationFirestoreCollectionRawDocument[]) {
    const { adapter } = createHarness([bad]);
    const result = await adapter.listDocuments(request());
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") assert.equal(result.failure.code, "MALFORMED_PROVIDER_RESPONSE");
  }
});

test("provider page limits and document identifiers are validated explicitly", async () => {
  const overLimit = createHarness([raw("A1_1"), raw("A1_2"), raw("A1_3")]);
  const overLimitResult = await overLimit.adapter.listDocuments(request());
  assert.equal(overLimitResult.kind, "failure");
  if (overLimitResult.kind === "failure") assert.equal(overLimitResult.failure.code, "MALFORMED_PROVIDER_RESPONSE");
  assert.equal(overLimit.calls.length, 1);

  const malformedDocuments: readonly [string, unknown][] = [
    ["missing id", { path: "levels/A1/lessons/A1_1", data: {} }],
    ["empty id", { id: "", path: "levels/A1/lessons/", data: {} }],
    ["non-string id", { id: 42, path: "levels/A1/lessons/42", data: {} }],
    ["wrong collection parent", { id: "A1_1", path: "levels/A2/lessons/A1_1", data: {} }],
  ];
  for (const [label, document] of malformedDocuments) {
    const harness = createHarness([document as LegacyMigrationFirestoreCollectionRawDocument]);
    const result = await harness.adapter.listDocuments(request());
    assert.equal(result.kind, "failure", label);
    if (result.kind === "failure") assert.equal(result.failure.code, "MALFORMED_PROVIDER_RESPONSE", label);
    assert.equal(harness.calls.length, 1, label);
  }
});

test("provider data must be a plain record and approved null-prototype records remain valid", async () => {
  const nullPrototypeData = Object.assign(Object.create(null) as Record<string, unknown>, {
    lessonId: "A1_1",
    levelId: "A1",
    title: "Null prototype",
  });
  const accepted = createHarness([raw("A1_1", nullPrototypeData)]);
  const acceptedResult = await accepted.adapter.listDocuments(request());
  assert.equal(acceptedResult.kind, "page");

  const rejectedData: readonly [string, unknown][] = [
    ["missing", undefined],
    ["null", null],
    ["string", "lesson"],
    ["number", 1],
    ["boolean", true],
    ["array", []],
    ["date", new Date(0)],
    ["class instance", new LocalTimestampLike()],
    ["timestamp-like", new LocalTimestampLike()],
    ["document-reference-like", new LocalDocumentReferenceLike()],
    ["geo-point-like", new LocalGeoPointLike()],
    ["function", () => null],
  ];
  for (const [label, data] of rejectedData) {
    const harness = createHarness([{ id: "A1_1", path: "levels/A1/lessons/A1_1", data }]);
    const result = await harness.adapter.listDocuments(request());
    assert.equal(result.kind, "failure", label);
    if (result.kind === "failure") assert.equal(result.failure.code, "MALFORMED_PROVIDER_RESPONSE", label);
    assert.equal(harness.calls.length, 1, label);
  }
});

test("every unsupported projected value is rejected without widening scalar policy", async () => {
  const unsupported: readonly [string, unknown][] = [
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["array", []],
    ["nested object", { nested: true }],
    ["Date", new Date(0)],
    ["timestamp-like", new LocalTimestampLike()],
    ["document-reference-like", new LocalDocumentReferenceLike()],
    ["geo-point-like", new LocalGeoPointLike()],
    ["function", () => null],
    ["symbol", Symbol("value")],
    ["bigint", BigInt(1)],
  ];
  for (const [label, value] of unsupported) {
    const harness = createHarness([rawWith({ lessonId: "A1_1", title: value })]);
    const result = await harness.adapter.listDocuments(request());
    assert.equal(result.kind, "failure", label);
    if (result.kind === "failure") assert.equal(result.failure.code, "MALFORMED_PROVIDER_RESPONSE", label);
    assert.equal(harness.calls.length, 1, label);
  }
});

test("provider failures map to the published stable inventory failure codes", async () => {
  for (const [code, expected] of [[7, "PERMISSION_DENIED"], [14, "PROVIDER_UNAVAILABLE"], [5, "NOT_FOUND"], ["other", "PROVIDER_READ_FAILED"]] as const) {
    const adapter = createLegacyMigrationFirestoreCollectionReadAdapter({
      selectedProjectId: "legacy-project",
      selectedDatabaseId: "legacy-database",
      dependency: { runCollectionPageQuery: async () => { throw Object.assign(new Error("provider"), { code }); } },
    });
    const result = await adapter.listDocuments(request());
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") assert.equal(result.failure.code, expected);
  }
});

test("adapter construction performs no provider operation and has no write capability", () => {
  let calls = 0;
  const adapter = createLegacyMigrationFirestoreCollectionReadAdapter({
    selectedProjectId: "legacy-project",
    selectedDatabaseId: "legacy-database",
    dependency: { runCollectionPageQuery: async () => { calls += 1; return []; } },
  });
  assert.equal(calls, 0);
  assert.equal("set" in adapter, false);
  assert.equal("update" in adapter, false);
  assert.equal("delete" in adapter, false);
});
