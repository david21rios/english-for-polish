import {
  createLegacyLessonLogicalIdentity,
  validateLegacyLessonInventoryRecord,
  validateLegacyLessonSourceProvenance,
  type LegacyLessonFieldEvidence,
  type LegacyLessonInventoryRecord,
  type LegacyLessonSourceSurface,
} from "./legacyLessonReconciliationContracts.js";
import {
  validateDirectLessonDocumentPath,
  validateNestedLessonDocumentPath,
} from "./legacyLessonSourceDiscoveryContracts.js";
import {
  DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  DIRECT_LEGACY_LESSON_SOURCE_KIND,
  NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  NESTED_LEGACY_LESSON_SOURCE_KIND,
} from "./legacyLessonSourceDiscoveryContracts.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
} from "./legacyMigrationSourceDiscovery.js";
import type { StableSourceReference } from "./legacyMigrationTypes.js";
import {
  PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION,
  MAX_REST_VALUE_NODE_COUNT_PAIR,
  createPhase05FirestoreRestValueValidationState,
  readPhase05FirestoreKnownScalar,
  validatePhase05FirestoreRestValue,
  type Phase05FirestoreKnownScalar,
  type Phase05FirestoreRestValueFailureCode,
  type Phase05FirestoreRestValueProviderType,
} from "./phase05FirestoreRestValuePolicy.js";
import {
  PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION,
  collectPhase05UnknownLessonFields,
} from "./phase05LessonUnknownFieldPolicy.js";

export type Phase05LessonInventorySourceContext = Readonly<{
  sourceSurface: LegacyLessonSourceSurface;
  expectedLevelId: string;
  expectedLessonId: string;
  expectedModuleId: string | null;
  expectedDocumentPath: string;
  expectedDocumentName: string;
  sourceReference: StableSourceReference;
  logicalSourceId: string;
  sourceKind: string;
  schemaVariant: string;
  discoveryStrategyVersion: string;
  restValuePolicyVersion: string;
  unknownFieldPolicyVersion: string;
}>;

export type Phase05LessonInventoryParseFailureCode = Phase05FirestoreRestValueFailureCode
  | "MALFORMED_PROVIDER_RESPONSE"
  | "PROVIDER_RESOURCE_IDENTITY_MISMATCH"
  | "KNOWN_FIELD_PROVIDER_TYPE_MISMATCH"
  | "KNOWN_FIELD_VALUE_INVALID";

export type Phase05LessonInventoryParseResult = Readonly<
  | {
      ok: true;
      record: LegacyLessonInventoryRecord;
      valueNodeCount: number;
      validatedNivel: LegacyLessonFieldEvidence<string | null>;
    }
  | { ok: false; failureCode: Phase05LessonInventoryParseFailureCode }
>;

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

const failure = (failureCode: Phase05LessonInventoryParseFailureCode): Phase05LessonInventoryParseResult => ({
  ok: false,
  failureCode,
});

const absent = <T>(): LegacyLessonFieldEvidence<T> => Object.freeze({ presence: "ABSENT" });
const present = <T>(value: T): LegacyLessonFieldEvidence<T> => Object.freeze({ presence: "PRESENT", value });

type ReadFieldResult = Readonly<
  | { kind: "absent" }
  | { kind: "present"; providerType: Phase05FirestoreRestValueProviderType; value: Phase05FirestoreKnownScalar }
  | { kind: "failure"; failureCode: Phase05LessonInventoryParseFailureCode }
>;

const readField = (
  fields: Record<string, unknown>,
  fieldName: string,
  allowed: readonly Phase05FirestoreRestValueProviderType[],
): ReadFieldResult => {
  if (!Object.hasOwn(fields, fieldName)) return { kind: "absent" };
  const result = readPhase05FirestoreKnownScalar(fields[fieldName], allowed);
  if (!result.ok) return { kind: "failure", failureCode: result.failureCode };
  return { kind: "present", providerType: result.providerType, value: result.value };
};

const requireString = (value: Phase05FirestoreKnownScalar, fieldName: string): string | Phase05LessonInventoryParseResult =>
  typeof value === "string" ? value : failure("KNOWN_FIELD_VALUE_INVALID");

const validateSourceContext = (context: Phase05LessonInventorySourceContext): boolean => {
  if (context.restValuePolicyVersion !== PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION
    || context.unknownFieldPolicyVersion !== PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION
    || context.schemaVariant !== LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT
    || context.discoveryStrategyVersion !== LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION
    || context.expectedLevelId !== "A1"
    || context.expectedLessonId !== "A1_1") return false;

  if (context.sourceSurface === "DIRECT_LEVEL_LESSON") {
    return context.expectedModuleId === null
      && context.expectedDocumentPath === "levels/A1/lessons/A1_1"
      && context.expectedDocumentName === "projects/english-for-polish/databases/(default)/documents/levels/A1/lessons/A1_1"
      && context.logicalSourceId === DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID
      && context.sourceKind === DIRECT_LEGACY_LESSON_SOURCE_KIND
      && context.sourceReference?.collectionPath === context.expectedDocumentPath
      && context.sourceReference?.entityKind === DIRECT_LEGACY_LESSON_SOURCE_KIND
      && context.sourceReference?.recordId === context.expectedLessonId;
  }
  return context.sourceSurface === "NESTED_MODULE_LESSON"
    && context.expectedModuleId === "A1_M01_pruebaa1"
    && context.expectedDocumentPath === "levels/A1/modules/A1_M01_pruebaa1/lessons/A1_1"
    && context.expectedDocumentName === "projects/english-for-polish/databases/(default)/documents/levels/A1/modules/A1_M01_pruebaa1/lessons/A1_1"
    && context.logicalSourceId === NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID
    && context.sourceKind === NESTED_LEGACY_LESSON_SOURCE_KIND
    && context.sourceReference?.collectionPath === context.expectedDocumentPath
    && context.sourceReference?.entityKind === NESTED_LEGACY_LESSON_SOURCE_KIND
    && context.sourceReference?.recordId === context.expectedLessonId;
};

const validateEnvelopeTimestamp = (value: unknown): boolean => {
  const result = validatePhase05FirestoreRestValue({ timestampValue: value });
  return result.ok;
};

export const parsePhase05LessonInventoryDocument = (
  document: unknown,
  context: Phase05LessonInventorySourceContext,
): Phase05LessonInventoryParseResult => {
  try {
  if (!validateSourceContext(context) || !isPlainObject(document)) return failure("MALFORMED_PROVIDER_RESPONSE");
  const allowedEnvelopeKeys = new Set(["name", "fields", "createTime", "updateTime"]);
  if (Object.keys(document).some((key) => !allowedEnvelopeKeys.has(key))
    || typeof document.name !== "string"
    || !Object.hasOwn(document, "fields")
    || !isPlainObject(document.fields)) return failure("MALFORMED_PROVIDER_RESPONSE");
  if (document.name !== context.expectedDocumentName) return failure("PROVIDER_RESOURCE_IDENTITY_MISMATCH");
  if ((Object.hasOwn(document, "createTime") && !validateEnvelopeTimestamp(document.createTime))
    || (Object.hasOwn(document, "updateTime") && !validateEnvelopeTimestamp(document.updateTime))) {
    return failure("MALFORMED_PROVIDER_RESPONSE");
  }

  const fields = document.fields;
  const validationState = createPhase05FirestoreRestValueValidationState();
  const unknownResult = collectPhase05UnknownLessonFields({
    fields,
    sourceSurface: context.sourceSurface,
    sourceReference: context.sourceReference,
    restValuePolicyVersion: context.restValuePolicyVersion,
    validationState,
  });
  if (!unknownResult.ok) return failure(unknownResult.failureCode);
  if (unknownResult.nodeCount > MAX_REST_VALUE_NODE_COUNT_PAIR) return failure("REST_VALUE_NODE_COUNT_EXCEEDED");

  const lessonIdField = readField(fields, "lessonId", ["stringValue"]);
  if (lessonIdField.kind === "failure") return failure(lessonIdField.failureCode);
  if (lessonIdField.kind === "present") {
    const value = requireString(lessonIdField.value, "lessonId");
    if (typeof value !== "string") return value;
    if (value !== context.expectedLessonId) return failure("KNOWN_FIELD_VALUE_INVALID");
  }

  const levelIdField = readField(fields, "levelId", ["stringValue"]);
  if (levelIdField.kind === "failure") return failure(levelIdField.failureCode);
  if (levelIdField.kind === "present") {
    const value = requireString(levelIdField.value, "levelId");
    if (typeof value !== "string") return value;
    if (value !== context.expectedLevelId) return failure("KNOWN_FIELD_VALUE_INVALID");
  }

  const levelField = readField(fields, "level", ["stringValue"]);
  if (levelField.kind === "failure") return failure(levelField.failureCode);
  if (levelField.kind === "present") {
    const value = requireString(levelField.value, "level");
    if (typeof value !== "string") return value;
    if (value !== context.expectedLevelId) return failure("KNOWN_FIELD_VALUE_INVALID");
  }

  const nivelField = readField(fields, "nivel", ["stringValue", "nullValue"]);
  if (nivelField.kind === "failure") return failure(nivelField.failureCode);
  if (nivelField.kind === "present" && nivelField.providerType === "stringValue") {
    const value = requireString(nivelField.value, "nivel");
    if (typeof value !== "string") return value;
    if (value !== context.expectedLevelId) return failure("KNOWN_FIELD_VALUE_INVALID");
  }

  const moduleIdField = readField(fields, "moduleId", ["stringValue"]);
  if (moduleIdField.kind === "failure") return failure(moduleIdField.failureCode);
  if (context.sourceSurface === "DIRECT_LEVEL_LESSON" && moduleIdField.kind === "present") {
    return failure("KNOWN_FIELD_VALUE_INVALID");
  }
  if (context.sourceSurface === "NESTED_MODULE_LESSON" && moduleIdField.kind === "present") {
    const value = requireString(moduleIdField.value, "moduleId");
    if (typeof value !== "string") return value;
    if (value !== context.expectedModuleId) return failure("KNOWN_FIELD_VALUE_INVALID");
  }

  const moduleTitleField = readField(fields, "moduleTitle", ["stringValue"]);
  if (moduleTitleField.kind === "failure") return failure(moduleTitleField.failureCode);
  const titleField = readField(fields, "title", ["stringValue"]);
  if (titleField.kind === "failure") return failure(titleField.failureCode);
  const tituloField = readField(fields, "titulo", ["stringValue"]);
  if (tituloField.kind === "failure") return failure(tituloField.failureCode);
  const orderField = readField(fields, "orderInModule", ["integerValue", "doubleValue"]);
  if (orderField.kind === "failure") return failure(orderField.failureCode);
  const statusField = readField(fields, "status", ["stringValue"]);
  if (statusField.kind === "failure") return failure(statusField.failureCode);

  const stringEvidence = (field: ReadFieldResult): LegacyLessonFieldEvidence<string> | Phase05LessonInventoryParseResult => {
    if (field.kind === "absent") return absent<string>();
    if (field.kind === "failure") return failure(field.failureCode);
    if (typeof field.value !== "string") return failure("KNOWN_FIELD_VALUE_INVALID");
    return present(field.value);
  };
  const moduleTitle = stringEvidence(moduleTitleField);
  if ("ok" in moduleTitle && moduleTitle.ok === false) return moduleTitle;
  const title = stringEvidence(titleField);
  if ("ok" in title && title.ok === false) return title;
  const titulo = stringEvidence(tituloField);
  if ("ok" in titulo && titulo.ok === false) return titulo;
  const status = stringEvidence(statusField);
  if ("ok" in status && status.ok === false) return status;

  const orderInModule: LegacyLessonFieldEvidence<number> | Phase05LessonInventoryParseResult = orderField.kind === "absent"
    ? absent<number>()
    : orderField.kind === "present" && typeof orderField.value === "number" && Number.isFinite(orderField.value)
      ? present(orderField.value)
      : failure("KNOWN_FIELD_VALUE_INVALID");
  if ("ok" in orderInModule && orderInModule.ok === false) return orderInModule;

  const sourceReference = Object.freeze({ ...context.sourceReference });
  const nested = context.sourceSurface === "NESTED_MODULE_LESSON";
  const recordModuleId = nested ? present(context.expectedModuleId as string) : absent<string>();
  const validatedNivel: LegacyLessonFieldEvidence<string | null> = nivelField.kind === "absent"
    ? absent<string | null>()
    : present(nivelField.value as string | null);
  const sourceStatus = statusField.kind === "present" && typeof statusField.value === "string" ? statusField.value : null;
  const provenance = validateLegacyLessonSourceProvenance({
    logicalSourceId: context.logicalSourceId,
    collectionPath: context.expectedDocumentPath,
    legacyDocumentId: context.expectedLessonId,
    sourceKind: context.sourceKind,
    schemaVariant: context.schemaVariant,
    discoveryStrategyVersion: context.discoveryStrategyVersion,
    sourceReference,
    sourceSurface: context.sourceSurface,
    levelId: context.expectedLevelId,
    lessonId: context.expectedLessonId,
    moduleId: context.expectedModuleId,
    sourceStatus,
  });

  const record = validateLegacyLessonInventoryRecord({
    sourceSurface: context.sourceSurface,
    logicalIdentity: createLegacyLessonLogicalIdentity({ levelId: context.expectedLevelId, lessonId: context.expectedLessonId }),
    sourcePath: context.expectedDocumentPath,
    sourceReference,
    provenance,
    moduleId: recordModuleId,
    moduleTitle,
    title,
    titulo,
    orderInModule,
    status,
    contentHashes: [],
    unknownFields: unknownResult.unknownFields,
  });

  const pathCheck = nested
    ? validateNestedLessonDocumentPath({
      documentPath: context.expectedDocumentPath,
      documentId: context.expectedLessonId,
      logicalSourceId: context.logicalSourceId,
      sourceSurface: context.sourceSurface,
      moduleId: context.expectedModuleId,
    })
    : validateDirectLessonDocumentPath({
      documentPath: context.expectedDocumentPath,
      documentId: context.expectedLessonId,
      logicalSourceId: context.logicalSourceId,
      sourceSurface: context.sourceSurface,
    });
  if (pathCheck !== context.expectedDocumentPath) return failure("MALFORMED_PROVIDER_RESPONSE");
  return Object.freeze({ ok: true, record, valueNodeCount: unknownResult.nodeCount, validatedNivel });
  } catch {
    return failure("MALFORMED_PROVIDER_RESPONSE");
  }
};
