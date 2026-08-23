export function validatePersistedCourse(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "course";
        reason: "invalid_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
