export const UPDATE_TENANT_PROFILE_INPUT_FIELDS: readonly string[];
export const UPDATE_TENANT_PROFILE_PATCH_FIELDS: readonly string[];
export const UPDATE_TENANT_PROFILE_RESULT_FIELDS: readonly string[];
export const UPDATE_TENANT_PROFILE_OPERATION: "UpdateTenantProfile";
export const UPDATE_TENANT_PROFILE_RESOURCE_TYPE: "tenant";
export const UPDATE_TENANT_PROFILE_AUDIT_OPERATION: "UpdateTenantProfile.update";
export const UPDATE_TENANT_PROFILE_AUDIT_LEVEL: "privileged";
export const UPDATE_TENANT_PROFILE_AUDIT_RESULT: "succeeded";
export const UPDATE_TENANT_PROFILE_AUDIT_BEFORE_FIELDS: readonly string[];
export const UPDATE_TENANT_PROFILE_AUDIT_AFTER_FIELDS: readonly string[];
export const UPDATE_TENANT_PROFILE_AUDIT_METADATA_FIELDS: readonly string[];
export function validateUpdateTenantProfileInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateTenantProfile";
        reason: "invalid_update_tenant_profile";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function updateTenantProfileBehavioralPayload(input: Readonly<Record<string, unknown>>): Readonly<{
    tenantId: unknown;
    patch: unknown;
}>;
export function validateUpdateTenantProfileResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateTenantProfile";
        reason: "invalid_update_tenant_profile";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
