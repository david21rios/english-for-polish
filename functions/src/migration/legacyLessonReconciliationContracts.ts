import { canonicalJsonStringify, validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import {
  type LegacyMigrationSourceProvenance,
  type ProposedOperation,
  type StableSourceReference,
  type TargetComparison,
} from "./legacyMigrationTypes.js";

export const LESSON_RECONCILIATION_POLICY_VERSION = "phase05-lesson-reconciliation-v1" as const;
export type LessonReconciliationPolicyVersion = typeof LESSON_RECONCILIATION_POLICY_VERSION;

export const LESSON_SOURCE_SURFACES = Object.freeze([
  "DIRECT_LEVEL_LESSON",
  "NESTED_MODULE_LESSON",
] as const);
export type LegacyLessonSourceSurface = (typeof LESSON_SOURCE_SURFACES)[number];

export const LESSON_FIELD_PRESENCE_STATES = Object.freeze([
  "PRESENT",
  "ABSENT",
  "UNAVAILABLE",
] as const);
export type LegacyLessonFieldPresenceState = (typeof LESSON_FIELD_PRESENCE_STATES)[number];

export const LESSON_RECONCILIATION_CLASSIFICATIONS = Object.freeze([
  "EXACT_MIRROR",
  "DIVERGENT_MIRROR",
  "DIRECT_ONLY",
  "NESTED_ONLY",
  "MODULE_LINK_CONFLICT",
  "IDENTITY_CONFLICT",
  "UNRESOLVED",
] as const);
export type LessonReconciliationClassification = (typeof LESSON_RECONCILIATION_CLASSIFICATIONS)[number];

export const LESSON_FIELD_COMPARISON_STATES = Object.freeze([
  "EQUAL",
  "ALIAS_EQUIVALENT",
  "MISMATCH",
  "UNAVAILABLE",
  "UNRESOLVED",
] as const);
export type LessonFieldComparisonState = (typeof LESSON_FIELD_COMPARISON_STATES)[number];

export const LESSON_FIELD_RESOLUTION_STATES = Object.freeze([
  "EQUIVALENT",
  "ALIAS_EQUIVALENT",
  "EXPLICIT_POLICY_RESOLUTION",
  "UNRESOLVED_CONFLICT",
  "HUMAN_DECISION_REQUIRED",
  "UNAVAILABLE",
] as const);
export type LessonFieldResolutionState = (typeof LESSON_FIELD_RESOLUTION_STATES)[number];

export const LESSON_SOURCE_RECONCILIATION_OUTCOMES = Object.freeze([
  "DEDUPLICATED_LOGICAL_CANDIDATE",
  "ELIGIBLE_LOGICAL_CANDIDATE",
  "NO_WRITE_REVIEW_REQUIRED",
  "QUARANTINE_REVIEW_REQUIRED",
  "BLOCKED",
] as const);
export type LessonSourceReconciliationOutcome = (typeof LESSON_SOURCE_RECONCILIATION_OUTCOMES)[number];

export const LESSON_RECONCILIATION_REASON_CODES = Object.freeze([
  "EXACT_MIRROR",
  "NORMALIZED_ALIAS_EQUALITY",
  "DIRECT_ONLY",
  "NESTED_ONLY",
  "STATUS_MISMATCH",
  "TITLE_MISMATCH",
  "ORDER_MISMATCH",
  "MODULE_MISMATCH",
  "IDENTITY_MISMATCH",
  "UNKNOWN_FIELD",
  "CONTENT_HASH_MISMATCH",
  "MULTIPLE_SOURCE_CANDIDATES",
  "INSUFFICIENT_EVIDENCE",
  "MISSING_MODULE_ID",
  "SOURCE_PATH_MISMATCH",
  "MALFORMED_SOURCE_DATA",
] as const);
export type LessonReconciliationReasonCode = (typeof LESSON_RECONCILIATION_REASON_CODES)[number];

export const LESSON_REVIEW_RESOLUTION_STATUSES = Object.freeze([
  "NOT_REQUIRED",
  "PENDING",
  "RESOLVED_BY_POLICY",
  "RESOLVED_BY_HUMAN",
  "BLOCKED",
] as const);
export type LessonReviewResolutionStatus = (typeof LESSON_REVIEW_RESOLUTION_STATUSES)[number];

export const LESSON_UNKNOWN_FIELD_RELEVANCE = Object.freeze([
  "RELEVANT",
  "NON_MIGRATION_RELEVANT",
  "UNKNOWN",
] as const);
export type LessonUnknownFieldRelevance = (typeof LESSON_UNKNOWN_FIELD_RELEVANCE)[number];

export type LegacyLessonFieldEvidence<T> = Readonly<
  | { presence: "PRESENT"; value: T }
  | { presence: "ABSENT" }
  | { presence: "UNAVAILABLE" }
>;

export type LegacyLessonLogicalIdentity = Readonly<{
  levelId: string;
  lessonId: string;
}>;

export type LegacyLessonSourceProvenance = LegacyMigrationSourceProvenance & Readonly<{
  sourceSurface: LegacyLessonSourceSurface;
  levelId: string;
  lessonId: string;
  moduleId: string | null;
  sourceStatus: string | null;
}>;

export type LegacyLessonContentHashEvidence = Readonly<{
  scopePath: string;
  algorithmId: string;
  algorithmVersion: string;
  normalizationSchemaVersion: string;
  digest: string;
  sourceReference: StableSourceReference;
}>;

export type LegacyUnknownFieldEvidence = Readonly<{
  fieldPath: string;
  providerType: string;
  presence: LegacyLessonFieldPresenceState;
  sourceSurface: LegacyLessonSourceSurface;
  sourceReference: StableSourceReference;
  migrationRelevance: LessonUnknownFieldRelevance;
  deterministicHash?: LegacyLessonContentHashEvidence;
}>;

export type LegacyLessonInventoryRecord = Readonly<{
  sourceSurface: LegacyLessonSourceSurface;
  logicalIdentity: LegacyLessonLogicalIdentity;
  sourcePath: string;
  sourceReference: StableSourceReference;
  provenance: LegacyLessonSourceProvenance;
  moduleId: LegacyLessonFieldEvidence<string>;
  moduleTitle: LegacyLessonFieldEvidence<string>;
  title: LegacyLessonFieldEvidence<string>;
  titulo: LegacyLessonFieldEvidence<string>;
  orderInModule: LegacyLessonFieldEvidence<number>;
  status: LegacyLessonFieldEvidence<string>;
  contentHashes: readonly LegacyLessonContentHashEvidence[];
  unknownFields: readonly LegacyUnknownFieldEvidence[];
}>;

export type LegacyLessonReconciliationCandidate = Readonly<{
  logicalIdentity: LegacyLessonLogicalIdentity;
  direct: LegacyLessonInventoryRecord | null;
  nested: LegacyLessonInventoryRecord | null;
  additionalDirectCandidates: readonly LegacyLessonInventoryRecord[];
  additionalNestedCandidates: readonly LegacyLessonInventoryRecord[];
}>;

export type LegacyLessonComparableEvidence = Readonly<
  | { representation: "VALUE"; value: string | number | boolean | null }
  | { representation: "HASH"; hash: LegacyLessonContentHashEvidence }
  | { representation: "ABSENT" }
  | { representation: "UNAVAILABLE" }
>;

export type LegacyLessonFieldConflict = Readonly<{
  fieldPath: string;
  directEvidence: LegacyLessonComparableEvidence;
  nestedEvidence: LegacyLessonComparableEvidence;
  comparisonState: LessonFieldComparisonState;
  resolutionState: LessonFieldResolutionState;
  reasonCode: LessonReconciliationReasonCode;
  reviewRequired: boolean;
}>;

export type LegacyLessonReviewState = Readonly<{
  reviewRequired: boolean;
  reviewReasons: readonly LessonReconciliationReasonCode[];
  conflictFields: readonly string[];
  policyDecisionRequired: boolean;
  resolutionStatus: LessonReviewResolutionStatus;
}>;

export type LegacyLessonReconciliationResult = Readonly<{
  resultId: string;
  policyVersion: LessonReconciliationPolicyVersion;
  logicalIdentity: LegacyLessonLogicalIdentity;
  direct: LegacyLessonInventoryRecord | null;
  nested: LegacyLessonInventoryRecord | null;
  classification: LessonReconciliationClassification;
  fieldConflicts: readonly LegacyLessonFieldConflict[];
  reasonCodes: readonly LessonReconciliationReasonCode[];
  sourceOutcome: LessonSourceReconciliationOutcome;
  reviewState: LegacyLessonReviewState;
  targetComparisonEligible: boolean;
  targetComparison?: TargetComparison;
  proposedOperation?: ProposedOperation;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!isRecord(value)) throw new TypeError(`${label} must be an object.`);
  return value;
};

const requireText = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    throw new TypeError(`${field} must be a non-empty trimmed string.`);
  }
  return value;
};

const requireIdentifier = (value: unknown, field: string): string => {
  const text = requireText(value, field);
  const result = validateDocumentIdentifier(text, field);
  if (!result.ok) throw new TypeError(`${field} must be a valid document identifier.`);
  return result.value;
};

const isOneOf = <T extends readonly string[]>(values: T, value: unknown): value is T[number] =>
  typeof value === "string" && (values as readonly string[]).includes(value);

const requireOneOf = <T extends readonly string[]>(values: T, value: unknown, field: string): T[number] => {
  if (!isOneOf(values, value)) throw new TypeError(`${field} is not a supported value.`);
  return value;
};

const validateSourceReference = (value: unknown, field: string): StableSourceReference => {
  const record = requireRecord(value, field);
  const collectionPath = record.collectionPath;
  if (collectionPath !== null && typeof collectionPath !== "string") {
    throw new TypeError(`${field}.collectionPath must be a string or null.`);
  }
  return Object.freeze({
    collectionPath,
    entityKind: requireText(record.entityKind, `${field}.entityKind`),
    recordId: requireIdentifier(record.recordId, `${field}.recordId`),
  });
};

const sourceReferencesEqual = (left: StableSourceReference, right: StableSourceReference): boolean =>
  left.collectionPath === right.collectionPath &&
  left.entityKind === right.entityKind &&
  left.recordId === right.recordId;

export const isLegacyLessonSourceSurface = (value: unknown): value is LegacyLessonSourceSurface =>
  isOneOf(LESSON_SOURCE_SURFACES, value);

export const isLessonReconciliationClassification = (
  value: unknown,
): value is LessonReconciliationClassification => isOneOf(LESSON_RECONCILIATION_CLASSIFICATIONS, value);

export const isLessonReconciliationReasonCode = (
  value: unknown,
): value is LessonReconciliationReasonCode => isOneOf(LESSON_RECONCILIATION_REASON_CODES, value);

export const createLegacyLessonLogicalIdentity = (value: unknown): LegacyLessonLogicalIdentity => {
  const record = requireRecord(value, "logical identity");
  const identity = Object.freeze({
    levelId: requireIdentifier(record.levelId, "logical identity.levelId"),
    lessonId: requireIdentifier(record.lessonId, "logical identity.lessonId"),
  });
  return identity;
};

export const deriveLegacyLessonLogicalKey = (identity: LegacyLessonLogicalIdentity): string =>
  canonicalJsonStringify(createLegacyLessonLogicalIdentity(identity));

export const deriveLegacyLessonResultId = (input: Readonly<{
  logicalIdentity: LegacyLessonLogicalIdentity;
  directPath: string | null;
  nestedPath: string | null;
}>): string => canonicalJsonStringify({
  policyVersion: LESSON_RECONCILIATION_POLICY_VERSION,
  logicalKey: deriveLegacyLessonLogicalKey(input.logicalIdentity),
  directPath: input.directPath,
  nestedPath: input.nestedPath,
});

const isStringFieldValue = (value: unknown): value is string => typeof value === "string";

const isFiniteNumberFieldValue = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const validateFieldEvidence = <T>(
  value: unknown,
  field: string,
  isPresentValue: (candidate: unknown) => candidate is T,
): LegacyLessonFieldEvidence<T> => {
  const record = requireRecord(value, field);
  const presence = requireOneOf(LESSON_FIELD_PRESENCE_STATES, record.presence, `${field}.presence`);
  if (presence === "PRESENT") {
    if (!("value" in record)) throw new TypeError(`${field}.value is required when presence is PRESENT.`);
    if (!isPresentValue(record.value)) throw new TypeError(`${field}.value has an invalid runtime type.`);
    return Object.freeze({ presence, value: record.value });
  }
  if ("value" in record) throw new TypeError(`${field}.value is forbidden unless presence is PRESENT.`);
  return Object.freeze({ presence });
};

export const validateLegacyLessonSourceProvenance = (
  value: unknown,
): LegacyLessonSourceProvenance => {
  const record = requireRecord(value, "lesson provenance");
  const sourceSurface = requireOneOf(LESSON_SOURCE_SURFACES, record.sourceSurface, "sourceSurface");
  const levelId = requireIdentifier(record.levelId, "provenance.levelId");
  const lessonId = requireIdentifier(record.lessonId, "provenance.lessonId");
  const sourceReference = validateSourceReference(record.sourceReference, "provenance.sourceReference");
  if (sourceReference.recordId !== lessonId) throw new TypeError("provenance source record ID must match lessonId.");
  const collectionPath = record.collectionPath;
  if (collectionPath !== null && typeof collectionPath !== "string") throw new TypeError("provenance.collectionPath must be a string or null.");
  if (collectionPath !== null && sourceReference.collectionPath !== collectionPath) {
    throw new TypeError("provenance collectionPath must match provenance.sourceReference.collectionPath.");
  }
  return Object.freeze({
    logicalSourceId: requireText(record.logicalSourceId, "provenance.logicalSourceId"),
    collectionPath,
    legacyDocumentId: requireIdentifier(record.legacyDocumentId, "provenance.legacyDocumentId"),
    sourceKind: requireText(record.sourceKind, "provenance.sourceKind"),
    schemaVariant: requireText(record.schemaVariant, "provenance.schemaVariant"),
    discoveryStrategyVersion: requireText(record.discoveryStrategyVersion, "provenance.discoveryStrategyVersion"),
    sourceReference,
    sourceSurface,
    levelId,
    lessonId,
    moduleId: record.moduleId === null ? null : requireIdentifier(record.moduleId, "provenance.moduleId"),
    sourceStatus: record.sourceStatus === null ? null : requireText(record.sourceStatus, "provenance.sourceStatus"),
  });
};

export const validateLegacyLessonContentHashEvidence = (
  value: unknown,
): LegacyLessonContentHashEvidence => {
  const record = requireRecord(value, "content hash evidence");
  return Object.freeze({
    scopePath: requireText(record.scopePath, "content hash scopePath"),
    algorithmId: requireText(record.algorithmId, "content hash algorithmId"),
    algorithmVersion: requireText(record.algorithmVersion, "content hash algorithmVersion"),
    normalizationSchemaVersion: requireText(record.normalizationSchemaVersion, "content hash normalizationSchemaVersion"),
    digest: requireText(record.digest, "content hash digest"),
    sourceReference: validateSourceReference(record.sourceReference, "content hash sourceReference"),
  });
};

export const validateLegacyUnknownFieldEvidence = (value: unknown): LegacyUnknownFieldEvidence => {
  const record = requireRecord(value, "unknown field evidence");
  if ("rawValue" in record) throw new TypeError("unknown field evidence must not contain rawValue.");
  const evidence: LegacyUnknownFieldEvidence = {
    fieldPath: requireText(record.fieldPath, "unknown field fieldPath"),
    providerType: requireText(record.providerType, "unknown field providerType"),
    presence: requireOneOf(LESSON_FIELD_PRESENCE_STATES, record.presence, "unknown field presence"),
    sourceSurface: requireOneOf(LESSON_SOURCE_SURFACES, record.sourceSurface, "unknown field sourceSurface"),
    sourceReference: validateSourceReference(record.sourceReference, "unknown field sourceReference"),
    migrationRelevance: requireOneOf(LESSON_UNKNOWN_FIELD_RELEVANCE, record.migrationRelevance, "unknown field migrationRelevance"),
  };
  if (record.deterministicHash !== undefined) {
    return Object.freeze({ ...evidence, deterministicHash: validateLegacyLessonContentHashEvidence(record.deterministicHash) });
  }
  return Object.freeze(evidence);
};

export const validateLegacyLessonInventoryRecord = (value: unknown): LegacyLessonInventoryRecord => {
  const record = requireRecord(value, "lesson inventory record");
  const logicalIdentity = createLegacyLessonLogicalIdentity(record.logicalIdentity);
  const sourceSurface = requireOneOf(LESSON_SOURCE_SURFACES, record.sourceSurface, "inventory sourceSurface");
  const sourcePath = requireText(record.sourcePath, "inventory sourcePath");
  const sourceReference = validateSourceReference(record.sourceReference, "inventory sourceReference");
  const provenance = validateLegacyLessonSourceProvenance(record.provenance);
  if (sourceReference.recordId !== logicalIdentity.lessonId) throw new TypeError("inventory source record ID must match lessonId.");
  if (sourceReference.collectionPath !== sourcePath) throw new TypeError("inventory sourcePath must match sourceReference.collectionPath.");
  if (provenance.sourceSurface !== sourceSurface || provenance.levelId !== logicalIdentity.levelId || provenance.lessonId !== logicalIdentity.lessonId) {
    throw new TypeError("inventory provenance does not match the inventory identity.");
  }
  if (!sourceReferencesEqual(sourceReference, provenance.sourceReference)) {
    throw new TypeError("inventory sourceReference must match provenance.sourceReference.");
  }
  if (provenance.collectionPath !== null && provenance.collectionPath !== sourcePath) {
    throw new TypeError("inventory sourcePath must match provenance.collectionPath.");
  }
  if (!Array.isArray(record.contentHashes) || !Array.isArray(record.unknownFields)) {
    throw new TypeError("inventory contentHashes and unknownFields must be arrays.");
  }
  const moduleId = validateFieldEvidence(record.moduleId, "inventory.moduleId", isStringFieldValue);
  const moduleTitle = validateFieldEvidence(record.moduleTitle, "inventory.moduleTitle", isStringFieldValue);
  const title = validateFieldEvidence(record.title, "inventory.title", isStringFieldValue);
  const titulo = validateFieldEvidence(record.titulo, "inventory.titulo", isStringFieldValue);
  const orderInModule = validateFieldEvidence(record.orderInModule, "inventory.orderInModule", isFiniteNumberFieldValue);
  const status = validateFieldEvidence(record.status, "inventory.status", isStringFieldValue);
  if (provenance.moduleId === null) {
    if (moduleId.presence === "PRESENT") throw new TypeError("inventory.moduleId contradicts absent provenance.moduleId.");
  } else if (moduleId.presence !== "PRESENT" || moduleId.value !== provenance.moduleId) {
    throw new TypeError("inventory.moduleId must match provenance.moduleId when module linkage is present.");
  }
  return Object.freeze({
    sourceSurface,
    logicalIdentity,
    sourcePath,
    sourceReference,
    provenance,
    moduleId,
    moduleTitle,
    title,
    titulo,
    orderInModule,
    status,
    contentHashes: Object.freeze(record.contentHashes.map((item, index) => validateLegacyLessonContentHashEvidence(item ?? `contentHashes[${index}]`))),
    unknownFields: Object.freeze(record.unknownFields.map((item, index) => validateLegacyUnknownFieldEvidence(item ?? `unknownFields[${index}]`))),
  });
};

const validateComparableEvidence = (value: unknown, field: string): LegacyLessonComparableEvidence => {
  const record = requireRecord(value, field);
  const representation = requireOneOf(["VALUE", "HASH", "ABSENT", "UNAVAILABLE"] as const, record.representation, `${field}.representation`);
  if (representation === "VALUE") {
    const candidate = record.value;
    if (!(candidate === null || typeof candidate === "string" || typeof candidate === "number" || typeof candidate === "boolean")) {
      throw new TypeError(`${field}.value must be a scalar or null.`);
    }
    return Object.freeze({ representation, value: candidate });
  }
  if (representation === "HASH") {
    return Object.freeze({ representation, hash: validateLegacyLessonContentHashEvidence(record.hash) });
  }
  if ("value" in record || "hash" in record) throw new TypeError(`${field} cannot carry evidence for ${representation}.`);
  return Object.freeze({ representation });
};

const validateFieldConflict = (value: unknown): LegacyLessonFieldConflict => {
  const record = requireRecord(value, "field conflict");
  const comparisonState = requireOneOf(LESSON_FIELD_COMPARISON_STATES, record.comparisonState, "field conflict comparisonState");
  const resolutionState = requireOneOf(LESSON_FIELD_RESOLUTION_STATES, record.resolutionState, "field conflict resolutionState");
  const reasonCode = requireOneOf(LESSON_RECONCILIATION_REASON_CODES, record.reasonCode, "field conflict reasonCode");
  if (typeof record.reviewRequired !== "boolean") throw new TypeError("field conflict reviewRequired must be boolean.");
  return Object.freeze({
    fieldPath: requireText(record.fieldPath, "field conflict fieldPath"),
    directEvidence: validateComparableEvidence(record.directEvidence, "field conflict directEvidence"),
    nestedEvidence: validateComparableEvidence(record.nestedEvidence, "field conflict nestedEvidence"),
    comparisonState,
    resolutionState,
    reasonCode,
    reviewRequired: record.reviewRequired,
  });
};

export const validateLegacyLessonReconciliationCandidate = (
  value: unknown,
): LegacyLessonReconciliationCandidate => {
  const record = requireRecord(value, "lesson reconciliation candidate");
  const logicalIdentity = createLegacyLessonLogicalIdentity(record.logicalIdentity);
  const direct = record.direct === null ? null : validateLegacyLessonInventoryRecord(record.direct);
  const nested = record.nested === null ? null : validateLegacyLessonInventoryRecord(record.nested);
  const additionalDirectCandidates = record.additionalDirectCandidates;
  const additionalNestedCandidates = record.additionalNestedCandidates;
  if (!Array.isArray(additionalDirectCandidates) || !Array.isArray(additionalNestedCandidates)) {
    throw new TypeError("additional lesson candidates must be arrays.");
  }
  const directExtras = Object.freeze(additionalDirectCandidates.map((item) => validateLegacyLessonInventoryRecord(item)));
  const nestedExtras = Object.freeze(additionalNestedCandidates.map((item) => validateLegacyLessonInventoryRecord(item)));
  if (directExtras.length > 0 || nestedExtras.length > 0) {
    throw new TypeError("MULTIPLE_SOURCE_CANDIDATES require UNRESOLVED/BLOCKED review state.");
  }
  if (direct === null && nested === null && directExtras.length === 0 && nestedExtras.length === 0) {
    throw new TypeError("lesson reconciliation candidate must contain at least one source record.");
  }
  for (const candidate of [direct, nested, ...directExtras, ...nestedExtras]) {
    if (candidate !== null && deriveLegacyLessonLogicalKey(candidate.logicalIdentity) !== deriveLegacyLessonLogicalKey(logicalIdentity)) {
      throw new TypeError("lesson candidate identity does not match the pairing identity.");
    }
  }
  return Object.freeze({ logicalIdentity, direct, nested, additionalDirectCandidates: directExtras, additionalNestedCandidates: nestedExtras });
};

const outcomeForClassification: Readonly<Record<LessonReconciliationClassification, LessonSourceReconciliationOutcome>> = Object.freeze({
  EXACT_MIRROR: "DEDUPLICATED_LOGICAL_CANDIDATE",
  DIVERGENT_MIRROR: "NO_WRITE_REVIEW_REQUIRED",
  DIRECT_ONLY: "QUARANTINE_REVIEW_REQUIRED",
  NESTED_ONLY: "ELIGIBLE_LOGICAL_CANDIDATE",
  MODULE_LINK_CONFLICT: "QUARANTINE_REVIEW_REQUIRED",
  IDENTITY_CONFLICT: "QUARANTINE_REVIEW_REQUIRED",
  UNRESOLVED: "BLOCKED",
});

export const expectedLessonSourceOutcome = (
  classification: LessonReconciliationClassification,
): LessonSourceReconciliationOutcome => outcomeForClassification[classification];

export const validateLessonClassificationOutcome = (
  classification: unknown,
  sourceOutcome: unknown,
): void => {
  const normalizedClassification = requireOneOf(LESSON_RECONCILIATION_CLASSIFICATIONS, classification, "classification");
  const normalizedOutcome = requireOneOf(LESSON_SOURCE_RECONCILIATION_OUTCOMES, sourceOutcome, "sourceOutcome");
  if (outcomeForClassification[normalizedClassification] !== normalizedOutcome) {
    throw new TypeError("classification and sourceOutcome are incompatible.");
  }
};

const validateReasonCodes = (value: unknown): readonly LessonReconciliationReasonCode[] => {
  if (!Array.isArray(value)) throw new TypeError("reasonCodes must be an array.");
  const codes = value.map((reason, index) => requireOneOf(LESSON_RECONCILIATION_REASON_CODES, reason, `reasonCodes[${index}]`));
  return Object.freeze([...new Set(codes)].sort());
};

const validateReviewState = (value: unknown): LegacyLessonReviewState => {
  const record = requireRecord(value, "reviewState");
  if (typeof record.reviewRequired !== "boolean" || typeof record.policyDecisionRequired !== "boolean") {
    throw new TypeError("reviewState booleans are invalid.");
  }
  if (!Array.isArray(record.reviewReasons) || !Array.isArray(record.conflictFields)) {
    throw new TypeError("reviewState arrays are invalid.");
  }
  const reviewReasons = validateReasonCodes(record.reviewReasons);
  const conflictFields = Object.freeze(record.conflictFields.map((field, index) => requireText(field, `reviewState.conflictFields[${index}]`)));
  const resolutionStatus = requireOneOf(LESSON_REVIEW_RESOLUTION_STATUSES, record.resolutionStatus, "reviewState.resolutionStatus");
  if (record.reviewRequired === false && resolutionStatus !== "NOT_REQUIRED") {
    throw new TypeError("non-review state must use NOT_REQUIRED.");
  }
  return Object.freeze({
    reviewRequired: record.reviewRequired,
    reviewReasons,
    conflictFields,
    policyDecisionRequired: record.policyDecisionRequired,
    resolutionStatus,
  });
};

export const validateLegacyLessonReconciliationResult = (
  value: unknown,
): LegacyLessonReconciliationResult => {
  const record = requireRecord(value, "lesson reconciliation result");
  if (record.policyVersion !== LESSON_RECONCILIATION_POLICY_VERSION) throw new TypeError("unsupported lesson reconciliation policy version.");
  if (!("targetComparisonEligible" in record) || typeof record.targetComparisonEligible !== "boolean") {
    throw new TypeError("targetComparisonEligible must be an explicit boolean.");
  }
  const logicalIdentity = createLegacyLessonLogicalIdentity(record.logicalIdentity);
  const direct = record.direct === null ? null : validateLegacyLessonInventoryRecord(record.direct);
  const nested = record.nested === null ? null : validateLegacyLessonInventoryRecord(record.nested);
  validateLessonClassificationOutcome(record.classification, record.sourceOutcome);
  const classification = record.classification as LessonReconciliationClassification;
  const sourceOutcome = record.sourceOutcome as LessonSourceReconciliationOutcome;
  const reasonCodes = validateReasonCodes(record.reasonCodes);
  const reviewState = validateReviewState(record.reviewState);
  if (!Array.isArray(record.fieldConflicts)) throw new TypeError("fieldConflicts must be an array.");
  const fieldConflicts = Object.freeze(record.fieldConflicts.map((item) => validateFieldConflict(item)));
  for (const candidate of [direct, nested]) {
    if (candidate !== null && deriveLegacyLessonLogicalKey(candidate.logicalIdentity) !== deriveLegacyLessonLogicalKey(logicalIdentity)) {
      throw new TypeError("result source identity does not match logical identity.");
    }
  }
  const expectedResultId = deriveLegacyLessonResultId({
    logicalIdentity,
    directPath: direct?.sourcePath ?? null,
    nestedPath: nested?.sourcePath ?? null,
  });
  if (record.resultId !== expectedResultId) throw new TypeError("resultId is not deterministic for the supplied sources.");
  if (classification === "EXACT_MIRROR" && (direct === null || nested === null)) throw new TypeError("exact mirror requires both sources.");
  if (classification === "DIRECT_ONLY" && (direct === null || nested !== null)) throw new TypeError("direct-only requires direct without nested.");
  if (classification === "NESTED_ONLY" && (nested === null || direct !== null)) throw new TypeError("nested-only requires nested without direct.");
  if (classification === "DIVERGENT_MIRROR" && (direct === null || nested === null || fieldConflicts.length === 0)) throw new TypeError("divergent mirror requires both sources and a conflict.");
  if (classification === "MODULE_LINK_CONFLICT" && !reasonCodes.includes("MODULE_MISMATCH")) throw new TypeError("module conflict requires MODULE_MISMATCH.");
  if (classification === "IDENTITY_CONFLICT" && !reasonCodes.includes("IDENTITY_MISMATCH")) throw new TypeError("identity conflict requires IDENTITY_MISMATCH.");
  if (classification === "UNRESOLVED" && !reviewState.reviewRequired) throw new TypeError("unresolved result requires review.");
  if (reviewState.reviewRequired && record.targetComparisonEligible === true) throw new TypeError("review-required result cannot be target-comparison eligible.");
  if (record.targetComparisonEligible === false && ("targetComparison" in record || "proposedOperation" in record)) throw new TypeError("blocked source result cannot carry target operation evidence.");
  if (["NO_WRITE_REVIEW_REQUIRED", "QUARANTINE_REVIEW_REQUIRED", "BLOCKED"].includes(sourceOutcome) && ("targetComparison" in record || "proposedOperation" in record)) {
    throw new TypeError("review-required source outcome cannot carry target operation evidence.");
  }
  return Object.freeze({
    resultId: requireText(record.resultId, "resultId"),
    policyVersion: LESSON_RECONCILIATION_POLICY_VERSION,
    logicalIdentity,
    direct,
    nested,
    classification,
    fieldConflicts,
    reasonCodes,
    sourceOutcome,
    reviewState,
    targetComparisonEligible: record.targetComparisonEligible,
    ...(record.targetComparison !== undefined ? { targetComparison: requireOneOf(["TARGET_ABSENT", "SEMANTIC_MATCH", "CONFLICT", "UNCOMPARABLE"] as const, record.targetComparison, "targetComparison") } : {}),
    ...(record.proposedOperation !== undefined ? { proposedOperation: requireOneOf(["CREATE", "NO_OP", "NO_WRITE"] as const, record.proposedOperation, "proposedOperation") } : {}),
  });
};
