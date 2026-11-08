import {
  validateLegacyUnknownFieldEvidence,
  type LegacyUnknownFieldEvidence,
  type LegacyLessonSourceSurface,
} from "./legacyLessonReconciliationContracts.js";
import type { StableSourceReference } from "./legacyMigrationTypes.js";
import {
  PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION,
  type Phase05FirestoreRestValueFailureCode,
  type Phase05FirestoreRestValueValidationState,
  createPhase05FirestoreRestValueValidationState,
  validatePhase05FirestoreRestValue,
} from "./phase05FirestoreRestValuePolicy.js";

export const PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION = "phase05-lesson-unknown-fields-v1" as const;

export const PHASE05_RECOGNIZED_LESSON_FIELDS = Object.freeze([
  "level",
  "levelId",
  "lessonId",
  "moduleId",
  "moduleTitle",
  "nivel",
  "orderInModule",
  "status",
  "title",
  "titulo",
] as const);

export type Phase05RecognizedLessonField = (typeof PHASE05_RECOGNIZED_LESSON_FIELDS)[number];

export type Phase05UnknownFieldCollectionResult = Readonly<
  | { ok: true; unknownFields: readonly LegacyUnknownFieldEvidence[]; nodeCount: number }
  | { ok: false; failureCode: Phase05FirestoreRestValueFailureCode }
>;

export type Phase05UnknownFieldCollectionInput = Readonly<{
  fields: unknown;
  sourceSurface: LegacyLessonSourceSurface;
  sourceReference: StableSourceReference;
  restValuePolicyVersion: string;
  validationState?: Phase05FirestoreRestValueValidationState;
}>;

const recognizedFieldSet = new Set<string>(PHASE05_RECOGNIZED_LESSON_FIELDS);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null)
    && Object.getOwnPropertySymbols(value).length === 0
    && Object.getOwnPropertyNames(value).every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor !== undefined && descriptor.enumerable && Object.hasOwn(descriptor, "value");
    });
};

export const isPhase05RecognizedLessonField = (fieldName: string): fieldName is Phase05RecognizedLessonField =>
  recognizedFieldSet.has(fieldName);

export const collectPhase05UnknownLessonFields = (
  input: Phase05UnknownFieldCollectionInput,
): Phase05UnknownFieldCollectionResult => {
  if (input.restValuePolicyVersion !== PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION
    || !isPlainObject(input.fields)
    || (input.sourceSurface !== "DIRECT_LEVEL_LESSON" && input.sourceSurface !== "NESTED_MODULE_LESSON")
    || !input.sourceReference
    || typeof input.sourceReference.recordId !== "string"
    || typeof input.sourceReference.entityKind !== "string"
    || (input.sourceReference.collectionPath !== null && typeof input.sourceReference.collectionPath !== "string")) {
    return { ok: false, failureCode: "REST_VALUE_MALFORMED_VARIANT" };
  }

  const state = input.validationState ?? createPhase05FirestoreRestValueValidationState();
  const initialCount = state.nodeCount;
  const fieldNames = Object.keys(input.fields).sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
  const unknownFields: LegacyUnknownFieldEvidence[] = [];

  for (const fieldName of fieldNames) {
    const result = validatePhase05FirestoreRestValue(input.fields[fieldName], state);
    if (!result.ok) return result;
    if (isPhase05RecognizedLessonField(fieldName)) continue;
    try {
      unknownFields.push(validateLegacyUnknownFieldEvidence({
        fieldPath: fieldName,
        providerType: result.providerType,
        presence: "PRESENT",
        sourceSurface: input.sourceSurface,
        sourceReference: input.sourceReference,
        migrationRelevance: "UNKNOWN",
      }));
    } catch {
      return { ok: false, failureCode: "REST_VALUE_MALFORMED_VARIANT" };
    }
  }

  return Object.freeze({
    ok: true,
    unknownFields: Object.freeze(unknownFields),
    nodeCount: state.nodeCount - initialCount,
  });
};
