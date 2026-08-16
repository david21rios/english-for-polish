export const SUSPEND_TENANT_INPUT_FIELDS: readonly string[];
export const SUSPEND_TENANT_RESULT_FIELDS: readonly string[];
export const SUSPEND_TENANT_OPERATION: "SuspendTenant";
export const SUSPEND_TENANT_RESOURCE_TYPE: "tenant";
export const SUSPEND_TENANT_TARGET_STATE: "suspended";
export const SUSPEND_TENANT_AUDIT_OPERATION: "SuspendTenant.update";
export const SUSPEND_TENANT_AUDIT_LEVEL: "critical";
export const SUSPEND_TENANT_AUDIT_RESULT: "succeeded";
export const SUSPEND_TENANT_AUDIT_BEFORE_FIELDS: readonly string[];
export const SUSPEND_TENANT_AUDIT_AFTER_FIELDS: readonly string[];
export const SUSPEND_TENANT_AUDIT_METADATA_FIELDS: readonly string[];
export function validateSuspendTenantInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "suspendTenant";
        reason: "invalid_suspend_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function suspendTenantBehavioralPayload(input: Readonly<Record<string, unknown>>): Readonly<{
    tenantId: unknown;
    targetState: string;
}>;
export function validateSuspendTenantResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "suspendTenant";
        reason: "invalid_suspend_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
