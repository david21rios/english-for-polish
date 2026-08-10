export const AUDIT_SCHEMA_VERSION: 1;
export const AUDIT_LEVELS: Readonly<{
    BASIC: "basic";
    PRIVILEGED: "privileged";
    CRITICAL: "critical";
}>;
export const AUDIT_RESULTS: Readonly<{
    SUCCEEDED: "succeeded";
    REJECTED: "rejected";
    FAILED: "failed";
    RECOVERY_REQUIRED: "recovery_required";
}>;
export const AUDIT_EVENT_FIELDS: readonly string[];
export const AUDIT_EVENT_REQUIRED_FIELDS: readonly string[];
export const AUDIT_BEFORE_AFTER_MAX_BYTES: 8192;
export const AUDIT_METADATA_MAX_BYTES: 4096;
