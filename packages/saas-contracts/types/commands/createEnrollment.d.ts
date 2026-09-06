export const CREATE_ENROLLMENT_INPUT_FIELDS: readonly string[];
export const CREATE_ENROLLMENT_RESULT_FIELDS: readonly string[];
export const CREATE_ENROLLMENT_OPERATION: "CreateEnrollment";
export const CREATE_ENROLLMENT_RESOURCE_TYPE: "enrollment";
export const CREATE_ENROLLMENT_REQUIRED_CAPABILITY: "enrollment.create";
export const CREATE_ENROLLMENT_AUDIT_OPERATION: "CreateEnrollment.create";
export function validateCreateEnrollmentInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "createEnrollment";
        reason: "invalid_create_enrollment";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function createEnrollmentBehavioralPayload(input: Record<string, unknown>): Readonly<{
    tenantId: unknown;
    membershipId: unknown;
    courseId: unknown;
}>;
export function validateCreateEnrollmentResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "createEnrollment";
        reason: "invalid_create_enrollment";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
