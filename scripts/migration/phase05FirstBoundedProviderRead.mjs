import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FIRST_READ_AUTHORIZATION_ENV = "PHASE05_FIRST_BOUNDED_PROVIDER_READ_AUTHORIZATION";
export const FIRST_READ_AUTHORIZATION_VALUE = "phase05-direct-a1-read-v1";
export const FIRST_READ_APP_NAME = "phase05-first-bounded-lesson-read";
export const FIRST_READ_PACKET = Object.freeze({
  logicalSourceId: "legacy.level_lesson",
  sourceSurface: "DIRECT_LEVEL_LESSON",
  levelId: "A1",
  sourceKind: "level_lesson",
  projectId: "english-for-polish",
  databaseId: "(default)",
  collectionPath: "levels/A1/lessons",
  fieldProjection: Object.freeze([
    "lessonId", "levelId", "level", "nivel", "moduleId", "moduleTitle", "title", "titulo", "orderInModule", "status",
  ]),
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
export const FIRST_READ_BUDGET = Object.freeze({
  maxFirebaseAppInitializations: 1,
  maxGetFirestoreCalls: 1,
  maxCollectionDependencyInvocations: 1,
  maxQueryGetUpperBound: 1,
  maxReturnedDocuments: 5,
  maxAuthUserReads: 0,
  maxPointFirestoreReads: 0,
  maxModuleInventoryReads: 0,
  maxNestedLessonReads: 0,
  maxFirestoreWrites: 0,
  maxProviderWrites: 0,
  maxMigrationMutations: 0,
  maxAutomaticRetries: 0,
  maxAutomaticPaginationFollowups: 0,
});

const packetExpected = Object.freeze({
  ...FIRST_READ_PACKET,
  fieldProjection: [...FIRST_READ_PACKET.fieldProjection],
});
const requestKeys = Object.freeze([
  "logicalSourceId", "sourceSurface", "projectId", "databaseId", "collectionPath", "fieldProjection",
  "pageSize", "pageToken", "maxPages", "maxDocuments", "order", "schemaVariant",
  "discoveryStrategyVersion", "readPurposeVersion",
]);
const allowedProjectedFields = new Set(FIRST_READ_PACKET.fieldProjection);
const requiredCompiledMigrationTargets = Object.freeze([
  Object.freeze(["functions", "lib", "migration", "legacyMigrationProviderSourcePlan.js"]),
  Object.freeze(["functions", "lib", "migration", "legacyMigrationProviderBindingPlan.js"]),
  Object.freeze(["functions", "lib", "migration", "legacyMigrationFirebaseAdminProviderResolver.js"]),
  Object.freeze(["functions", "lib", "migration", "legacyMigrationProviderClientFactory.js"]),
]);
const safeFailureCodes = new Set([
  "INVALID_REQUEST", "DESCRIPTOR_NOT_ALLOWLISTED", "SOURCE_DISCOVERY_REQUIRED", "PROVIDER_BINDING_MISMATCH",
  "PERMISSION_DENIED", "NOT_FOUND", "MALFORMED_PROVIDER_RESPONSE", "PAGINATION_LOOP", "READ_BOUND_EXCEEDED",
  "PARTIAL_INVENTORY", "UNSUPPORTED_PROJECTION", "PROVIDER_UNAVAILABLE", "PROVIDER_READ_FAILED",
]);

export const validateFrozenPacket = (packet = FIRST_READ_PACKET) => {
  const expected = packetExpected;
  const scalarKeys = Object.keys(expected).filter((key) => key !== "fieldProjection");
  if (scalarKeys.some((key) => packet?.[key] !== expected[key])) return false;
  return Array.isArray(packet?.fieldProjection)
    && packet.fieldProjection.length === expected.fieldProjection.length
    && packet.fieldProjection.every((field, index) => field === expected.fieldProjection[index]);
};

const isWindowsPathApi = (pathApi) => pathApi === path.win32;

export const isPathWithinRepository = (candidate, repositoryRoot, pathApi = path) => {
  const resolve = (value) => pathApi.resolve(value);
  const root = resolve(repositoryRoot);
  const target = resolve(candidate);
  const relative = pathApi.relative(root, target);
  const comparison = isWindowsPathApi(pathApi) ? relative.toLowerCase() : relative;
  return comparison === "" || (!pathApi.isAbsolute(relative)
    && comparison !== ".."
    && !comparison.startsWith(`..${pathApi.sep}`));
};

export const inspectCredentialEnvironment = ({
  env,
  repositoryRoot,
  pathApi = path,
  fileExists = fs.existsSync,
  realpath = (value) => fs.realpathSync.native(value),
}) => {
  const rawPath = env?.GOOGLE_APPLICATION_CREDENTIALS;
  if (typeof rawPath !== "string" || rawPath.trim() === "") return { ok: true, mode: "ADC_SOURCE_UNSPECIFIED" };
  let resolvedRoot;
  let resolvedCredential;
  try {
    if (!fileExists(rawPath)) return { ok: false, category: "ADC_PATH_MISSING" };
    resolvedRoot = realpath(repositoryRoot);
    resolvedCredential = realpath(rawPath);
  } catch {
    return { ok: false, category: "ADC_PATH_MISSING" };
  }
  if (isPathWithinRepository(resolvedCredential, resolvedRoot, pathApi)) {
    return { ok: false, category: "ADC_PATH_INSIDE_REPOSITORY" };
  }
  return { ok: true, mode: "ADC_EXTERNAL_FILE_PRESENT" };
};

const makeCounters = () => ({
  appInitializationCount: 0,
  getFirestoreResolutionCount: 0,
  collectionDependencyInvocationCount: 0,
  queryGetUpperBound: 1,
  returnedDocumentCount: 0,
  authUserReadCount: 0,
  pointFirestoreReadCount: 0,
  firestoreWriteCount: 0,
  providerWriteCount: 0,
  migrationMutationCount: 0,
  retryCount: 0,
  paginationFollowupCount: 0,
  otherDatabaseReadCount: 0,
  otherLevelReadCount: 0,
});

export const createBoundedGetFirestore = (getFirestore, counters) => (app, databaseId) => {
  if (counters.getFirestoreResolutionCount >= FIRST_READ_BUDGET.maxGetFirestoreCalls) {
    throw new Error("getFirestore budget exceeded");
  }
  counters.getFirestoreResolutionCount += 1;
  return getFirestore(app, databaseId);
};

const safeMessageFor = (category) => ({
  EXECUTION_NOT_AUTHORIZED: "Execution arming value is absent or invalid.",
  ADC_PATH_MISSING: "The configured external ADC file is unavailable.",
  ADC_PATH_INSIDE_REPOSITORY: "Credential paths inside the repository are rejected.",
  APP_NAME_COLLISION: "The reserved Firebase App name is already in use.",
  APP_INITIALIZATION_FAILED: "Firebase App initialization failed.",
  PROJECT_BINDING_MISMATCH: "Firebase App project binding did not match the frozen packet.",
  SOURCE_PLAN_INVALID: "The frozen source plan could not be resolved.",
  COLLECTION_READ_FAILED: "The bounded collection read failed.",
  CLEANUP_FAILED: "Firebase App cleanup failed.",
  PACKET_INVALID: "The frozen authorization packet failed validation.",
  RUNTIME_CONFIGURATION_INVALID: "The harness runtime configuration is incomplete.",
  BUILD_OUTPUT_REQUIRED: "Functions build output is required before provider execution.",
})[category] ?? "The bounded provider read stopped safely.";

const hasRequiredCompiledMigrationTargets = (repositoryRoot, pathApi, fileExists) => {
  try {
    return requiredCompiledMigrationTargets.every((segments) => fileExists(pathApi.resolve(repositoryRoot, ...segments)));
  } catch {
    return false;
  }
};

const safeProjectedFields = (fields) => {
  const result = {};
  if (fields && typeof fields === "object" && !Array.isArray(fields)) {
    for (const [key, value] of Object.entries(fields)) {
      if (allowedProjectedFields.has(key)
        && (value === null || ["string", "number", "boolean"].includes(typeof value))) result[key] = value;
    }
  }
  return result;
};

const sanitizePage = (page, counters) => {
  const documents = Array.isArray(page?.documents) ? page.documents.slice(0, FIRST_READ_BUDGET.maxReturnedDocuments) : [];
  counters.returnedDocumentCount = documents.length;
  return {
    status: "SUCCESS",
    returnedDocumentCount: documents.length,
    documents: documents.map((document) => ({
      documentId: typeof document?.documentId === "string" ? document.documentId : "",
      documentPath: typeof document?.documentPath === "string" ? document.documentPath : "",
      projectedFields: safeProjectedFields(document?.projectedFields),
    })),
    pageIndex: Number.isInteger(page?.pageIndex) && page.pageIndex >= 0 ? page.pageIndex : 0,
    completeness: "PARTIAL_OR_UNKNOWN_PAGE_ONLY",
    nextPageTokenPresent: typeof page?.nextPageToken === "string" && page.nextPageToken.length > 0,
    counters: { ...counters },
  };
};

const emitSafely = (sink, report) => {
  try { sink?.(report); } catch { /* Output failures never trigger another provider operation. */ }
};

const validatePreQueryBudget = (request, counters) => validateFrozenPacket()
  && request.projectId === "english-for-polish"
  && request.databaseId === "(default)"
  && request.collectionPath === "levels/A1/lessons"
  && request.sourceSurface === "DIRECT_LEVEL_LESSON"
  && request.pageSize === 5
  && request.pageToken === null
  && request.maxPages === 1
  && request.maxDocuments === 5
  && request.order === "DOCUMENT_PATH_ASC"
  && counters.collectionDependencyInvocationCount === 0
  && counters.authUserReadCount === 0
  && counters.pointFirestoreReadCount === 0
  && counters.firestoreWriteCount === 0
  && counters.retryCount === 0
  && counters.paginationFollowupCount === 0
  && counters.otherDatabaseReadCount === 0
  && counters.otherLevelReadCount === 0;

export const runPhase05FirstBoundedProviderRead = async (runtime) => {
  const counters = makeCounters();
  let app;
  let ownsApp = false;
  let primaryReport;
  const output = typeof runtime?.output === "function" ? runtime.output : () => {};
  const reportFailure = (category, stage, extra = {}) => ({
    status: "FAILURE", category, message: safeMessageFor(category), stage, counters: { ...counters }, ...extra,
  });

  if (!validateFrozenPacket()) primaryReport = reportFailure("PACKET_INVALID", "PACKET_VALIDATION");
  else if (runtime?.env?.[FIRST_READ_AUTHORIZATION_ENV] !== FIRST_READ_AUTHORIZATION_VALUE) {
    primaryReport = reportFailure("EXECUTION_NOT_AUTHORIZED", "ARMING_GUARD");
  } else {
    const credentialCheck = inspectCredentialEnvironment({
      env: runtime.env,
      repositoryRoot: runtime.repositoryRoot,
      pathApi: runtime.pathApi ?? path,
      fileExists: runtime.fileExists ?? fs.existsSync,
      realpath: runtime.realpath ?? ((value) => fs.realpathSync.native(value)),
    });
    if (!credentialCheck.ok) primaryReport = reportFailure(credentialCheck.category, "CREDENTIAL_PRECHECK");
    else if (!hasRequiredCompiledMigrationTargets(
      runtime.repositoryRoot,
      runtime.pathApi ?? path,
      runtime.compiledTargetExists ?? fs.existsSync,
    )) primaryReport = reportFailure("BUILD_OUTPUT_REQUIRED", "COMPILED_TARGET_PREFLIGHT");
    else if (typeof runtime.loadAdmin !== "function" || typeof runtime.loadMigration !== "function") {
      primaryReport = reportFailure("RUNTIME_CONFIGURATION_INVALID", "RUNTIME_CONFIGURATION");
    } else {
      let admin;
      let migration;
      try {
        admin = await runtime.loadAdmin();
        const existingApps = admin.getApps();
        if (existingApps.some((candidate) => candidate?.name === FIRST_READ_APP_NAME)) {
          primaryReport = reportFailure("APP_NAME_COLLISION", "APP_COLLISION");
        } else {
          if (counters.appInitializationCount >= FIRST_READ_BUDGET.maxFirebaseAppInitializations) {
            primaryReport = reportFailure("APP_INITIALIZATION_FAILED", "APP_INITIALIZATION");
          } else {
            counters.appInitializationCount += 1;
            app = await admin.initializeApp({
              credential: admin.applicationDefault(),
              projectId: FIRST_READ_PACKET.projectId,
            }, FIRST_READ_APP_NAME);
            ownsApp = true;
          }
          if (!primaryReport && app?.options?.projectId !== FIRST_READ_PACKET.projectId) {
            primaryReport = reportFailure("PROJECT_BINDING_MISMATCH", "PROJECT_BINDING");
          }
          if (!primaryReport) {
            migration = await runtime.loadMigration();
            const sourcePlan = migration.resolveLegacyMigrationProviderSourcePlanForLogicalSource(FIRST_READ_PACKET.logicalSourceId);
            const bound = migration.deriveLegacyMigrationProviderBindingPlan(sourcePlan, {
              projectId: FIRST_READ_PACKET.projectId,
              databaseId: FIRST_READ_PACKET.databaseId,
            });
            if (bound?.kind !== "resolved" || bound.plan.entries.length !== 1
              || bound.plan.entries[0]?.sourceKind !== FIRST_READ_PACKET.sourceKind) {
              primaryReport = reportFailure("SOURCE_PLAN_INVALID", "SOURCE_PLAN");
            } else {
              const resolver = migration.createLegacyMigrationFirebaseAdminProviderResolver({
                runtime: {
                  collectionQueryRuntime: {
                    getFirestore: createBoundedGetFirestore(runtime.getCollectionFirestore, counters),
                    documentId: () => runtime.documentId(),
                  },
                },
              });
              const collectionDependency = resolver.resolveFirestoreCollection(
                app, FIRST_READ_PACKET.projectId, FIRST_READ_PACKET.databaseId,
              );
              const clients = Object.freeze({
                selectedProjectId: FIRST_READ_PACKET.projectId,
                selectedDatabaseId: FIRST_READ_PACKET.databaseId,
                firestoreCollection: collectionDependency,
              });
              const port = migration.createLegacyMigrationCollectionReadPort(bound.plan.entries[0], clients);
              const request = Object.freeze(Object.fromEntries(requestKeys.map((key) => [key, FIRST_READ_PACKET[key]])));
              if (!validatePreQueryBudget(request, counters)) {
                primaryReport = reportFailure("PACKET_INVALID", "PRE_QUERY_ASSERTION");
              } else if (counters.collectionDependencyInvocationCount >= FIRST_READ_BUDGET.maxCollectionDependencyInvocations) {
                primaryReport = reportFailure("COLLECTION_READ_FAILED", "QUERY_BUDGET");
              } else {
                counters.collectionDependencyInvocationCount += 1;
                const result = await port.listDocuments(request);
                if (result?.kind === "failure") {
                  const code = safeFailureCodes.has(result.failure?.code) ? result.failure.code : "PROVIDER_READ_FAILED";
                  primaryReport = reportFailure("COLLECTION_READ_FAILED", "COLLECTION_READ", {
                    failureCode: code,
                    safeFailureMessage: "The adapter reported a normalized read failure.",
                  });
                } else if (result?.kind === "page") {
                  primaryReport = sanitizePage(result.page, counters);
                } else {
                  primaryReport = reportFailure("COLLECTION_READ_FAILED", "COLLECTION_READ", {
                    failureCode: "MALFORMED_PROVIDER_RESPONSE",
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        const category = error?.message === "getFirestore budget exceeded"
          ? "COLLECTION_READ_FAILED"
          : app === undefined ? "APP_INITIALIZATION_FAILED" : "COLLECTION_READ_FAILED";
        primaryReport = reportFailure(category, app === undefined ? "APP_INITIALIZATION" : "COLLECTION_COMPOSITION");
      }
    }
  }

  if (!primaryReport) primaryReport = reportFailure("RUNTIME_CONFIGURATION_INVALID", "RUNTIME_CONFIGURATION");
  if (ownsApp) {
    try {
      await (runtime.deleteApp ?? (await runtime.loadAdmin()).deleteApp)(app);
    } catch {
      primaryReport = { ...primaryReport, cleanupFailure: "CLEANUP_FAILED" };
      if (primaryReport.status === "SUCCESS") primaryReport.status = "SUCCESS_WITH_CLEANUP_FAILURE";
    }
  }
  primaryReport.counters = { ...counters };
  emitSafely(output, primaryReport);
  return primaryReport;
};

const createProductionRuntime = () => {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const functionsPackage = path.join(repositoryRoot, "functions", "package.json");
  const functionsRequire = createRequire(functionsPackage);
  const loadAdmin = async () => {
    const appApi = functionsRequire("firebase-admin/app");
    return {
      getApps: appApi.getApps,
      applicationDefault: appApi.applicationDefault,
      initializeApp: appApi.initializeApp,
      deleteApp: appApi.deleteApp,
    };
  };
  const loadMigration = async () => {
    const compiledRoot = path.join(repositoryRoot, "functions", "lib", "migration");
    const importModule = (name) => import(pathToFileURL(path.join(compiledRoot, name)).href);
    const [source, binding, resolver, factory] = await Promise.all([
      importModule("legacyMigrationProviderSourcePlan.js"),
      importModule("legacyMigrationProviderBindingPlan.js"),
      importModule("legacyMigrationFirebaseAdminProviderResolver.js"),
      importModule("legacyMigrationProviderClientFactory.js"),
    ]);
    return {
      resolveLegacyMigrationProviderSourcePlanForLogicalSource: source.resolveLegacyMigrationProviderSourcePlanForLogicalSource,
      deriveLegacyMigrationProviderBindingPlan: binding.deriveLegacyMigrationProviderBindingPlan,
      createLegacyMigrationFirebaseAdminProviderResolver: resolver.createLegacyMigrationFirebaseAdminProviderResolver,
      createLegacyMigrationCollectionReadPort: factory.createLegacyMigrationCollectionReadPort,
    };
  };
  return {
    env: process.env,
    repositoryRoot,
    loadAdmin,
    loadMigration,
    getCollectionFirestore: (app, databaseId) => functionsRequire("firebase-admin/firestore").getFirestore(app, databaseId),
    documentId: () => functionsRequire("firebase-admin/firestore").FieldPath.documentId(),
    deleteApp: async (app) => (await loadAdmin()).deleteApp(app),
    output: (report) => process.stdout.write(`${JSON.stringify(report)}\n`),
  };
};

const isDirectExecution = () => {
  const invokedPath = process.argv[1];
  return typeof invokedPath === "string"
    && pathToFileURL(path.resolve(invokedPath)).href === import.meta.url;
};

if (isDirectExecution()) {
  runPhase05FirstBoundedProviderRead(createProductionRuntime()).then((report) => {
    if (report.status !== "SUCCESS") process.exitCode = 1;
  }).catch(() => {
    process.stdout.write(`${JSON.stringify({ status: "FAILURE", category: "RUNTIME_CONFIGURATION_INVALID" })}\n`);
    process.exitCode = 1;
  });
}
