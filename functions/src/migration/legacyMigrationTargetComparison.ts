import { canonicalJsonStringify } from "@mipymetic/saas-contracts/validation";
import { type CanonicalTargetProjection, type TargetComparison } from "./legacyMigrationTypes.js";

export const compareCanonicalTarget = (
  expectedProjection: CanonicalTargetProjection,
  actualProjection: CanonicalTargetProjection,
): TargetComparison => {
  if (!actualProjection.exists) return "TARGET_ABSENT";
  if (!expectedProjection.exists || !expectedProjection.comparable || !actualProjection.comparable) {
    return "UNCOMPARABLE";
  }
  if (
    expectedProjection.entityType !== actualProjection.entityType
    || expectedProjection.targetId !== actualProjection.targetId
    || expectedProjection.tenantId !== actualProjection.tenantId
  ) return "CONFLICT";
  return canonicalJsonStringify(expectedProjection.semanticFields) === canonicalJsonStringify(actualProjection.semanticFields)
    ? "SEMANTIC_MATCH"
    : "CONFLICT";
};
