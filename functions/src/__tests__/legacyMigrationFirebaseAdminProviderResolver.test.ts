import assert from "node:assert/strict";
import test from "node:test";
import {
  createLegacyMigrationFirebaseAdminProviderResolver,
} from "../migration/legacyMigrationFirebaseAdminProviderResolver.js";
import { createLegacyMigrationProviderClients, createLegacyMigrationCollectionReadPort } from "../migration/legacyMigrationProviderClientFactory.js";
import type { LegacyMigrationProviderClientResolver } from "../migration/legacyMigrationProviderClientFactory.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  validateLegacyMigrationSourceDiscoveryConfig,
} from "../migration/legacyMigrationSourceDiscovery.js";
import { deriveLegacyMigrationProviderBindingPlan } from "../migration/legacyMigrationProviderBindingPlan.js";
import { deriveLegacyMigrationProviderSourcePlan } from "../migration/legacyMigrationProviderSourcePlan.js";

const app = { options: { projectId: "legacy-project" } };

const planFor = (sourceSet: readonly string[]) => {
  const sourcePlan = deriveLegacyMigrationProviderSourcePlan(validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
    supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    discoveryMode: "ALLOWLIST_ONLY",
    sourceSet,
  }));
  const bound = deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId: "legacy-project", databaseId: "named-db" });
  assert.equal(bound.kind, "resolved");
  if (bound.kind !== "resolved") throw new Error("test plan did not resolve");
  return bound.plan;
};

const resolverHarness = () => {
  const calls = { auth: 0, firestore: [] as string[], collection: [] as string[], gets: 0 };
  const query = {
    select: () => query,
    orderBy: () => query,
    startAfter: () => query,
    limit: () => query,
    get: async () => { calls.gets += 1; return { docs: [] }; },
  };
  const resolver = createLegacyMigrationFirebaseAdminProviderResolver({
    runtime: {
      getAuth: () => ({ getUser: async () => { calls.auth += 1; return { uid: "u" }; } }),
      getFirestore: (_app, databaseId) => {
        calls.firestore.push(databaseId);
        return { doc: () => ({ get: async () => ({ exists: false, id: "", data: () => undefined }) }) };
      },
      collectionQueryRuntime: {
        getFirestore: (_app, databaseId) => {
          calls.collection.push(databaseId);
          return { collection: () => query };
        },
        documentId: () => "__document_id__",
      },
    },
  });
  return { resolver, calls };
};

test("resolver exposes the mandatory read capabilities and composes with the published factory", () => {
  const { resolver, calls } = resolverHarness();
  const result = createLegacyMigrationProviderClients(app, planFor(["legacy.level_lesson"]), resolver);
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  assert.deepEqual(calls, { auth: 0, firestore: ["named-db"], collection: [], gets: 0 });
  const entry = result.clients.firestoreCollection;
  assert.ok(entry);
  assert.equal(typeof entry?.runCollectionPageQuery, "function");
  const portEntry = planFor(["legacy.level_lesson"]).entries[0];
  assert.ok(portEntry?.providerSurface === "FIRESTORE");
  const port = createLegacyMigrationCollectionReadPort(portEntry, result.clients);
  assert.equal(typeof port.listDocuments, "function");
});

test("resolver forwards explicit database IDs and performs no query during construction", async () => {
  const { resolver, calls } = resolverHarness();
  const collection = resolver.resolveFirestoreCollection?.(app, "legacy-project", "named-db");
  assert.ok(collection);
  assert.deepEqual(calls.collection, []);
  assert.equal(calls.gets, 0);
  await collection.runCollectionPageQuery({
    projectId: "legacy-project",
    databaseId: "named-db",
    collectionPath: "levels/A1/lessons",
    fieldProjection: ["lessonId"],
    pageSize: 1,
    startAfterDocumentId: null,
    order: "DOCUMENT_PATH_ASC",
  });
  assert.deepEqual(calls.collection, ["named-db"]);
  assert.equal(calls.gets, 1);
  const firestore = resolver.resolveFirestore(app, "legacy-project", "named-db");
  assert.deepEqual(calls.firestore, ["named-db"]);
  assert.equal(calls.gets, 1);
  assert.equal("set" in firestore, false);
  assert.equal("delete" in firestore, false);
});

test("resolver fails closed for project or database binding mismatches", () => {
  const { resolver } = resolverHarness();
  assert.throws(() => resolver.resolveFirestoreCollection?.(app, "other-project", "named-db"));
  assert.throws(() => resolver.resolveFirestoreCollection?.(app, "legacy-project", ""));
  assert.throws(() => resolver.resolveAuth(app, "other-project"));
});

test("resolver auth and point reads remain lazy and provider-neutral", async () => {
  const { resolver, calls } = resolverHarness();
  const auth = resolver.resolveAuth(app, "legacy-project");
  const point = resolver.resolveFirestore(app, "legacy-project", "named-db");
  assert.equal(calls.auth, 0);
  assert.equal(calls.gets, 0);
  assert.deepEqual(await auth.getUser("uid"), { uid: "u" });
  assert.equal(calls.auth, 1);
  assert.deepEqual(await point.getDocument("levels/A1"), { exists: false, id: "", data: null });
  assert.equal(calls.gets, 0);
});

const _resolverTypeCheck: LegacyMigrationProviderClientResolver = createLegacyMigrationFirebaseAdminProviderResolver({ runtime: {
  getAuth: () => ({ getUser: async () => ({}) }),
  getFirestore: () => ({ doc: () => ({ get: async () => ({ exists: false, id: "", data: () => undefined }) }) }),
} });
void _resolverTypeCheck;
