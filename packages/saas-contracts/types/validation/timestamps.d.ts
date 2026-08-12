export function validatePersistedTimestamp(value: unknown, name?: string): PersistedTimestampValidationResult;
export type PersistedTimestampValidationResult = Readonly<{
    ok: true;
    value: string;
}> | Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: "invalid_persisted_timestamp";
    }>;
}>;
