export const ARCHIVE_TENANT_INPUT_FIELDS: readonly string[];
export const ARCHIVE_TENANT_RESULT_FIELDS: readonly string[];
export const ARCHIVE_TENANT_OPERATION: "ArchiveTenant";
export const ARCHIVE_TENANT_RESOURCE_TYPE: "tenant";
export const ARCHIVE_TENANT_TARGET_STATE: "archived";
export const ARCHIVE_TENANT_AUDIT_OPERATION: "ArchiveTenant.update";
export const ARCHIVE_TENANT_AUDIT_LEVEL: "critical";
export const ARCHIVE_TENANT_AUDIT_RESULT: "succeeded";
export const ARCHIVE_TENANT_AUDIT_BEFORE_FIELDS: readonly string[];
export const ARCHIVE_TENANT_AUDIT_AFTER_FIELDS: readonly string[];
export const ARCHIVE_TENANT_AUDIT_METADATA_FIELDS: readonly string[];
export function validateArchiveTenantInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "archiveTenant";
        reason: "invalid_restore_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function archiveTenantBehavioralPayload(input: Readonly<Record<string, unknown>>): Readonly<{
    tenantId: unknown;
    targetState: string;
}>;
export function validateArchiveTenantResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "archiveTenant";
        reason: "invalid_restore_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
