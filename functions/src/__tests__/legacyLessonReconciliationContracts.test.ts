import assert from "node:assert/strict";
import test from "node:test";
import {
  LESSON_RECONCILIATION_POLICY_VERSION,
  deriveLegacyLessonLogicalKey,
  deriveLegacyLessonResultId,
  expectedLessonSourceOutcome,
  validateLegacyLessonInventoryRecord,
  validateLegacyLessonReconciliationCandidate,
  validateLegacyLessonReconciliationResult,
  validateLegacyLessonSourceProvenance,
  validateLegacyUnknownFieldEvidence,
} from "../migration/legacyLessonReconciliationContracts.js";
import type {
  LegacyLessonInventoryRecord,
  LegacyLessonReconciliationResult,
  LegacyLessonSourceSurface,
} from "../migration/legacyLessonReconciliationContracts.js";

const sourceValues = (surface: LegacyLessonSourceSurface, lessonId: string, status: string, moduleId = "A1_M01_pruebaa1") => {
  const nested = surface === "NESTED_MODULE_LESSON";
  const path = nested
    ? `levels/A1/modules/${moduleId}/lessons/${lessonId}`
    : `levels/A1/lessons/${lessonId}`;
  const sourceKind = nested ? "level_module_lesson" : "level_lesson";
  const sourceId = nested ? "legacy.level_module_lesson" : "legacy.level_lesson";
  return { path, sourceKind, sourceId, moduleId };
};

const provenance = (surface: LegacyLessonSourceSurface, lessonId: string, status: string, moduleId: string | null = "A1_M01_pruebaa1") => {
  const source = sourceValues(surface, lessonId, status, moduleId ?? "A1_M01_pruebaa1");
  return {
    logicalSourceId: source.sourceId,
    collectionPath: source.path,
    legacyDocumentId: lessonId,
    sourceKind: source.sourceKind,
    schemaVariant: "legacy-v1",
    discoveryStrategyVersion: "phase05-source-discovery-v1",
    sourceReference: { collectionPath: source.path, entityKind: source.sourceKind, recordId: lessonId },
    sourceSurface: surface,
    levelId: "A1",
    lessonId,
    moduleId,
    sourceStatus: status,
  };
};

const present = <T>(value: T) => ({ presence: "PRESENT" as const, value });

const inventory = (
  surface: LegacyLessonSourceSurface,
  lessonId: string,
  status: string,
  overrides: { moduleId?: string | null; title?: string } = {},
): LegacyLessonInventoryRecord => {
  const moduleId = overrides.moduleId === undefined ? "A1_M01_pruebaa1" : overrides.moduleId;
  const source = sourceValues(surface, lessonId, status, moduleId ?? "A1_M01_pruebaa1");
  return {
    sourceSurface: surface,
    logicalIdentity: { levelId: "A1", lessonId },
    sourcePath: source.path,
    sourceReference: { collectionPath: source.path, entityKind: source.sourceKind, recordId: lessonId },
    provenance: provenance(surface, lessonId, status, moduleId),
    moduleId: moduleId === null ? { presence: "ABSENT" } : present(moduleId),
    moduleTitle: present("Foundations of Communication"),
    title: present(overrides.title ?? "Liczby 0-20"),
    titulo: present(overrides.title ?? "Liczby 0-20"),
    orderInModule: present(2),
    status: present(status),
    contentHashes: [],
    unknownFields: [],
  };
};

const resultBase = (
  direct: LegacyLessonInventoryRecord | null,
  nested: LegacyLessonInventoryRecord | null,
  classification: "EXACT_MIRROR" | "DIVERGENT_MIRROR" | "NESTED_ONLY" | "DIRECT_ONLY",
  sourceOutcome: "DEDUPLICATED_LOGICAL_CANDIDATE" | "NO_WRITE_REVIEW_REQUIRED" | "ELIGIBLE_LOGICAL_CANDIDATE" | "QUARANTINE_REVIEW_REQUIRED",
  reviewRequired: boolean,
  reasonCodes: readonly ("EXACT_MIRROR" | "STATUS_MISMATCH" | "NESTED_ONLY" | "DIRECT_ONLY")[],
): LegacyLessonReconciliationResult => ({
  resultId: deriveLegacyLessonResultId({
    logicalIdentity: { levelId: "A1", lessonId: direct?.logicalIdentity.lessonId ?? nested?.logicalIdentity.lessonId ?? "A1_1" },
    directPath: direct?.sourcePath ?? null,
    nestedPath: nested?.sourcePath ?? null,
  }),
  policyVersion: LESSON_RECONCILIATION_POLICY_VERSION,
  logicalIdentity: { levelId: "A1", lessonId: direct?.logicalIdentity.lessonId ?? nested?.logicalIdentity.lessonId ?? "A1_1" },
  direct,
  nested,
  classification,
  fieldConflicts: classification === "DIVERGENT_MIRROR" ? [{
    fieldPath: "status",
    directEvidence: { representation: "VALUE", value: "draft" },
    nestedEvidence: { representation: "VALUE", value: "published" },
    comparisonState: "MISMATCH",
    resolutionState: "HUMAN_DECISION_REQUIRED",
    reasonCode: "STATUS_MISMATCH",
    reviewRequired: true,
  }] : [],
  reasonCodes,
  sourceOutcome,
  reviewState: {
    reviewRequired,
    reviewReasons: reasonCodes,
    conflictFields: classification === "DIVERGENT_MIRROR" ? ["status"] : [],
    policyDecisionRequired: reviewRequired,
    resolutionStatus: reviewRequired ? "PENDING" : "NOT_REQUIRED",
  },
  targetComparisonEligible: !reviewRequired,
});

test("logical identity and result keys are canonical and deterministic", () => {
  const first = deriveLegacyLessonLogicalKey({ levelId: "A1", lessonId: "A1_2" });
  const second = deriveLegacyLessonLogicalKey({ lessonId: "A1_2", levelId: "A1" });
  assert.equal(first, second);
  assert.notEqual(first, deriveLegacyLessonLogicalKey({ levelId: "A2", lessonId: "A1_2" }));
  assert.notEqual(first, deriveLegacyLessonLogicalKey({ levelId: "A1", lessonId: "A1_3" }));
  assert.throws(() => deriveLegacyLessonLogicalKey({ levelId: " A1", lessonId: "A1_2" }));
  assert.equal(
    deriveLegacyLessonResultId({ logicalIdentity: { levelId: "A1", lessonId: "A1_2" }, directPath: "direct", nestedPath: "nested" }),
    deriveLegacyLessonResultId({ logicalIdentity: { lessonId: "A1_2", levelId: "A1" }, directPath: "direct", nestedPath: "nested" }),
  );
});

test("source provenance and inventory records preserve both lesson surfaces", () => {
  const direct = inventory("DIRECT_LEVEL_LESSON", "A1_2", "draft");
  const nested = inventory("NESTED_MODULE_LESSON", "A1_2", "published");
  assert.equal(validateLegacyLessonInventoryRecord(direct).sourceSurface, "DIRECT_LEVEL_LESSON");
  assert.equal(validateLegacyLessonInventoryRecord(nested).sourceSurface, "NESTED_MODULE_LESSON");
  assert.equal(validateLegacyLessonSourceProvenance(direct.provenance).sourceStatus, "draft");
  assert.equal(validateLegacyLessonSourceProvenance(nested.provenance).sourceStatus, "published");
  assert.throws(() => validateLegacyLessonSourceProvenance({ ...direct.provenance, lessonId: "A1_3" }));
  assert.throws(() => validateLegacyLessonInventoryRecord({ ...direct, provenance: undefined }));
  assert.throws(() => validateLegacyLessonInventoryRecord({
    ...direct,
    provenance: { ...direct.provenance, sourceReference: undefined },
  }));
});

test("unknown-field evidence excludes raw provider values by default", () => {
  const evidence = {
    fieldPath: "legacyField",
    providerType: "string",
    presence: "PRESENT",
    sourceSurface: "DIRECT_LEVEL_LESSON",
    sourceReference: { collectionPath: "levels/A1/lessons/A1_2", entityKind: "level_lesson", recordId: "A1_2" },
    migrationRelevance: "UNKNOWN",
  } as const;
  assert.equal(validateLegacyUnknownFieldEvidence(evidence).migrationRelevance, "UNKNOWN");
  assert.throws(() => validateLegacyUnknownFieldEvidence({ ...evidence, rawValue: "secret" }));
});

test("A1_2 divergent mirror preserves both statuses and blocks target comparison", () => {
  const direct = inventory("DIRECT_LEVEL_LESSON", "A1_2", "draft");
  const nested = inventory("NESTED_MODULE_LESSON", "A1_2", "published");
  const result = resultBase(direct, nested, "DIVERGENT_MIRROR", "NO_WRITE_REVIEW_REQUIRED", true, ["STATUS_MISMATCH"]);
  const validated = validateLegacyLessonReconciliationResult(result);
  assert.equal(validated.classification, "DIVERGENT_MIRROR");
  assert.equal(validated.direct?.status.presence, "PRESENT");
  assert.equal(validated.nested?.status.presence, "PRESENT");
  assert.equal(validated.reviewState.reviewRequired, true);
  assert.equal(validated.targetComparisonEligible, false);
  assert.equal("proposedOperation" in validated, false);
});

test("A1_1 nested-only and direct-only states are represented without becoming executable", () => {
  const nestedOnly = resultBase(null, inventory("NESTED_MODULE_LESSON", "A1_1", "published"), "NESTED_ONLY", "ELIGIBLE_LOGICAL_CANDIDATE", false, ["NESTED_ONLY"]);
  const directOnly = resultBase(inventory("DIRECT_LEVEL_LESSON", "A1_9", "draft"), null, "DIRECT_ONLY", "QUARANTINE_REVIEW_REQUIRED", true, ["DIRECT_ONLY"]);
  assert.equal(validateLegacyLessonReconciliationResult(nestedOnly).targetComparisonEligible, true);
  assert.equal(validateLegacyLessonReconciliationResult(directOnly).targetComparisonEligible, false);
});

test("pairing contract permits one nullable record per source and represents malformed multiplicity", () => {
  const nested = inventory("NESTED_MODULE_LESSON", "A1_1", "published");
  const malformedCandidate = {
    logicalIdentity: { levelId: "A1", lessonId: "A1_1" },
    direct: null,
    nested,
    additionalDirectCandidates: [],
    additionalNestedCandidates: [nested],
  };
  assert.throws(() => validateLegacyLessonReconciliationCandidate(malformedCandidate));
  const unresolved = {
    resultId: deriveLegacyLessonResultId({
      logicalIdentity: { levelId: "A1", lessonId: "A1_1" },
      directPath: null,
      nestedPath: null,
    }),
    policyVersion: LESSON_RECONCILIATION_POLICY_VERSION,
    logicalIdentity: { levelId: "A1", lessonId: "A1_1" },
    direct: null,
    nested: null,
    classification: "UNRESOLVED" as const,
    fieldConflicts: [],
    reasonCodes: ["MULTIPLE_SOURCE_CANDIDATES" as const],
    sourceOutcome: "BLOCKED" as const,
    reviewState: {
      reviewRequired: true,
      reviewReasons: ["MULTIPLE_SOURCE_CANDIDATES" as const],
      conflictFields: [],
      policyDecisionRequired: true,
      resolutionStatus: "BLOCKED" as const,
    },
    targetComparisonEligible: false,
  };
  assert.equal(validateLegacyLessonReconciliationResult(unresolved).sourceOutcome, "BLOCKED");
});

test("classification and source outcome compatibility is closed and target NO_OP remains separate", () => {
  assert.equal(expectedLessonSourceOutcome("EXACT_MIRROR"), "DEDUPLICATED_LOGICAL_CANDIDATE");
  assert.equal(expectedLessonSourceOutcome("DIVERGENT_MIRROR"), "NO_WRITE_REVIEW_REQUIRED");
  assert.equal(expectedLessonSourceOutcome("NESTED_ONLY"), "ELIGIBLE_LOGICAL_CANDIDATE");
  const exact = resultBase(
    inventory("DIRECT_LEVEL_LESSON", "A1_2", "published"),
    inventory("NESTED_MODULE_LESSON", "A1_2", "published"),
    "EXACT_MIRROR",
    "DEDUPLICATED_LOGICAL_CANDIDATE",
    false,
    ["EXACT_MIRROR"],
  );
  const validated = validateLegacyLessonReconciliationResult(exact);
  assert.equal(validated.sourceOutcome, "DEDUPLICATED_LOGICAL_CANDIDATE");
  assert.equal(validated.targetComparisonEligible, true);
  assert.equal("proposedOperation" in validated, false);
});

test("invalid contract states fail closed", () => {
  const direct = inventory("DIRECT_LEVEL_LESSON", "A1_2", "draft");
  const nested = inventory("NESTED_MODULE_LESSON", "A1_2", "published");
  const valid = resultBase(direct, nested, "DIVERGENT_MIRROR", "NO_WRITE_REVIEW_REQUIRED", true, ["STATUS_MISMATCH"]);
  const invalid: unknown[] = [
    { ...valid, classification: "EXACT_MIRROR", sourceOutcome: "DEDUPLICATED_LOGICAL_CANDIDATE", nested: null },
    { ...valid, classification: "DIVERGENT_MIRROR", fieldConflicts: [], reasonCodes: ["STATUS_MISMATCH"] },
    { ...valid, classification: "DIRECT_ONLY", sourceOutcome: "QUARANTINE_REVIEW_REQUIRED", nested, reasonCodes: ["DIRECT_ONLY"], reviewState: { ...valid.reviewState, reviewReasons: ["DIRECT_ONLY"] } },
    { ...valid, classification: "NESTED_ONLY", sourceOutcome: "ELIGIBLE_LOGICAL_CANDIDATE", direct, reasonCodes: ["NESTED_ONLY"], reviewState: { reviewRequired: false, reviewReasons: [], conflictFields: [], policyDecisionRequired: false, resolutionStatus: "NOT_REQUIRED" }, targetComparisonEligible: true },
    { ...valid, classification: "MODULE_LINK_CONFLICT", sourceOutcome: "QUARANTINE_REVIEW_REQUIRED", reasonCodes: ["STATUS_MISMATCH"] },
    { ...valid, targetComparisonEligible: true },
    { ...valid, targetComparisonEligible: false, proposedOperation: "NO_OP" },
    { ...valid, policyVersion: "wrong-version" },
    { ...valid, classification: "UNKNOWN" },
    { ...valid, logicalIdentity: { levelId: "A2", lessonId: "A1_2" } },
  ];
  for (const state of invalid) assert.throws(() => validateLegacyLessonReconciliationResult(state));
  assert.equal(invalid.length, 10);
});

test("unknown reason codes and explicit target eligibility are validated at runtime", () => {
  const direct = inventory("DIRECT_LEVEL_LESSON", "A1_2", "draft");
  const nested = inventory("NESTED_MODULE_LESSON", "A1_2", "published");
  const valid = resultBase(direct, nested, "DIVERGENT_MIRROR", "NO_WRITE_REVIEW_REQUIRED", true, ["STATUS_MISMATCH"]);
  const { targetComparisonEligible: _omitted, ...missingEligibility } = valid;
  assert.throws(() => validateLegacyLessonReconciliationResult(missingEligibility));
  assert.throws(() => validateLegacyLessonReconciliationResult({ ...valid, targetComparisonEligible: "false" }));
  assert.throws(() => validateLegacyLessonReconciliationResult({ ...valid, reasonCodes: ["UNSUPPORTED_REASON"] }));
  assert.throws(() => validateLegacyLessonReconciliationResult({
    ...valid,
    reviewState: { ...valid.reviewState, reviewReasons: ["UNSUPPORTED_REASON"] },
  }));
  assert.equal(validateLegacyLessonReconciliationResult({ ...valid, targetComparisonEligible: false }).targetComparisonEligible, false);
});

test("field evidence rejects runtime values outside the declared scalar domain", () => {
  const direct = inventory("DIRECT_LEVEL_LESSON", "A1_2", "draft");
  const nested = inventory("NESTED_MODULE_LESSON", "A1_2", "published");
  const valid = resultBase(direct, nested, "DIVERGENT_MIRROR", "NO_WRITE_REVIEW_REQUIRED", true, ["STATUS_MISMATCH"]);
  assert.throws(() => validateLegacyLessonInventoryRecord({
    ...direct,
    title: { presence: "PRESENT", value: { arbitrary: true } },
  }));
  assert.throws(() => validateLegacyLessonInventoryRecord({
    ...direct,
    orderInModule: { presence: "PRESENT", value: "2" },
  }));
  assert.throws(() => validateLegacyLessonReconciliationResult({
    ...valid,
    fieldConflicts: [{
      ...valid.fieldConflicts[0],
      directEvidence: { representation: "VALUE", value: [] },
    }],
  }));
});

test("source path, reference, provenance, and module linkage coherence fail closed", () => {
  const direct = inventory("DIRECT_LEVEL_LESSON", "A1_2", "draft");
  assert.throws(() => validateLegacyLessonInventoryRecord({ ...direct, sourcePath: "levels/A1/lessons/other" }));
  assert.throws(() => validateLegacyLessonInventoryRecord({
    ...direct,
    sourceReference: { ...direct.sourceReference, collectionPath: "levels/A1/lessons/other" },
  }));
  assert.throws(() => validateLegacyLessonInventoryRecord({
    ...direct,
    provenance: { ...direct.provenance, levelId: "A2" },
  }));
  assert.throws(() => validateLegacyLessonInventoryRecord({
    ...direct,
    provenance: { ...direct.provenance, sourceReference: { ...direct.provenance.sourceReference, entityKind: "other" } },
  }));
  assert.throws(() => validateLegacyLessonInventoryRecord({
    ...direct,
    provenance: { ...direct.provenance, moduleId: "A1_M02_pruebaa1" },
  }));
});
