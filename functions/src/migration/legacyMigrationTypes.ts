import { MEMBERSHIP_ROLES } from "@mipymetic/saas-contracts/domain";

export const MIGRATION_CONTRACT_VERSION = "phase05-legacy-mapping-dry-run-v1" as const;
export const APPROVED_LEGACY_TENANT_ID = "7c2f5a4e-91d8-4b73-a6c1-2f4e8d9b3a57" as const;

export const CANDIDATE_TYPES = Object.freeze([
  "organization_institution_mapping",
  "identity_migration",
  "membership_role_migration",
  "course_mapping",
  "enrollment_bootstrap",
] as const);
export type CandidateType = (typeof CANDIDATE_TYPES)[number];

export const CLASSIFICATIONS = Object.freeze([
  "ELIGIBLE_CREATE",
  "NO_OP_IDEMPOTENT",
  "QUARANTINE",
  "HUMAN_REVIEW_REQUIRED",
  "UNSUPPORTED_SOURCE",
  "SOURCE_DISCOVERY_REQUIRED",
] as const);
export type CandidateClassification = (typeof CLASSIFICATIONS)[number];

export const QUARANTINE_REASON_CODES = Object.freeze([
  "MISSING_ORGANIZATION_INSTITUTION_MAPPING",
  "CONFLICTING_ORGANIZATION_INSTITUTION_MAPPING",
  "UNKNOWN_LEGACY_ROLE",
  "INSUFFICIENT_ADMIN_TENANT_SCOPE",
  "INSUFFICIENT_USER_ROLE_EVIDENCE",
  "AMBIGUOUS_ENROLLMENT_EVIDENCE",
  "CONFLICTING_TARGET_STATE",
  "TARGET_COMPARISON_IMPOSSIBLE",
  "UNSUPPORTED_LEGACY_SOURCE_STATE",
  "MISSING_MANDATORY_SOURCE_IDENTITY",
  "MALFORMED_SOURCE_DATA",
  "SOURCE_FIELD_NOT_DISCOVERED",
] as const);
export type QuarantineReasonCode = (typeof QUARANTINE_REASON_CODES)[number];

export const TARGET_COMPARISONS = Object.freeze([
  "TARGET_ABSENT",
  "SEMANTIC_MATCH",
  "CONFLICT",
  "UNCOMPARABLE",
] as const);
export type TargetComparison = (typeof TARGET_COMPARISONS)[number];

export const PROPOSED_OPERATIONS = Object.freeze(["CREATE", "NO_OP", "NO_WRITE"] as const);
export type ProposedOperation = (typeof PROPOSED_OPERATIONS)[number];

export const TARGET_ENTITY_TYPES = Object.freeze([
  "tenant",
  "identity",
  "membership",
  "course",
  "enrollment",
] as const);
export type TargetEntityType = (typeof TARGET_ENTITY_TYPES)[number];

export const MIGRATION_ERROR_CATEGORIES = Object.freeze([
  "REQUEST_INVALID",
  "SOURCE_DISCOVERY_REQUIRED",
  "SOURCE_READ_FAILURE",
  "MALFORMED_SOURCE_DATA",
  "MAPPING_TABLE_INVALID",
  "TARGET_READ_FAILURE",
  "INTERNAL_INVARIANT_FAILURE",
] as const);
export type MigrationErrorCategory = (typeof MIGRATION_ERROR_CATEGORIES)[number];
export type MigrationFailureScope = "WHOLE_RUN" | "CANDIDATE";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type StableSourceReference = Readonly<{
  collectionPath: string | null;
  entityKind: string;
  recordId: string;
}>;

export type TargetReference = Readonly<{
  tenantId: string;
  entityType: TargetEntityType;
  targetId: string | null;
  targetReference: string | null;
}>;

export type MigrationCandidateIdentity = Readonly<{
  migrationContractVersion: string;
  candidateType: CandidateType;
  legacyTenantId: string;
  stableSourceReference: string;
  targetEntityType: string;
  targetId: string | null;
}>;

export type MigrationCandidateDeterministicFields = Readonly<{
  candidateId: string;
  idempotencyKey: string;
  sortKey: string;
}>;

export type ApprovedMappingRow = Readonly<{
  mappingTableId: string;
  mappingTableVersion: string;
  mappingId: string;
  legacySourceKind: "organization" | "institution";
  legacyOrganizationId: string | null;
  legacyInstitutionId: string | null;
  targetTenantId: string;
  mappingStatus: "approved" | "quarantined" | "superseded";
  provenanceCode: "PRODUCT_OWNER_APPROVED_MAPPING";
  approvalEvidenceCode: string;
  reviewReference: string | null;
  effectiveLogicalTime: string | null;
  schemaVersion: string;
}>;

export type MappingTableInput = Readonly<{
  mappingTableId: string;
  mappingTableVersion: string;
  approvedRows: readonly ApprovedMappingRow[];
}>;

export type OrganizationInstitutionSourceEvidence = Readonly<{
  organizationId: string | null;
  institutionId: string | null;
}>;

export type MappingEvidence = Readonly<{
  targetTenantId: string | null;
  mappingId: string | null;
  matched: boolean;
  conflict: boolean;
  reasonCodes: readonly QuarantineReasonCode[];
  humanReviewRequired: boolean;
}>;

export type LegacyRoleEvidence = Readonly<{
  legacyRole: string | null;
  validIdentity: boolean;
  tenantScopeProven: boolean;
  supportingCourseEvidence: boolean;
}>;

export type RoleMappingEvidence = Readonly<{
  mappedRole: string | null;
  reasonCodes: readonly QuarantineReasonCode[];
  humanReviewRequired: boolean;
  eligible: boolean;
}>;

export type EnrollmentIdentityEvidence = Readonly<{
  stable: boolean;
  uid: string | null;
}>;

export type EnrollmentTenantEvidence = Readonly<{
  approved: boolean;
  tenantId: string | null;
}>;

export type EnrollmentMembershipEvidence = Readonly<{
  valid: boolean;
  membershipId: string | null;
  tenantId: string | null;
}>;

export type EnrollmentCourseEvidence = Readonly<{
  valid: boolean;
  courseId: string | null;
  tenantId: string | null;
}>;

export type EnrollmentRelationshipEvidence = Readonly<{
  explicit: boolean;
  ambiguous: boolean;
}>;

export type EnrollmentEvidenceEvaluation = Readonly<{
  eligible: boolean;
  reasonCodes: readonly QuarantineReasonCode[];
  humanReviewRequired: boolean;
}>;

export type CanonicalTargetProjection = Readonly<{
  exists: boolean;
  comparable: boolean;
  entityType: string;
  targetId: string;
  tenantId: string;
  semanticFields: Readonly<Record<string, JsonValue>>;
}>;

export type CandidateEvidence = Readonly<{
  eligible: boolean;
  humanReviewRequired: boolean;
  reasonCodes: readonly QuarantineReasonCode[];
}>;

export type CandidateClassificationResult = Readonly<{
  classification: CandidateClassification;
  reasonCodes: readonly QuarantineReasonCode[];
  humanReviewRequired: boolean;
  proposedOperation: ProposedOperation;
}>;

export type MigrationCandidateResult = Readonly<{
  candidateType: CandidateType;
  classification: CandidateClassification;
  reasonCodes: readonly QuarantineReasonCode[];
  humanReviewRequired: boolean;
  proposedOperation: ProposedOperation;
  candidateId: string;
  idempotencyKey: string;
  sortKey: string;
}>;

export type MigrationCandidateAuditProjection = Readonly<{
  runId: string;
  candidateId: string;
  sourceReference: StableSourceReference;
  targetReference: TargetReference;
  legacyTenantId: string;
  mappingTableVersion: string;
  migrationContractVersion: string;
  classification: CandidateClassification;
  reasonCodes: readonly QuarantineReasonCode[];
  proposedOperation: ProposedOperation;
  humanReviewRequired: boolean;
  logicalTime: string;
}>;

export type MigrationReportCounts = Readonly<{
  totalCandidates: number;
  eligibleCreate: number;
  noOpIdempotent: number;
  quarantined: number;
  humanReviewRequired: number;
  unsupportedSource: number;
  sourceDiscoveryRequired: number;
}>;

export type MigrationDryRunReport = Readonly<{
  runId: string;
  legacyTenantId: typeof APPROVED_LEGACY_TENANT_ID;
  mappingTableVersion: string;
  migrationContractVersion: typeof MIGRATION_CONTRACT_VERSION;
  counts: MigrationReportCounts;
  countsByCandidateType: Readonly<Record<CandidateType, number>>;
  countsByReasonCode: Readonly<Record<QuarantineReasonCode, number>>;
  startedLogicalTime: string | null;
  completedLogicalTime: string | null;
  writesOccurred: false;
  executionAuthorized: false;
}>;

export type CanonicalMembershipRole = typeof MEMBERSHIP_ROLES.STUDENT | typeof MEMBERSHIP_ROLES.TENANT_ADMIN;

export type LegacyMigrationPathTemplateAnalysis = Readonly<{
  template: string;
  pathSegments: readonly string[];
  bindings: readonly string[];
}>;

export type LegacyMigrationSourceProvenanceInput = Readonly<{
  logicalSourceId: string;
  collectionPathTemplate: string;
  entityKind: string;
  schemaVariant: string;
  discoveryStrategyVersion: string;
  organizationId?: string | null;
  institutionId?: string | null;
  stableSourceIdentity?: string | null;
}>;

export type LegacyMigrationSourceProvenance = Readonly<{
  logicalSourceId: string;
  collectionPath: string | null;
  legacyDocumentId: string;
  sourceKind: string;
  schemaVariant: string;
  discoveryStrategyVersion: string;
  sourceReference: StableSourceReference;
  organizationId?: string | null;
  institutionId?: string | null;
  roleReference?: string | null;
  identityReference?: string | null;
  evidenceReferences?: readonly string[];
}>;

export type LegacyMigrationSourceProviderBindingContext = Readonly<{
  logicalSourceId: string;
  sourceKind: string;
  selectedProjectId: string;
  collectionPathTemplate: string;
  schemaVariant: string;
  discoveryStrategyVersion: string;
  scopeDiscriminators: Readonly<{
    organizationId: string | null;
    institutionId: string | null;
    stableSourceIdentity: string | null;
  }>;
  pathTemplate: LegacyMigrationPathTemplateAnalysis;
  provenanceInput: LegacyMigrationSourceProvenanceInput;
  resolvedPathBindings: Readonly<Record<string, string>>;
}> & (
  | Readonly<{
    providerSurface: "AUTH";
    selectedDatabaseId?: never;
  }>
  | Readonly<{
    providerSurface: "FIRESTORE";
    selectedDatabaseId: string;
  }>
);

export type LegacyEnrollmentSourceEvidence = Readonly<{
  identity: EnrollmentIdentityEvidence;
  tenant: EnrollmentTenantEvidence;
  membership: EnrollmentMembershipEvidence;
  course: EnrollmentCourseEvidence;
  relationship: EnrollmentRelationshipEvidence;
}>;

export type LegacyMigrationSourceRecord = Readonly<{
  candidateType: CandidateType;
  sourceReference: StableSourceReference;
  targetReference: TargetReference;
  expectedTargetProjection: CanonicalTargetProjection;
  provenance: LegacyMigrationSourceProvenance;
  providerBinding: LegacyMigrationSourceProviderBindingContext;
  organizationInstitutionEvidence?: Readonly<{
    organizationId: string | null;
    institutionId: string | null;
  }>;
  roleEvidence?: LegacyRoleEvidence;
  enrollmentEvidence?: LegacyEnrollmentSourceEvidence;
  reasonCodes?: readonly QuarantineReasonCode[];
  sourceDiscoveryRequired?: boolean;
}>;

export type LegacyMigrationSourceReadResult = Readonly<{
  kind: "records";
  records: readonly LegacyMigrationSourceRecord[];
}> | Readonly<{
  kind: "source_discovery_required";
}>;
