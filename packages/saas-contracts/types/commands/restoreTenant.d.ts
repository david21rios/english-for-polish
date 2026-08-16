export const RESTORE_TENANT_INPUT_FIELDS: readonly string[];
export const RESTORE_TENANT_RESULT_FIELDS: readonly string[];
export const RESTORE_TENANT_OPERATION: "RestoreTenant";
export const RESTORE_TENANT_RESOURCE_TYPE: "tenant";
export const RESTORE_TENANT_TARGET_STATE: "active";
export const RESTORE_TENANT_AUDIT_OPERATION: "RestoreTenant.update";
export const RESTORE_TENANT_AUDIT_LEVEL: "critical";
export const RESTORE_TENANT_AUDIT_RESULT: "succeeded";
export const RESTORE_TENANT_AUDIT_BEFORE_FIELDS: readonly string[];
export const RESTORE_TENANT_AUDIT_AFTER_FIELDS: readonly string[];
export const RESTORE_TENANT_AUDIT_METADATA_FIELDS: readonly string[];
export function validateRestoreTenantInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "restoreTenant";
        reason: "invalid_restore_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function restoreTenantBehavioralPayload(input: Readonly<Record<string, unknown>>): Readonly<{
    tenantId: unknown;
    targetState: string;
}>;
export function validateRestoreTenantResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "restoreTenant";
        reason: "invalid_restore_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
