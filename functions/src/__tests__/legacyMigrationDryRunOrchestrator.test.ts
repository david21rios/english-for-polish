import assert from "node:assert/strict";
import test from "node:test";
import { createMappingTableInput } from "../migration/mappingTable.js";
import {
  LegacyMigrationDryRunError,
  runLegacyMigrationDryRun,
  type LegacyMigrationDryRunDependencies,
  type LegacyMigrationDryRunRequest,
} from "../migration/legacyMigrationDryRunOrchestrator.js";
import {
  APPROVED_LEGACY_TENANT_ID,
  MIGRATION_CONTRACT_VERSION,
  type ApprovedMappingRow,
  type CanonicalTargetProjection,
  type CandidateType,
  type MappingTableInput,
} from "../migration/legacyMigrationTypes.js";
import { type LegacyMigrationSourceRecord } from "../migration/legacyMigrationReadPorts.js";

const mappingRow: ApprovedMappingRow = {
  mappingTableId: "mapping-table",
  mappingTableVersion: "v1",
  mappingId: "mapping-1",
  legacySourceKind: "organization",
  legacyOrganizationId: "org-1",
  legacyInstitutionId: "inst-1",
  targetTenantId: APPROVED_LEGACY_TENANT_ID,
  mappingStatus: "approved",
  provenanceCode: "PRODUCT_OWNER_APPROVED_MAPPING",
  approvalEvidenceCode: "reviewed",
  reviewReference: "review-1",
  effectiveLogicalTime: "2026-01-01T00:00:00.000Z",
  schemaVersion: "v1",
};

const mappingTable = createMappingTableInput("mapping-table", "v1", [mappingRow]);

const projection = (
  entityType: "identity" | "tenant" | "membership" | "course" | "enrollment",
  targetId: string,
  semanticFields: Record<string, string | boolean> = { targetId },
): CanonicalTargetProjection => ({
  exists: true,
  comparable: true,
  entityType,
  targetId,
  tenantId: APPROVED_LEGACY_TENANT_ID,
  semanticFields,
});

const sourceRecord = (
  candidateType: CandidateType = "identity_migration",
  recordId = "user-1",
  overrides: Partial<LegacyMigrationSourceRecord> = {},
): LegacyMigrationSourceRecord => {
  const entityType = candidateType === "identity_migration"
    ? "identity"
    : candidateType === "organization_institution_mapping"
      ? "tenant"
      : candidateType === "membership_role_migration"
        ? "membership"
        : candidateType === "course_mapping" ? "course" : "enrollment";
  const targetId = entityType === "identity" ? "uid-1" : `${entityType}-1`;
  return {
    candidateType,
    sourceReference: { collectionPath: "legacy", entityKind: candidateType, recordId },
    targetReference: {
      tenantId: APPROVED_LEGACY_TENANT_ID,
      entityType,
      targetId,
      targetReference: `${entityType}/${targetId}`,
    },
    expectedTargetProjection: projection(entityType, targetId),
    ...overrides,
  } as LegacyMigrationSourceRecord;
};

const request = (table: MappingTableInput = mappingTable): LegacyMigrationDryRunRequest => ({
  migrationContractVersion: MIGRATION_CONTRACT_VERSION,
  runId: "run-1",
  correlationId: "correlation-1",
  legacyTenantId: APPROVED_LEGACY_TENANT_ID,
  mode: "DRY_RUN",
  sourceSelection: { sourceKinds: ["normalized-test"], boundedSourceReferences: null },
  mappingTable: table,
  mappingTableId: table.mappingTableId,
  mappingTableVersion: table.mappingTableVersion,
  candidateFilters: { candidateTypes: null, stableSourceIds: null },
  operatorBoundary: { actorType: "human_operator", actorReference: null },
  startedLogicalTime: "2026-01-01T00:00:00.000Z",
  completedLogicalTime: "2026-01-01T00:01:00.000Z",
});

const dependenciesFor = (
  records: readonly LegacyMigrationSourceRecord[],
  target: (candidate: LegacyMigrationSourceRecord) => CanonicalTargetProjection = (candidate) => ({
    ...candidate.expectedTargetProjection,
    exists: false,
  }),
  calls: { target: number } = { target: 0 },
): LegacyMigrationDryRunDependencies => ({
  sourceReadPort: { readCandidates: async () => ({ kind: "records", records }) },
  targetReadPort: {
    readTarget: async (candidate) => {
      calls.target += 1;
      return target(candidate);
    },
  },
});

const expectCategory = async (promise: Promise<unknown>, category: string): Promise<void> => {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof LegacyMigrationDryRunError);
    assert.equal(error.category, category);
    assert.equal(error.scope, "WHOLE_RUN");
    return true;
  });
};

test("empty normalized source produces a zero-write report", async () => {
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([]));
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.report.counts, {
    totalCandidates: 0,
    eligibleCreate: 0,
    noOpIdempotent: 0,
    quarantined: 0,
    humanReviewRequired: 0,
    unsupportedSource: 0,
    sourceDiscoveryRequired: 0,
  });
  assert.equal(result.report.writesOccurred, false);
  assert.equal(result.report.executionAuthorized, false);
});

test("source order does not affect candidate or report order", async () => {
  const first = sourceRecord("identity_migration", "a");
  const second = sourceRecord("identity_migration", "b");
  const forward = await runLegacyMigrationDryRun(request(), dependenciesFor([first, second]));
  const reverse = await runLegacyMigrationDryRun(request(), dependenciesFor([second, first]));
  assert.deepEqual(reverse, forward);
  assert.deepEqual(forward.candidates.map((candidate) => candidate.sortKey), [
    "identity_migration\u0000legacy\u0000a\u0000identity/uid-1",
    "identity_migration\u0000legacy\u0000b\u0000identity/uid-1",
  ]);
});

test("repeating the same dry run is byte-identical", async () => {
  const records = [sourceRecord("identity_migration", "repeat")];
  const first = await runLegacyMigrationDryRun(request(), dependenciesFor(records));
  const second = await runLegacyMigrationDryRun(request(), dependenciesFor(records));
  assert.equal(JSON.stringify(second), JSON.stringify(first));
});

test("valid mapping and absent target produce an eligible create without a write surface", async () => {
  const record = sourceRecord("organization_institution_mapping", "mapping-1", {
    organizationInstitutionEvidence: { organizationId: "org-1", institutionId: "inst-1" },
  });
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([record]));
  assert.equal(result.candidates[0]?.classification, "ELIGIBLE_CREATE");
  assert.equal(result.candidates[0]?.proposedOperation, "CREATE");
  assert.equal(result.report.writesOccurred, false);
});

test("semantic target match produces an idempotent no-op", async () => {
  const record = sourceRecord();
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([record], (candidate) => candidate.expectedTargetProjection));
  assert.equal(result.candidates[0]?.classification, "NO_OP_IDEMPOTENT");
  assert.equal(result.candidates[0]?.proposedOperation, "NO_OP");
});

test("target conflict uses the approved review and no-write outcome", async () => {
  const record = sourceRecord();
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([record], (candidate) => ({
    ...candidate.expectedTargetProjection,
    semanticFields: { targetId: "different" },
  })));
  assert.equal(result.candidates[0]?.classification, "HUMAN_REVIEW_REQUIRED");
  assert.deepEqual(result.candidates[0]?.reasonCodes, ["CONFLICTING_TARGET_STATE"]);
  assert.equal(result.candidates[0]?.proposedOperation, "NO_WRITE");
});

test("uncomparable target uses the approved no-write outcome", async () => {
  const record = sourceRecord();
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([record], (candidate) => ({
    ...candidate.expectedTargetProjection,
    comparable: false,
  })));
  assert.equal(result.candidates[0]?.classification, "HUMAN_REVIEW_REQUIRED");
  assert.deepEqual(result.candidates[0]?.reasonCodes, ["TARGET_COMPARISON_IMPOSSIBLE"]);
  assert.equal(result.candidates[0]?.proposedOperation, "NO_WRITE");
});

test("source discovery required is not silently treated as an empty source", async () => {
  const dependencies: LegacyMigrationDryRunDependencies = {
    sourceReadPort: { readCandidates: async () => ({ kind: "source_discovery_required" }) },
    targetReadPort: { readTarget: async (candidate) => ({ ...candidate.expectedTargetProjection, exists: false }) },
  };
  await expectCategory(runLegacyMigrationDryRun(request(), dependencies), "SOURCE_DISCOVERY_REQUIRED");
});

test("source read failures are typed whole-run failures", async () => {
  const dependencies: LegacyMigrationDryRunDependencies = {
    sourceReadPort: { readCandidates: async () => { throw new Error("source unavailable"); } },
    targetReadPort: { readTarget: async (candidate) => ({ ...candidate.expectedTargetProjection, exists: false }) },
  };
  await expectCategory(runLegacyMigrationDryRun(request(), dependencies), "SOURCE_READ_FAILURE");
});

test("target read failures are not converted into candidate conflicts", async () => {
  const dependencies: LegacyMigrationDryRunDependencies = {
    sourceReadPort: { readCandidates: async () => ({ kind: "records", records: [sourceRecord()] }) },
    targetReadPort: { readTarget: async () => { throw new Error("target unavailable"); } },
  };
  await expectCategory(runLegacyMigrationDryRun(request(), dependencies), "TARGET_READ_FAILURE");
});

test("malformed normalized source is quarantined without a target read", async () => {
  const calls = { target: 0 };
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([
    sourceRecord("identity_migration", "malformed", { reasonCodes: ["MALFORMED_SOURCE_DATA"] }),
  ], undefined, calls));
  assert.equal(result.candidates[0]?.classification, "QUARANTINE");
  assert.deepEqual(result.candidates[0]?.reasonCodes, ["MALFORMED_SOURCE_DATA"]);
  assert.equal(calls.target, 0);
});

test("invalid mapping tables produce the exact mapping-table error category", async () => {
  const invalid = {
    ...mappingTable,
    approvedRows: [{ ...mappingRow, targetTenantId: "wrong-tenant" }],
  } as unknown as MappingTableInput;
  await expectCategory(runLegacyMigrationDryRun(request(invalid), dependenciesFor([])), "MAPPING_TABLE_INVALID");
});

test("unsupported source candidates do not cause unnecessary target reads", async () => {
  const calls = { target: 0 };
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([
    sourceRecord("course_mapping", "unsupported", { reasonCodes: ["UNSUPPORTED_LEGACY_SOURCE_STATE"] }),
  ], undefined, calls));
  assert.equal(result.candidates[0]?.classification, "UNSUPPORTED_SOURCE");
  assert.equal(calls.target, 0);
});

test("the supplied mapping table remains immutable", async () => {
  const before = JSON.stringify(mappingTable);
  await runLegacyMigrationDryRun(request(), dependenciesFor([]));
  assert.equal(JSON.stringify(mappingTable), before);
  assert.equal(Object.isFrozen(mappingTable), true);
  assert.equal(Object.isFrozen(mappingTable.approvedRows), true);
});

test("the dependency surface contains only normalized read ports", () => {
  const dependencies = dependenciesFor([]);
  assert.deepEqual(Object.keys(dependencies).sort(), ["sourceReadPort", "targetReadPort"]);
  assert.equal("writer" in dependencies, false);
  assert.equal("writeStore" in dependencies, false);
  assert.equal("transactionRunner" in dependencies, false);
});

test("the final report always remains explicitly dry-run and zero-write", async () => {
  const result = await runLegacyMigrationDryRun(request(), dependenciesFor([sourceRecord()]));
  assert.equal(result.report.writesOccurred, false);
  assert.equal(result.report.executionAuthorized, false);
});
