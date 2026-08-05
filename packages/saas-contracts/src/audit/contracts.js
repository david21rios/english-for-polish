const frozen = (values) => Object.freeze(values);

export const AUDIT_SCHEMA_VERSION = 1;
export const AUDIT_LEVELS = Object.freeze({ BASIC: "basic", PRIVILEGED: "privileged", CRITICAL: "critical" });
export const AUDIT_RESULTS = Object.freeze({ SUCCEEDED: "succeeded", REJECTED: "rejected", FAILED: "failed", RECOVERY_REQUIRED: "recovery_required" });
export const AUDIT_EVENT_FIELDS = frozen(["auditId", "commandId", "correlationId", "actorUid", "actorType", "authority", "tenantId", "level", "operation", "resourceType", "resourceId", "result", "errorCode", "requestedAt", "executedAt", "beforeSummary", "afterSummary", "metadata", "schemaVersion"]);
export const AUDIT_EVENT_REQUIRED_FIELDS = AUDIT_EVENT_FIELDS;
export const AUDIT_BEFORE_AFTER_MAX_BYTES = 8192;
export const AUDIT_METADATA_MAX_BYTES = 4096;
