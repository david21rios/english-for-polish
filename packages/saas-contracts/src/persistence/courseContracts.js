import { CEFR_LEVELS, COURSE_STATUSES } from "../domain/course.js";
import { COURSE_FIELDS } from "./fields.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isCanonicalBcp47 } from "../validation/objects.js";
import { validatePersistedTimestamp } from "../validation/timestamps.js";

const invalid = () => Object.freeze({
  ok: false,
  issue: Object.freeze({
    code: "INVALID_ARGUMENT",
    field: "course",
    reason: "invalid_course",
  }),
});
/** @param {unknown} value */ const ok = (value) => Object.freeze({ ok: true, value });
/** @param {unknown} value */ const id = (value) => validateDocumentIdentifier(value).ok;
/** @param {unknown} value */ const timestamp = (value) => validatePersistedTimestamp(value).ok;
/** @param {unknown} value */ const text = (value) => typeof value === "string" && value.length > 0 && value === value.trim();

/** @param {unknown} value */
const validLearningLanguage = (value) => hasExactKeys(value, ["languageCode", "displayName"])
  && isCanonicalBcp47(/** @type {Record<string, unknown>} */ (value).languageCode)
  && text(/** @type {Record<string, unknown>} */ (value).displayName);

/** @param {unknown} value */
const validInterfaceLanguages = (value) => {
  if (!Array.isArray(value) || value.length < 1) return false;
  const locales = new Set();
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) return false;
    const item = value[index];
    const candidate = /** @type {Record<string, unknown>} */ (item);
    if (!hasExactKeys(candidate, ["locale", "displayName"])
      || !isCanonicalBcp47(candidate.locale) || !text(candidate.displayName)
      || locales.has(candidate.locale)) return false;
    locales.add(/** @type {string} */ (candidate.locale));
  }
  return true;
};

/** @param {unknown} value */
export const validatePersistedCourse = (value) => {
  if (!hasExactKeys(value, COURSE_FIELDS)) return invalid();
  const v = /** @type {Record<string, unknown>} */ (value);
  const status = v.status;
  const lifecycle = status === COURSE_STATUSES.DRAFT || status === COURSE_STATUSES.ACTIVE
    ? v.archivedAt === null
    : status === COURSE_STATUSES.ARCHIVED && timestamp(v.archivedAt);
  return id(v.courseId) && id(v.tenantId) && text(v.displayName) && text(v.description)
    && validLearningLanguage(v.learningLanguage) && isCanonicalBcp47(v.supportLanguageCode)
    && validInterfaceLanguages(v.interfaceLanguages)
    && Object.values(CEFR_LEVELS).includes(/** @type {never} */ (v.cefrLevel))
    && typeof v.version === "number" && Number.isInteger(v.version) && v.version >= 1
    && Object.values(COURSE_STATUSES).includes(/** @type {never} */ (status))
    && timestamp(v.createdAt) && timestamp(v.updatedAt) && lifecycle
    ? ok(value) : invalid();
};
