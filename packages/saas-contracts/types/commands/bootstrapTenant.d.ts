export const BOOTSTRAP_TENANT_INPUT_FIELDS: readonly string[];
export const BOOTSTRAP_TENANT_PROFILE_FIELDS: readonly string[];
export const BOOTSTRAP_TENANT_SETTINGS_FIELDS: readonly string[];
export const BOOTSTRAP_TENANT_BRANDING_FIELDS: readonly string[];
export const BOOTSTRAP_TENANT_RESULT_FIELDS: readonly string[];
export const BOOTSTRAP_TENANT_OPERATION: "BootstrapTenant";
export const BOOTSTRAP_TENANT_RESOURCE_TYPE: "tenant";
export const BOOTSTRAP_TENANT_AUDIT_OPERATION: "BootstrapTenant.create";
export const BOOTSTRAP_TENANT_AUDIT_LEVEL: "critical";
export const BOOTSTRAP_TENANT_AUDIT_RESULT: "succeeded";
export const BOOTSTRAP_TENANT_AUDIT_BEFORE_FIELDS: readonly string[];
export const BOOTSTRAP_TENANT_AUDIT_AFTER_FIELDS: readonly string[];
export const BOOTSTRAP_TENANT_AUDIT_METADATA_FIELDS: readonly string[];
export function validateBootstrapTenantInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "bootstrapTenant";
        reason: "invalid_bootstrap_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function bootstrapTenantBehavioralPayload(input: Readonly<Record<string, unknown>>): Readonly<{
    tenantId: unknown;
    tenant: unknown;
    settings: unknown;
    branding: unknown;
    firstAdminUid: unknown;
    expectedAdminEmail: unknown;
    initialStatus: unknown;
}>;
export function validateBootstrapTenantResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "bootstrapTenant";
        reason: "invalid_bootstrap_tenant";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
