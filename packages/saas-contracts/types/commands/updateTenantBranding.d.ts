export const UPDATE_TENANT_BRANDING_INPUT_FIELDS: readonly string[];
export const UPDATE_TENANT_BRANDING_FIELDS: readonly string[];
export const UPDATE_TENANT_BRANDING_RESULT_FIELDS: readonly string[];
export const UPDATE_TENANT_BRANDING_OPERATION: "UpdateTenantBranding";
export const UPDATE_TENANT_BRANDING_RESOURCE_TYPE: "tenantBranding";
export const UPDATE_TENANT_BRANDING_AUDIT_OPERATION: "UpdateTenantBranding.update";
export const UPDATE_TENANT_BRANDING_AUDIT_LEVEL: "privileged";
export const UPDATE_TENANT_BRANDING_AUDIT_RESULT: "succeeded";
export const UPDATE_TENANT_BRANDING_AUDIT_BEFORE_FIELDS: readonly string[];
export const UPDATE_TENANT_BRANDING_AUDIT_AFTER_FIELDS: readonly string[];
export const UPDATE_TENANT_BRANDING_AUDIT_METADATA_FIELDS: readonly string[];
export function validateUpdateTenantBrandingInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateTenantBranding";
        reason: "invalid_update_tenant_branding";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function updateTenantBrandingBehavioralPayload(input: Readonly<Record<string, unknown>>): Readonly<{
    tenantId: unknown;
    expectedVersion: unknown;
    branding: unknown;
}>;
export function validateUpdateTenantBrandingResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateTenantBranding";
        reason: "invalid_update_tenant_branding";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
