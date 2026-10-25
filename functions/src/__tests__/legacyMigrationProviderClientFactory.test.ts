import assert from "node:assert/strict";
import test from "node:test";
import type { App } from "firebase-admin/app";
import {
  createLegacyMigrationProviderClients,
  createLegacyMigrationCollectionReadPort,
  type LegacyMigrationProviderClientResolver,
} from "../migration/legacyMigrationProviderClientFactory.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  validateLegacyMigrationSourceDiscoveryConfig,
} from "../migration/legacyMigrationSourceDiscovery.js";
import { deriveLegacyMigrationProviderBindingPlan } from "../migration/legacyMigrationProviderBindingPlan.js";
import { deriveLegacyMigrationProviderSourcePlan } from "../migration/legacyMigrationProviderSourcePlan.js";

const app = (projectId: string): App => ({ options: { projectId } } as unknown as App);

const planFor = (sourceSet: readonly string[], projectId = "legacy-project", databaseId = "legacy-database") => {
  const sourcePlan = deriveLegacyMigrationProviderSourcePlan(validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
    supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    discoveryMode: "ALLOWLIST_ONLY",
    sourceSet,
  }));
  const bound = deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId, databaseId });
  assert.equal(bound.kind, "resolved");
  if (bound.kind !== "resolved") throw new Error("test plan did not resolve");
  return bound.plan;
};

const resolverFor = (calls: { auth: number; firestore: number; databaseIds: string[]; reads: number[] }): LegacyMigrationProviderClientResolver => ({
  resolveAuth: () => {
    calls.auth += 1;
    return Object.freeze({ getUser: async () => { calls.reads[0] = (calls.reads[0] ?? 0) + 1; return { uid: "u" }; } });
  },
  resolveFirestore: (...args) => {
    const databaseId = args[2];
    calls.firestore += 1;
    calls.databaseIds.push(databaseId);
    return Object.freeze({ getDocument: async () => { calls.reads[1] = (calls.reads[1] ?? 0) + 1; return { exists: false, id: "", data: null }; } });
  },
});

test("provider factory accepts an exact project binding", () => {
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  const result = createLegacyMigrationProviderClients(app("legacy-project"), planFor(["legacy.auth_identity"]), resolverFor(calls));
  assert.equal(result.kind, "resolved");
  assert.equal(calls.auth, 1);
  assert.equal(calls.firestore, 0);
  assert.deepEqual(calls.reads, []);
});

test("provider factory rejects a project mismatch before resolving clients", () => {
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  const result = createLegacyMigrationProviderClients(app("other-project"), planFor(["legacy.auth_identity"]), resolverFor(calls));
  assert.deepEqual(result, { kind: "unsupported_or_conflicting_binding", reason: "PROJECT_CONFLICT" });
  assert.deepEqual(calls, { auth: 0, firestore: 0, databaseIds: [], reads: [] });
});

test("provider factory propagates the explicit selected database", () => {
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  const result = createLegacyMigrationProviderClients(app("legacy-project"), planFor(["legacy.user_profile"]), resolverFor(calls));
  assert.equal(result.kind, "resolved");
  assert.deepEqual(calls.databaseIds, ["legacy-database"]);
});

test("provider factory rejects a Firestore plan without a database", () => {
  const plan = planFor(["legacy.user_profile"]);
  const withoutDatabase = { ...plan, selectedDatabaseId: undefined } as unknown as typeof plan;
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  assert.deepEqual(createLegacyMigrationProviderClients(app("legacy-project"), withoutDatabase, resolverFor(calls)), {
    kind: "provider_selection_required",
    missing: "DATABASE",
  });
  assert.equal(calls.firestore, 0);
});

test("provider factory never substitutes a default database", () => {
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  createLegacyMigrationProviderClients(app("legacy-project"), planFor(["legacy.user_profile"], "legacy-project", "named-db"), resolverFor(calls));
  assert.deepEqual(calls.databaseIds, ["named-db"]);
  assert.equal((calls.databaseIds as readonly string[]).includes("(default)"), false);
});

test("factory does not initialize or delete the supplied App", () => {
  const supplied = app("legacy-project") as App & { initialized?: boolean; deleted?: boolean };
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  createLegacyMigrationProviderClients(supplied, planFor(["legacy.auth_identity"]), resolverFor(calls));
  assert.equal(supplied.initialized, undefined);
  assert.equal(supplied.deleted, undefined);
});

test("factory has no global cache and uses the injected resolver", () => {
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  const resolver = resolverFor(calls);
  const plan = planFor(["legacy.auth_identity"]);
  createLegacyMigrationProviderClients(app("legacy-project"), plan, resolver);
  createLegacyMigrationProviderClients(app("legacy-project"), plan, resolver);
  assert.equal(calls.auth, 2);
});

test("client construction and composition do not perform provider reads", () => {
  const calls = { auth: 0, firestore: 0, databaseIds: [], reads: [] as number[] };
  createLegacyMigrationProviderClients(app("legacy-project"), planFor(["legacy.user_profile"]), resolverFor(calls));
  assert.deepEqual(calls.reads, []);
});

test("factory composes the optional collection capability with the explicit database", () => {
  const calls = { collection: 0, databaseIds: [] as string[] };
  const resolver: LegacyMigrationProviderClientResolver = {
    ...resolverFor({ auth: 0, firestore: 0, databaseIds: [], reads: [] }),
    resolveFirestoreCollection: (_app, _projectId, databaseId) => {
      calls.collection += 1;
      calls.databaseIds.push(databaseId);
      return Object.freeze({ runCollectionPageQuery: async () => [] });
    },
  };
  const plan = planFor(["legacy.level_lesson"]);
  const result = createLegacyMigrationProviderClients(app("legacy-project"), plan, resolver);
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  assert.equal(calls.collection, 1);
  assert.deepEqual(calls.databaseIds, ["legacy-database"]);
  assert.ok(result.clients.firestoreCollection);
  assert.equal(typeof result.clients.firestoreCollection?.runCollectionPageQuery, "function");
});

test("factory does not compose a lesson collection capability for unrelated Firestore sources", () => {
  let collectionResolverCalls = 0;
  const resolver: LegacyMigrationProviderClientResolver = {
    ...resolverFor({ auth: 0, firestore: 0, databaseIds: [], reads: [] }),
    resolveFirestoreCollection: () => {
      collectionResolverCalls += 1;
      return Object.freeze({ runCollectionPageQuery: async () => [] });
    },
  };
  const result = createLegacyMigrationProviderClients(app("legacy-project"), planFor(["legacy.user_profile"]), resolver);
  assert.equal(result.kind, "resolved");
  assert.equal(collectionResolverCalls, 0);
});

test("collection port composition is additive and remains read-only", () => {
  const plan = planFor(["legacy.level_lesson"]);
  const resolver: LegacyMigrationProviderClientResolver = {
    ...resolverFor({ auth: 0, firestore: 0, databaseIds: [], reads: [] }),
    resolveFirestoreCollection: () => Object.freeze({ runCollectionPageQuery: async () => [] }),
  };
  const result = createLegacyMigrationProviderClients(app("legacy-project"), plan, resolver);
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  const entry = plan.entries.find((candidate) => candidate.providerSurface === "FIRESTORE");
  assert.ok(entry?.providerSurface === "FIRESTORE");
  const port = createLegacyMigrationCollectionReadPort(entry, result.clients);
  assert.equal(typeof port.listDocuments, "function");
  assert.equal("readCandidates" in port, false);
  assert.equal("set" in port, false);
});

test("collection port rejects non-lesson or missing collection capabilities", () => {
  const userPlan = planFor(["legacy.user_profile"]);
  const baseResolver = resolverFor({ auth: 0, firestore: 0, databaseIds: [], reads: [] });
  const userResult = createLegacyMigrationProviderClients(app("legacy-project"), userPlan, baseResolver);
  assert.equal(userResult.kind, "resolved");
  if (userResult.kind !== "resolved") return;
  const userEntry = userPlan.entries.find((candidate) => candidate.providerSurface === "FIRESTORE");
  assert.ok(userEntry?.providerSurface === "FIRESTORE");
  assert.throws(() => createLegacyMigrationCollectionReadPort(userEntry, userResult.clients));

  const lessonPlan = planFor(["legacy.level_lesson"]);
  const lessonResult = createLegacyMigrationProviderClients(app("legacy-project"), lessonPlan, baseResolver);
  assert.equal(lessonResult.kind, "resolved");
  if (lessonResult.kind !== "resolved") return;
  const lessonEntry = lessonPlan.entries.find((candidate) => candidate.providerSurface === "FIRESTORE");
  assert.ok(lessonEntry?.providerSurface === "FIRESTORE");
  assert.throws(() => createLegacyMigrationCollectionReadPort(lessonEntry, lessonResult.clients));
});
