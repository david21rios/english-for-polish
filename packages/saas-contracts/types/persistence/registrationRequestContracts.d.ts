export function encodeRegistrationRequestUidKey(uid: unknown): string;
export function validateRegistrationRequestKey(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function validatePersistedRegistrationRequest(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
