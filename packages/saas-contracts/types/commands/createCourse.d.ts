export const CREATE_COURSE_INPUT_FIELDS: readonly string[];
export const CREATE_COURSE_LEARNING_LANGUAGE_FIELDS: readonly string[];
export const CREATE_COURSE_INTERFACE_LANGUAGE_FIELDS: readonly string[];
export const CREATE_COURSE_RESULT_FIELDS: readonly string[];
export const CREATE_COURSE_OPERATION: "CreateCourse";
export const CREATE_COURSE_RESOURCE_TYPE: "course";
export const CREATE_COURSE_INITIAL_STATUS: "draft";
export const CREATE_COURSE_REQUIRED_CAPABILITY: "course.create";
export const CREATE_COURSE_AUDIT_OPERATION: "CreateCourse.create";
export const CREATE_COURSE_AUDIT_LEVEL: "privileged";
export const CREATE_COURSE_AUDIT_RESULT: "succeeded";
export const CREATE_COURSE_AUDIT_BEFORE_FIELDS: readonly string[];
export const CREATE_COURSE_AUDIT_AFTER_FIELDS: readonly string[];
export const CREATE_COURSE_AUDIT_METADATA_FIELDS: readonly string[];
export function validateCreateCourseInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "createCourse";
        reason: "invalid_create_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function createCourseBehavioralPayload(input: unknown): Readonly<{
    tenantId: unknown;
    courseId: unknown;
    displayName: unknown;
    description: unknown;
    learningLanguage: Readonly<{
        languageCode: unknown;
        displayName: unknown;
    }>;
    supportLanguageCode: unknown;
    interfaceLanguages: readonly Readonly<{
        locale: unknown;
        displayName: unknown;
    }>[];
    cefrLevel: unknown;
    initialStatus: "draft";
}>;
export function validateCreateCourseResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "createCourse";
        reason: "invalid_create_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
