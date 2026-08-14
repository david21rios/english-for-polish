export const UPDATE_TENANT_SETTINGS_INPUT_FIELDS: readonly string[];
export const UPDATE_TENANT_SETTINGS_FIELDS: readonly string[];
export const UPDATE_TENANT_SETTINGS_RESULT_FIELDS: readonly string[];
export const UPDATE_TENANT_SETTINGS_OPERATION: "UpdateTenantSettings";
export const UPDATE_TENANT_SETTINGS_RESOURCE_TYPE: "tenant";
export const UPDATE_TENANT_SETTINGS_AUDIT_OPERATION: "UpdateTenantSettings.update";
export const UPDATE_TENANT_SETTINGS_AUDIT_LEVEL: "privileged";
export const UPDATE_TENANT_SETTINGS_AUDIT_RESULT: "succeeded";
export const UPDATE_TENANT_SETTINGS_AUDIT_BEFORE_FIELDS: readonly string[];
export const UPDATE_TENANT_SETTINGS_AUDIT_AFTER_FIELDS: readonly string[];
export const UPDATE_TENANT_SETTINGS_AUDIT_METADATA_FIELDS: readonly string[];
export function validateUpdateTenantSettingsInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateTenantSettings";
        reason: "invalid_update_tenant_settings";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function updateTenantSettingsBehavioralPayload(input: Readonly<Record<string, unknown>>): Readonly<{
    tenantId: unknown;
    expectedVersion: unknown;
    settings: unknown;
}>;
export function validateUpdateTenantSettingsResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateTenantSettings";
        reason: "invalid_update_tenant_settings";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
