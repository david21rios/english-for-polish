import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { CAPABILITY_IDS } from "../domain/capabilities.js";
import { CEFR_LEVELS, COURSE_STATUSES } from "../domain/course.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import {
  hasExactKeys,
  isCanonicalBcp47,
  isPlainObject,
} from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);

/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;

/** @param {unknown} value */
const text = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  value === value.trim();

const invalid = () =>
  Object.freeze({
    ok: false,
    issue: Object.freeze({
      code: "INVALID_ARGUMENT",
      field: "createCourse",
      reason: "invalid_create_course",
    }),
  });

/** @template T @param {T} value */
const ok = (value) =>
  Object.freeze({
    ok: true,
    value,
  });

export const CREATE_COURSE_INPUT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "tenantId",
  "courseId",
  "displayName",
  "description",
  "learningLanguage",
  "supportLanguageCode",
  "interfaceLanguages",
  "cefrLevel",
]);

export const CREATE_COURSE_LEARNING_LANGUAGE_FIELDS = frozen([
  "languageCode",
  "displayName",
]);

export const CREATE_COURSE_INTERFACE_LANGUAGE_FIELDS = frozen([
  "locale",
  "displayName",
]);

export const CREATE_COURSE_RESULT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "operation",
  "resourceType",
  "resourceId",
  "status",
  "replayed",
]);

export const CREATE_COURSE_OPERATION =
  COMMAND_TYPES.CREATE_COURSE;

export const CREATE_COURSE_RESOURCE_TYPE =
  "course";

export const CREATE_COURSE_INITIAL_STATUS =
  COURSE_STATUSES.DRAFT;

export const CREATE_COURSE_REQUIRED_CAPABILITY =
  CAPABILITY_IDS.COURSE_CREATE;

export const CREATE_COURSE_AUDIT_OPERATION =
  "CreateCourse.create";

export const CREATE_COURSE_AUDIT_LEVEL =
  AUDIT_LEVELS.PRIVILEGED;

export const CREATE_COURSE_AUDIT_RESULT =
  AUDIT_RESULTS.SUCCEEDED;

export const CREATE_COURSE_AUDIT_BEFORE_FIELDS = frozen([
  "courseExists",
]);

export const CREATE_COURSE_AUDIT_AFTER_FIELDS = frozen([
  "courseStatus",
]);

export const CREATE_COURSE_AUDIT_METADATA_FIELDS = frozen([
  "stage",
]);

/** @param {unknown} value */
const validLearningLanguage = (value) => {
  if (!hasExactKeys(value, CREATE_COURSE_LEARNING_LANGUAGE_FIELDS)) {
    return false;
  }

  const language =
    /** @type {{languageCode: unknown, displayName: unknown}} */
    (value);

  return (
    isCanonicalBcp47(language.languageCode) &&
    text(language.displayName)
  );
};

/** @param {unknown} value */
const validInterfaceLanguages = (value) => {
  if (!Array.isArray(value) || value.length < 1) {
    return false;
  }

  const locales = new Set();

  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) {
      return false;
    }

    const item = value[index];

    if (
      !hasExactKeys(
        item,
        CREATE_COURSE_INTERFACE_LANGUAGE_FIELDS,
      )
    ) {
      return false;
    }

    const language =
      /** @type {{locale: unknown, displayName: unknown}} */
      (item);

    if (
      !isCanonicalBcp47(language.locale) ||
      !text(language.displayName)
    ) {
      return false;
    }

    if (locales.has(language.locale)) {
      return false;
    }

    locales.add(language.locale);
  }

  return true;
};

/** @param {unknown} value */
export const validateCreateCourseInput = (value) => {
  if (!hasExactKeys(value, CREATE_COURSE_INPUT_FIELDS)) {
    return invalid();
  }

  const v =
    /** @type {Record<string, unknown>} */
    (value);

  if (
    !validId(v.commandId) ||
    !validId(v.correlationId) ||
    !validId(v.tenantId) ||
    !validId(v.courseId)
  ) {
    return invalid();
  }

  if (
    !text(v.displayName) ||
    !text(v.description)
  ) {
    return invalid();
  }

  if (!validLearningLanguage(v.learningLanguage)) {
    return invalid();
  }

  if (!isCanonicalBcp47(v.supportLanguageCode)) {
    return invalid();
  }

  if (!validInterfaceLanguages(v.interfaceLanguages)) {
    return invalid();
  }

  if (
    !Object.values(CEFR_LEVELS).includes(
      /** @type {never} */
      (v.cefrLevel),
    )
  ) {
    return invalid();
  }

  return ok(value);
};

/** @param {unknown} input */
export const createCourseBehavioralPayload = (input) => {
  const validation =
    validateCreateCourseInput(input);

  if (!validation.ok) {
    throw new TypeError(
      "input is not a valid CreateCourse command.",
    );
  }

  const v =
    /** @type {{
     * tenantId: unknown,
     * courseId: unknown,
     * displayName: unknown,
     * description: unknown,
     * learningLanguage: {
     *   languageCode: unknown,
     *   displayName: unknown
     * },
     * supportLanguageCode: unknown,
     * interfaceLanguages: Array<{
     *   locale: unknown,
     *   displayName: unknown
     * }>,
     * cefrLevel: unknown
     * }} */
    (input);

  const learningLanguage =
    Object.freeze({
      languageCode:
        v.learningLanguage.languageCode,
      displayName:
        v.learningLanguage.displayName,
    });

  const interfaceLanguages =
    Object.freeze(
      v.interfaceLanguages.map((item) =>
        Object.freeze({
          locale: item.locale,
          displayName: item.displayName,
        }),
      ),
    );

  return Object.freeze({
    tenantId: v.tenantId,
    courseId: v.courseId,
    displayName: v.displayName,
    description: v.description,
    learningLanguage,
    supportLanguageCode:
      v.supportLanguageCode,
    interfaceLanguages,
    cefrLevel: v.cefrLevel,
    initialStatus:
      CREATE_COURSE_INITIAL_STATUS,
  });
};

/** @param {unknown} value */
export const validateCreateCourseResult = (value) => {
  if (!hasExactKeys(value, CREATE_COURSE_RESULT_FIELDS)) {
    return invalid();
  }

  const v =
    /** @type {{
     * commandId: unknown,
     * correlationId: unknown,
     * operation: unknown,
     * resourceType: unknown,
     * resourceId: unknown,
     * status: unknown,
     * replayed: unknown
     * }} */
    (value);

  if (
    !validId(v.commandId) ||
    !validId(v.correlationId) ||
    v.operation !== CREATE_COURSE_OPERATION ||
    v.resourceType !== CREATE_COURSE_RESOURCE_TYPE ||
    !validId(v.resourceId) ||
    v.status !== "succeeded" ||
    typeof v.replayed !== "boolean"
  ) {
    return invalid();
  }

  return ok(value);
};
