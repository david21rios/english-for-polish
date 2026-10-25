import {
  type CanonicalTargetProjection,
  type CandidateType,
  type EnrollmentCourseEvidence,
  type EnrollmentIdentityEvidence,
  type EnrollmentMembershipEvidence,
  type EnrollmentRelationshipEvidence,
  type EnrollmentTenantEvidence,
  type LegacyRoleEvidence,
  type LegacyEnrollmentSourceEvidence,
  type LegacyMigrationPathTemplateAnalysis,
  type LegacyMigrationSourceProvenance,
  type LegacyMigrationSourceProvenanceInput,
  type LegacyMigrationSourceProviderBindingContext,
  type LegacyMigrationSourceReadResult,
  type LegacyMigrationSourceRecord,
  type QuarantineReasonCode,
  type StableSourceReference,
  type TargetReference,
} from "./legacyMigrationTypes.js";
import type {
  LessonCollectionReadRequest,
  LessonCollectionReadResult,
} from "./legacyLessonSourceDiscoveryContracts.js";

export type {
  LegacyEnrollmentSourceEvidence,
  LegacyMigrationPathTemplateAnalysis,
  LegacyMigrationSourceProvenance,
  LegacyMigrationSourceProvenanceInput,
  LegacyMigrationSourceProviderBindingContext,
  LegacyMigrationSourceReadResult,
  LegacyMigrationSourceRecord,
} from "./legacyMigrationTypes.js";

/**
 * Normalized evidence supplied by a source adapter.  A source adapter may
 * later translate a provider record into this shape, but provider SDK values
 * never cross this boundary.
 */
export interface LegacyMigrationSourceReadPort {
  readCandidates(): Promise<LegacyMigrationSourceReadResult>;
}

/**
 * Additive bounded-list boundary for source discovery.  The existing
 * point-read port remains intentionally zero-argument and unchanged.
 */
export interface LegacyMigrationCollectionReadPort {
  listDocuments(request: LessonCollectionReadRequest): Promise<LessonCollectionReadResult>;
}

export type {
  LessonCollectionReadRequest,
  LessonCollectionReadResult,
} from "./legacyLessonSourceDiscoveryContracts.js";

export type LegacyMigrationTargetReadResult = CanonicalTargetProjection;

export interface LegacyMigrationTargetReadPort {
  readTarget(candidate: LegacyMigrationSourceRecord): Promise<LegacyMigrationTargetReadResult>;
}
