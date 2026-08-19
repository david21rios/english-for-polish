export const REJECT_REGISTRATION_REQUEST_INPUT_FIELDS: readonly string[];
export const REJECT_REGISTRATION_REQUEST_RESULT_FIELDS: readonly string[];
export const REJECT_REGISTRATION_REQUEST_OPERATION: "RejectRegistrationRequest";
export const REJECT_REGISTRATION_REQUEST_RESOURCE_TYPE: "registrationRequest";
export const REJECT_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS: "rejected";
export const REJECT_REGISTRATION_REQUEST_REQUIRED_CAPABILITY: "registration_request.review";
export const REJECT_REGISTRATION_REQUEST_AUDIT_OPERATION: "RejectRegistrationRequest.update";
export const REJECT_REGISTRATION_REQUEST_AUDIT_LEVEL: "privileged";
export const REJECT_REGISTRATION_REQUEST_AUDIT_RESULT: "succeeded";
export const REJECT_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS: readonly string[];
export const REJECT_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS: readonly string[];
export const REJECT_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS: readonly string[];
export function validateRejectRegistrationRequestInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "rejectRegistrationRequest";
        reason: "invalid_reject_registration_request";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function rejectRegistrationRequestBehavioralPayload(input: unknown): Readonly<{
    tenantId: unknown;
    requestId: unknown;
    targetRequestStatus: "rejected";
}>;
export function validateRejectRegistrationRequestResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "rejectRegistrationRequest";
        reason: "invalid_reject_registration_request";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
