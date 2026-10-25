import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  FIRST_READ_AUTHORIZATION_ENV,
  FIRST_READ_AUTHORIZATION_VALUE,
  FIRST_READ_APP_NAME,
  FIRST_READ_BUDGET,
  FIRST_READ_PACKET,
  createBoundedGetFirestore,
  inspectCredentialEnvironment,
  isPathWithinRepository,
  runPhase05FirstBoundedProviderRead,
  validateFrozenPacket,
} from "../scripts/migration/phase05FirstBoundedProviderRead.mjs";

const compiled = (relative) => import(new URL(`../functions/lib/migration/${relative}`, import.meta.url));
const migration = await (async () => {
  const [source, binding, resolver, factory] = await Promise.all([
    compiled("legacyMigrationProviderSourcePlan.js"),
    compiled("legacyMigrationProviderBindingPlan.js"),
    compiled("legacyMigrationFirebaseAdminProviderResolver.js"),
    compiled("legacyMigrationProviderClientFactory.js"),
  ]);
  return {
    resolveLegacyMigrationProviderSourcePlanForLogicalSource: source.resolveLegacyMigrationProviderSourcePlanForLogicalSource,
    deriveLegacyMigrationProviderBindingPlan: binding.deriveLegacyMigrationProviderBindingPlan,
    createLegacyMigrationFirebaseAdminProviderResolver: resolver.createLegacyMigrationFirebaseAdminProviderResolver,
    createLegacyMigrationCollectionReadPort: factory.createLegacyMigrationCollectionReadPort,
  };
})();

const doc = (id, pathName = `levels/A1/lessons/${id}`, projectedFields = { lessonId: id, title: `Title ${id}` }) => ({
  documentId: id,
  documentPath: pathName,
  projectedFields,
});

const providerDoc = (id, pathName = `levels/A1/lessons/${id}`, data = { title: `Title ${id}` }) => ({
  id,
  ref: { path: pathName },
  data: () => data,
});

const runtimeHarness = ({
  authorization = FIRST_READ_AUTHORIZATION_VALUE,
  existingApps = [],
  projectId = FIRST_READ_PACKET.projectId,
    result = { kind: "provider-documents", documents: [] },
  queryError,
  cleanupError,
  credentialEnv = undefined,
  missingCompiledTargetIndex = -1,
} = {}) => {
  const calls = {
    loadAdmin: 0, loadMigration: 0, credential: 0, initialize: 0, delete: 0,
    resolveAuth: 0, resolvePoint: 0, resolveCollection: 0, getFirestore: 0, get: 0,
    compiledTargetChecks: [], output: [],
    request: null,
  };
  const app = { name: FIRST_READ_APP_NAME, options: { projectId } };
  const query = {
    select: () => query,
    orderBy: () => query,
    startAfter: () => query,
    limit: () => query,
    get: async () => {
      calls.get += 1;
      if (queryError) throw queryError;
      return { docs: result.documents ?? [] };
    },
  };
  const admin = {
    getApps: () => existingApps,
    applicationDefault: () => { calls.credential += 1; return { fakeCredential: true }; },
    initializeApp: (options, name) => { calls.initialize += 1; assert.equal(name, FIRST_READ_APP_NAME); return { ...app, options: { ...options, projectId } }; },
    deleteApp: async () => { calls.delete += 1; if (cleanupError) throw cleanupError; },
  };
  const instrumentedMigration = {
    ...migration,
    createLegacyMigrationFirebaseAdminProviderResolver: (input) => {
      const resolver = migration.createLegacyMigrationFirebaseAdminProviderResolver(input);
      return Object.freeze({
        ...resolver,
        resolveFirestoreCollection: (...args) => {
          calls.resolveCollection += 1;
          return resolver.resolveFirestoreCollection(...args);
        },
      });
    },
  };
  const runtime = {
    env: {
      [FIRST_READ_AUTHORIZATION_ENV]: authorization,
      ...(credentialEnv === undefined ? {} : { GOOGLE_APPLICATION_CREDENTIALS: credentialEnv }),
    },
    repositoryRoot: "C:\\repo",
    pathApi: path.win32,
    fileExists: () => true,
    compiledTargetExists: (target) => {
      const index = calls.compiledTargetChecks.length;
      calls.compiledTargetChecks.push(target);
      return index !== missingCompiledTargetIndex;
    },
    realpath: (value) => path.win32.resolve(value),
    loadAdmin: async () => { calls.loadAdmin += 1; return admin; },
    loadMigration: async () => { calls.loadMigration += 1; return instrumentedMigration; },
    getCollectionFirestore: (_targetApp, databaseId) => {
      calls.getFirestore += 1;
      assert.equal(databaseId, "(default)");
      return { collection: (collectionPath) => { assert.equal(collectionPath, FIRST_READ_PACKET.collectionPath); return query; } };
    },
    documentId: () => "__document_id__",
    deleteApp: admin.deleteApp,
    output: (report) => calls.output.push(report),
  };
  const report = runPhase05FirstBoundedProviderRead(runtime);
  return { calls, report };
};

const runAndCollect = async (options) => {
  const h = runtimeHarness(options);
  const report = await h.report;
  return { ...h, report };
};

test("importing the harness is inert and exports the frozen packet", () => {
  assert.equal(validateFrozenPacket(), true);
  assert.equal(Object.isFrozen(FIRST_READ_PACKET), true);
  assert.equal(Object.isFrozen(FIRST_READ_PACKET.fieldProjection), true);
  assert.equal(FIRST_READ_BUDGET.maxQueryGetUpperBound, 1);
});

test("frozen packet has the exact approved scope and ordered projection", () => {
  assert.deepEqual(FIRST_READ_PACKET, {
    logicalSourceId: "legacy.level_lesson",
    sourceSurface: "DIRECT_LEVEL_LESSON",
    levelId: "A1",
    sourceKind: "level_lesson",
    projectId: "english-for-polish",
    databaseId: "(default)",
    collectionPath: "levels/A1/lessons",
    fieldProjection: ["lessonId", "levelId", "level", "nivel", "moduleId", "moduleTitle", "title", "titulo", "orderInModule", "status"],
    pageSize: 5,
    providerLimit: 5,
    pageToken: null,
    maxPages: 1,
    maxDocuments: 5,
    maxOtherDatabases: 0,
    maxOtherLevels: 0,
    order: "DOCUMENT_PATH_ASC",
    schemaVariant: "legacy-v1",
    discoveryStrategyVersion: "phase05-source-discovery-v1",
    readPurposeVersion: "phase05-lesson-inventory-v1",
  });
  assert.equal(validateFrozenPacket({ ...FIRST_READ_PACKET, collectionPath: "levels/A2/lessons" }), false);
});

test("arming guard rejects absent, empty, and wrong values before loading credentials", async () => {
  for (const authorization of [null, "", "wrong"]) {
    const { calls, report } = await runAndCollect({ authorization });
    assert.equal(report.category, "EXECUTION_NOT_AUTHORIZED");
    assert.equal(calls.loadAdmin, 0);
    assert.equal(calls.credential, 0);
    assert.equal(calls.initialize, 0);
    assert.equal(calls.loadMigration, 0);
    assert.equal(calls.get, 0);
    assert.equal(calls.compiledTargetChecks.length, 0);
  }
});

test("ADC path check allows absent or external existing path and rejects missing/in-repo paths", () => {
  const inspect = (envPath, exists = true, canonical = (value) => path.win32.resolve(value)) => inspectCredentialEnvironment({
    env: envPath === undefined ? {} : { GOOGLE_APPLICATION_CREDENTIALS: envPath },
    repositoryRoot: "C:\\Repo",
    pathApi: path.win32,
    fileExists: () => exists,
    realpath: canonical,
  });
  assert.equal(inspect(undefined).ok, true);
  assert.equal(inspect("C:\\Secrets\\adc.json").ok, true);
  assert.deepEqual(inspect("C:\\Secrets\\missing.json", false), { ok: false, category: "ADC_PATH_MISSING" });
  assert.equal(inspect("C:\\Repo").category, "ADC_PATH_INSIDE_REPOSITORY");
  assert.equal(inspect("C:\\Repo\\nested\\adc.json").category, "ADC_PATH_INSIDE_REPOSITORY");
  assert.equal(inspect("C:\\repo\\nested\\adc.json").category, "ADC_PATH_INSIDE_REPOSITORY");
  assert.equal(inspect("C:\\RepoSibling\\adc.json").ok, true);
  assert.equal(isPathWithinRepository("C:\\Repo", "C:\\Repo", path.win32), true);
  assert.equal(isPathWithinRepository("C:\\RepoSibling\\file.json", "C:\\Repo", path.win32), false);
});

test("credential path failures do not reveal the credential path", async () => {
  const { calls, report } = await runAndCollect({
    credentialEnv: "C:\\repo\\private.json",
  });
  assert.equal(report.category, "ADC_PATH_INSIDE_REPOSITORY");
  assert.equal(JSON.stringify(report).includes("private.json"), false);
  assert.equal(calls.loadAdmin, 0);
  assert.equal(calls.compiledTargetChecks.length, 0);
});

test("armed execution with all build output absent stops before ADC or app initialization", async () => {
  const { calls, report } = await runAndCollect({ missingCompiledTargetIndex: 0 });
  assert.equal(report.status, "FAILURE");
  assert.equal(report.category, "BUILD_OUTPUT_REQUIRED");
  assert.equal(calls.compiledTargetChecks.length, 1);
  assert.equal(calls.loadAdmin, 0);
  assert.equal(calls.credential, 0);
  assert.equal(calls.initialize, 0);
  assert.equal(calls.loadMigration, 0);
  assert.equal(calls.resolveCollection, 0);
  assert.equal(calls.getFirestore, 0);
  assert.equal(calls.get, 0);
  assert.equal(calls.delete, 0);
  assert.equal(JSON.stringify(report).includes("C:\\repo"), false);
});

test("partial build output stops before ADC or app initialization", async () => {
  const { calls, report } = await runAndCollect({ missingCompiledTargetIndex: 3 });
  assert.equal(report.category, "BUILD_OUTPUT_REQUIRED");
  assert.equal(calls.compiledTargetChecks.length, 4);
  assert.equal(calls.loadAdmin, 0);
  assert.equal(calls.credential, 0);
  assert.equal(calls.initialize, 0);
  assert.equal(calls.loadMigration, 0);
  assert.equal(calls.resolveCollection, 0);
  assert.equal(calls.get, 0);
  assert.equal(calls.delete, 0);
});

test("all four compiled targets pass preflight before the fake runtime proceeds", async () => {
  const { calls, report } = await runAndCollect();
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.compiledTargetChecks.length, 4);
  assert.deepEqual(calls.compiledTargetChecks, [
    "C:\\repo\\functions\\lib\\migration\\legacyMigrationProviderSourcePlan.js",
    "C:\\repo\\functions\\lib\\migration\\legacyMigrationProviderBindingPlan.js",
    "C:\\repo\\functions\\lib\\migration\\legacyMigrationFirebaseAdminProviderResolver.js",
    "C:\\repo\\functions\\lib\\migration\\legacyMigrationProviderClientFactory.js",
  ]);
  assert.equal(calls.credential, 1);
  assert.equal(calls.initialize, 1);
  assert.equal(calls.get, 1);
});

test("named app collision fails before credential construction or initialization", async () => {
  const { calls, report } = await runAndCollect({ existingApps: [{ name: FIRST_READ_APP_NAME }] });
  assert.equal(report.category, "APP_NAME_COLLISION");
  assert.equal(calls.credential, 0);
  assert.equal(calls.initialize, 0);
  assert.equal(calls.loadMigration, 0);
  assert.equal(calls.delete, 0);
});

test("valid flow initializes and deletes exactly one named app and uses collection only", async () => {
  const { calls, report } = await runAndCollect();
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.credential, 1);
  assert.equal(calls.initialize, 1);
  assert.equal(calls.delete, 1);
  assert.equal(calls.resolveAuth, 0);
  assert.equal(calls.resolvePoint, 0);
  assert.equal(calls.getFirestore, 1);
  assert.equal(calls.get, 1);
  assert.equal(report.counters.appInitializationCount, 1);
  assert.equal(report.counters.getFirestoreResolutionCount, 1);
  assert.equal(report.counters.collectionDependencyInvocationCount, 1);
  assert.equal(report.counters.queryGetUpperBound, 1);
});

test("wrong app project stops before resolver/query and still deletes owned app", async () => {
  const { calls, report } = await runAndCollect({ projectId: "wrong-project" });
  assert.equal(report.category, "PROJECT_BINDING_MISMATCH");
  assert.equal(calls.loadMigration, 0);
  assert.equal(calls.getFirestore, 0);
  assert.equal(calls.get, 0);
  assert.equal(calls.delete, 1);
});

test("collection-only composition resolves no Auth or point capability", async () => {
  const { calls, report } = await runAndCollect();
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.resolveAuth, 0);
  assert.equal(calls.resolvePoint, 0);
  assert.equal(calls.getFirestore, 1);
});

test("getFirestore instrumentation rejects a second resolution", () => {
  const counters = { getFirestoreResolutionCount: 0 };
  let actual = 0;
  const bounded = createBoundedGetFirestore(() => { actual += 1; return {}; }, counters);
  bounded({}, "(default)");
  assert.throws(() => bounded({}, "(default)"), /budget exceeded/u);
  assert.equal(actual, 1);
  assert.equal(counters.getFirestoreResolutionCount, 1);
});

test("one listDocuments invocation is bounded by the published one-get bridge invariant", async () => {
  const { calls, report } = await runAndCollect();
  assert.equal(report.counters.collectionDependencyInvocationCount, 1);
  assert.equal(report.counters.queryGetUpperBound, 1);
  assert.equal(calls.get, 1);
});

test("full page reports token presence and never follows it", async () => {
  const documents = Array.from({ length: 5 }, (_, index) => providerDoc(`A1_${index + 1}`));
  const { calls, report } = await runAndCollect({ result: { kind: "provider-documents", documents } });
  assert.equal(report.status, "SUCCESS");
  assert.equal(report.returnedDocumentCount, 5);
  assert.equal(report.nextPageTokenPresent, true);
  assert.equal(calls.resolveCollection, 1);
  assert.equal(calls.getFirestore, 1);
  assert.equal(calls.get, 1);
  assert.equal(report.counters.paginationFollowupCount, 0);
  assert.equal(report.completeness, "PARTIAL_OR_UNKNOWN_PAGE_ONLY");
});

test("short and empty pages remain page-local and do not trigger fallback", async () => {
  for (const documents of [[], [providerDoc("A1_1"), providerDoc("A1_2")]]) {
    const { calls, report } = await runAndCollect({ result: { kind: "provider-documents", documents } });
    assert.equal(report.status, "SUCCESS");
    assert.equal(report.completeness, "PARTIAL_OR_UNKNOWN_PAGE_ONLY");
    assert.equal(report.returnedDocumentCount, documents.length);
    assert.equal(calls.resolveCollection, 1);
    assert.equal(calls.get, 1);
  }
});

test("provider failures stop without retry and raw error strings are not emitted", async () => {
  const { calls, report } = await runAndCollect({
    queryError: Object.assign(new Error("secret credential and token"), { code: 7 }),
  });
  assert.equal(report.status, "FAILURE");
  assert.equal(calls.get, 1);
  assert.equal(calls.delete, 1);
  assert.equal(report.counters.retryCount, 0);
  assert.equal(JSON.stringify(report).includes("secret credential and token"), false);
});

test("success output contains only approved projected fields and redacts token", async () => {
  const documents = Array.from({ length: 5 }, (_, index) => providerDoc(`A1_${index + 1}`, undefined, {
    title: index === 0 ? "Allowed" : `Title ${index + 1}`,
  }));
  const report = (await runAndCollect({ result: { kind: "provider-documents", documents } })).report;
  const serialized = JSON.stringify(report);
  assert.equal(report.status, "SUCCESS");
  assert.deepEqual(report.documents[0].projectedFields, { title: "Allowed" });
  assert.equal(report.nextPageTokenPresent, true);
  for (const forbidden of ["RAW_CONTINUATION_SECRET", "checksum"]) {
    assert.equal(serialized.includes(forbidden), false);
  }
  assert.equal(Object.hasOwn(report, "nextPageToken"), false);
});

test("cleanup failures are reported separately and do not mask primary outcomes", async () => {
  const success = await runAndCollect({ cleanupError: new Error("cleanup secret") });
  assert.equal(success.report.status, "SUCCESS_WITH_CLEANUP_FAILURE");
  assert.equal(success.report.cleanupFailure, "CLEANUP_FAILED");
  const failure = await runAndCollect({ queryError: new Error("provider secret"), cleanupError: new Error("cleanup secret") });
  assert.equal(failure.report.status, "FAILURE");
  assert.equal(failure.report.category, "COLLECTION_READ_FAILED");
  assert.equal(failure.report.cleanupFailure, "CLEANUP_FAILED");
  assert.equal(JSON.stringify(failure.report).includes("secret"), false);
});

test("collection outputs project the frozen identity and request shape", async () => {
  const { calls, report } = await runAndCollect();
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.get, 1);
  assert.equal(FIRST_READ_BUDGET.maxQueryGetUpperBound, 1);
});
