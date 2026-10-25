import { validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import {
  LESSON_SOURCE_SURFACES,
  type LegacyLessonSourceSurface,
} from "./legacyLessonReconciliationContracts.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  type LegacyMigrationSourceDescriptor,
} from "./legacyMigrationSourceDiscovery.js";
import type { StableSourceReference } from "./legacyMigrationTypes.js";

export const DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID = "legacy.level_lesson" as const;
export const DIRECT_LEGACY_LESSON_SOURCE_KIND = "level_lesson" as const;
export const DIRECT_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE = "levels/{levelId}/lessons/{lessonId}" as const;
export const DIRECT_LEGACY_LESSON_COLLECTION_PATH_TEMPLATE = "levels/{levelId}/lessons" as const;
export const NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID = "legacy.level_module_lesson" as const;
export const NESTED_LEGACY_LESSON_SOURCE_KIND = "level_module_lesson" as const;
export const NESTED_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE = "levels/{levelId}/modules/{moduleId}/lessons/{lessonId}" as const;
export const NESTED_LEGACY_LESSON_COLLECTION_PATH_TEMPLATE = "levels/{levelId}/modules/{moduleId}/lessons" as const;
export const LESSON_INVENTORY_READ_PURPOSE_VERSION = "phase05-lesson-inventory-v1" as const;

export const LESSON_INITIAL_FIELD_PROJECTION = Object.freeze([
  "lessonId",
  "levelId",
  "level",
  "nivel",
  "moduleId",
  "moduleTitle",
  "title",
  "titulo",
  "orderInModule",
  "status",
] as const);
export type LessonInitialField = (typeof LESSON_INITIAL_FIELD_PROJECTION)[number];

export const INVENTORY_COMPLETENESS_STATES = Object.freeze([
  "COMPLETE_EMPTY",
  "COMPLETE_NONEMPTY",
  "PARTIAL",
  "TRUNCATED",
  "FAILED",
  "UNKNOWN",
] as const);
export type InventoryCompletenessState = (typeof INVENTORY_COMPLETENESS_STATES)[number];

export const INVENTORY_FAILURE_CODES = Object.freeze([
  "INVALID_REQUEST",
  "DESCRIPTOR_NOT_ALLOWLISTED",
  "SOURCE_DISCOVERY_REQUIRED",
  "PROVIDER_BINDING_MISMATCH",
  "PERMISSION_DENIED",
  "NOT_FOUND",
  "MALFORMED_PROVIDER_RESPONSE",
  "PAGINATION_LOOP",
  "READ_BOUND_EXCEEDED",
  "PARTIAL_INVENTORY",
  "UNSUPPORTED_PROJECTION",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_READ_FAILED",
] as const);
export type InventoryFailureCode = (typeof INVENTORY_FAILURE_CODES)[number];

export type LessonCollectionReadRequest = Readonly<{
  logicalSourceId: string;
  sourceSurface: LegacyLessonSourceSurface;
  projectId: string;
  databaseId: string;
  collectionPath: string;
  fieldProjection: readonly string[];
  pageSize: number;
  pageToken?: string | null;
  maxPages: number;
  maxDocuments: number;
  order: "DOCUMENT_PATH_ASC";
  schemaVariant: typeof LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT;
  discoveryStrategyVersion: typeof LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION;
  readPurposeVersion: typeof LESSON_INVENTORY_READ_PURPOSE_VERSION;
}>;

export type LessonProjectedFieldValue = string | number | boolean | null;
export type LessonProjectedFields = Readonly<Partial<Record<LessonInitialField, LessonProjectedFieldValue>>>;

export type LessonListedDocument = Readonly<{
  logicalSourceId: string;
  sourceSurface: LegacyLessonSourceSurface;
  projectId: string;
  databaseId: string;
  collectionPath: string;
  documentPath: string;
  documentId: string;
  projectedFields: LessonProjectedFields;
  sourceReference: StableSourceReference;
  readProvenance: Readonly<{
    schemaVariant: typeof LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT;
    discoveryStrategyVersion: typeof LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION;
    readPurposeVersion: typeof LESSON_INVENTORY_READ_PURPOSE_VERSION;
    pageIndex: number;
  }>;
}>;

export type LessonCollectionPage = Readonly<{
  requestIdentity: string;
  documents: readonly LessonListedDocument[];
  returnedDocumentCount: number;
  nextPageToken: string | null;
  pageIndex: number;
  readMetadata: Readonly<{
    projectId: string;
    databaseId: string;
    collectionPath: string;
    sourceSurface: LegacyLessonSourceSurface;
  }>;
}>;

export type LessonCollectionReadFailure = Readonly<{
  code: InventoryFailureCode;
  message: string;
}>;

export type LessonCollectionReadResult = Readonly<
  | { kind: "page"; page: LessonCollectionPage }
  | { kind: "failure"; failure: LessonCollectionReadFailure }
>;

const directDescriptor = PROVEN_LEGACY_SOURCE_DESCRIPTORS.find(
  (descriptor) => descriptor.logicalSourceId === DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
);

const nestedDescriptor = PROVEN_LEGACY_SOURCE_DESCRIPTORS.find(
  (descriptor) => descriptor.logicalSourceId === NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
);

const requireDescriptor = (
  descriptor: LegacyMigrationSourceDescriptor | undefined,
  expectedId: string,
): LegacyMigrationSourceDescriptor => {
  if (descriptor === undefined || descriptor.logicalSourceId !== expectedId) {
    throw new Error(`allowlisted lesson descriptor is missing: ${expectedId}`);
  }
  return descriptor;
};

export const validateDirectLessonDescriptor = (): LegacyMigrationSourceDescriptor => {
  const descriptor = requireDescriptor(directDescriptor, DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID);
  if (descriptor.sourceKind !== DIRECT_LEGACY_LESSON_SOURCE_KIND
    || descriptor.collectionPathTemplate !== DIRECT_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE
    || descriptor.schemaVariant !== LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT
    || descriptor.discoveryStrategyVersion !== LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION) {
    throw new TypeError("direct lesson descriptor semantics are invalid.");
  }
  return descriptor;
};

export const validateNestedLessonDescriptor = (): LegacyMigrationSourceDescriptor => {
  const descriptor = requireDescriptor(nestedDescriptor, NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID);
  if (descriptor.sourceKind !== NESTED_LEGACY_LESSON_SOURCE_KIND
    || descriptor.collectionPathTemplate !== NESTED_LEGACY_LESSON_DOCUMENT_PATH_TEMPLATE
    || descriptor.schemaVariant !== LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT
    || descriptor.discoveryStrategyVersion !== LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION) {
    throw new TypeError("nested lesson descriptor semantics are invalid.");
  }
  return descriptor;
};

export const mapLegacyLessonDescriptorToSurface = (
  logicalSourceId: string,
  sourceKind?: string,
): LegacyLessonSourceSurface => {
  if (logicalSourceId === DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID
    && (sourceKind === undefined || sourceKind === DIRECT_LEGACY_LESSON_SOURCE_KIND)) {
    return "DIRECT_LEVEL_LESSON";
  }
  if (logicalSourceId === NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID
    && (sourceKind === undefined || sourceKind === NESTED_LEGACY_LESSON_SOURCE_KIND)) {
    return "NESTED_MODULE_LESSON";
  }
  throw new TypeError("descriptor is not an approved lesson source.");
};

const requireSafeIdentifier = (value: unknown, name: string): string => {
  const result = validateDocumentIdentifier(value, name);
  if (!result.ok || typeof value !== "string" || value !== value.trim()
    || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/u.test(value)) {
    throw new TypeError(`${name} must be a safe document identifier.`);
  }
  return value;
};

const requireNonEmptyString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
  return value;
};

export const deriveDirectLessonCollectionPath = (input: Readonly<{ levelId: string }>): string => {
  const levelId = requireSafeIdentifier(input?.levelId, "levelId");
  return `levels/${levelId}/lessons`;
};

export const deriveNestedLessonCollectionPath = (
  input: Readonly<{ levelId: string; moduleId: string }>,
): string => {
  const levelId = requireSafeIdentifier(input?.levelId, "levelId");
  const moduleId = requireSafeIdentifier(input?.moduleId, "moduleId");
  return `levels/${levelId}/modules/${moduleId}/lessons`;
};

export const validateLessonCollectionPath = (
  value: unknown,
  surface: LegacyLessonSourceSurface,
): string => {
  const path = requireNonEmptyString(value, "collectionPath");
  const segments = path.split("/");
  if (surface === "DIRECT_LEVEL_LESSON") {
    if (segments.length !== 3 || segments[0] !== "levels" || segments[2] !== "lessons") {
      throw new TypeError("direct lesson collection path is invalid.");
    }
    requireSafeIdentifier(segments[1], "levelId");
  } else if (segments.length !== 5 || segments[0] !== "levels" || segments[2] !== "modules" || segments[4] !== "lessons") {
    throw new TypeError("nested lesson collection path is invalid.");
  } else {
    requireSafeIdentifier(segments[1], "levelId");
    requireSafeIdentifier(segments[3], "moduleId");
  }
  return path;
};

export const validateDirectLessonDocumentPath = (input: Readonly<{
  documentPath: string;
  documentId: string;
  logicalSourceId: string;
  sourceSurface: LegacyLessonSourceSurface;
}>): string => {
  if (input.logicalSourceId !== DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID || input.sourceSurface !== "DIRECT_LEVEL_LESSON") {
    throw new TypeError("direct lesson document descriptor/surface mismatch.");
  }
  const path = requireNonEmptyString(input.documentPath, "documentPath");
  const segments = path.split("/");
  if (segments.length !== 4 || segments[0] !== "levels" || segments[2] !== "lessons") {
    throw new TypeError("direct lesson document path is invalid.");
  }
  requireSafeIdentifier(segments[1], "levelId");
  const lessonId = requireSafeIdentifier(segments[3], "lessonId");
  if (lessonId !== input.documentId) throw new TypeError("document ID does not match lesson path.");
  return path;
};

export const validateNestedLessonDocumentPath = (input: Readonly<{
  documentPath: string;
  documentId: string;
  logicalSourceId: string;
  sourceSurface: LegacyLessonSourceSurface;
  moduleId?: string | null;
}>): string => {
  if (input.logicalSourceId !== NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID || input.sourceSurface !== "NESTED_MODULE_LESSON") {
    throw new TypeError("nested lesson document descriptor/surface mismatch.");
  }
  const path = requireNonEmptyString(input.documentPath, "documentPath");
  const segments = path.split("/");
  if (segments.length !== 6 || segments[0] !== "levels" || segments[2] !== "modules" || segments[4] !== "lessons") {
    throw new TypeError("nested lesson document path is invalid.");
  }
  requireSafeIdentifier(segments[1], "levelId");
  const moduleId = requireSafeIdentifier(segments[3], "moduleId");
  const lessonId = requireSafeIdentifier(segments[5], "lessonId");
  if (lessonId !== input.documentId) throw new TypeError("document ID does not match lesson path.");
  if (input.moduleId !== undefined && input.moduleId !== null && input.moduleId !== moduleId) {
    throw new TypeError("module evidence does not match lesson path.");
  }
  return path;
};

const validateBounds = (value: unknown, name: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be an explicit positive finite integer.`);
  }
  return value;
};

export const validateLessonFieldProjection = (value: unknown): readonly string[] => {
  if (!Array.isArray(value) || value.length !== LESSON_INITIAL_FIELD_PROJECTION.length
    || value.some((field, index) => field !== LESSON_INITIAL_FIELD_PROJECTION[index])) {
    throw new TypeError("lesson inventory projection must equal the approved structural projection.");
  }
  return Object.freeze([...LESSON_INITIAL_FIELD_PROJECTION]);
};

export const validateLessonPageToken = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  return requireNonEmptyString(value, "pageToken");
};

export const deriveLessonCollectionReadRequestIdentity = (request: LessonCollectionReadRequest): string => [
  request.logicalSourceId,
  request.sourceSurface,
  request.projectId,
  request.databaseId,
  request.collectionPath,
  request.fieldProjection.join(","),
  String(request.pageSize),
  request.pageToken ?? "",
  String(request.maxPages),
  String(request.maxDocuments),
  request.order,
  request.schemaVariant,
  request.discoveryStrategyVersion,
  request.readPurposeVersion,
].join("\u0000");

export const validateLessonCollectionReadRequest = (value: unknown): LessonCollectionReadRequest => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("collection read request must be an object.");
  const input = value as Record<string, unknown>;
  const logicalSourceId = requireNonEmptyString(input.logicalSourceId, "logicalSourceId");
  const sourceSurface = input.sourceSurface;
  if (!LESSON_SOURCE_SURFACES.includes(sourceSurface as LegacyLessonSourceSurface)) throw new TypeError("sourceSurface is invalid.");
  const typedSurface = sourceSurface as LegacyLessonSourceSurface;
  const expectedId = typedSurface === "DIRECT_LEVEL_LESSON" ? DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID : NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID;
  if (logicalSourceId !== expectedId) throw new TypeError("lesson descriptor does not match source surface.");
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const databaseId = requireNonEmptyString(input.databaseId, "databaseId");
  const collectionPath = validateLessonCollectionPath(input.collectionPath, typedSurface);
  const fieldProjection = validateLessonFieldProjection(input.fieldProjection);
  const pageSize = validateBounds(input.pageSize, "pageSize");
  const maxPages = validateBounds(input.maxPages, "maxPages");
  const maxDocuments = validateBounds(input.maxDocuments, "maxDocuments");
  if (pageSize > maxDocuments) throw new TypeError("pageSize cannot exceed maxDocuments.");
  if (input.order !== "DOCUMENT_PATH_ASC") throw new TypeError("order must be DOCUMENT_PATH_ASC.");
  if (input.schemaVariant !== LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT) throw new TypeError("schemaVariant is invalid.");
  if (input.discoveryStrategyVersion !== LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION) throw new TypeError("discoveryStrategyVersion is invalid.");
  if (input.readPurposeVersion !== LESSON_INVENTORY_READ_PURPOSE_VERSION) throw new TypeError("readPurposeVersion is invalid.");
  const pageToken = validateLessonPageToken(input.pageToken);
  return Object.freeze({
    logicalSourceId,
    sourceSurface: typedSurface,
    projectId,
    databaseId,
    collectionPath,
    fieldProjection,
    pageSize,
    ...(pageToken === null ? { pageToken: null } : { pageToken }),
    maxPages,
    maxDocuments,
    order: "DOCUMENT_PATH_ASC",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    readPurposeVersion: LESSON_INVENTORY_READ_PURPOSE_VERSION,
  });
};

const isProjectedField = (value: string): value is LessonInitialField =>
  (LESSON_INITIAL_FIELD_PROJECTION as readonly string[]).includes(value);

const validateProjectedFields = (value: unknown): LessonProjectedFields => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("projectedFields must be an object.");
  const result: Record<string, LessonProjectedFieldValue> = {};
  for (const [key, field] of Object.entries(value)) {
    if (!isProjectedField(key) || (typeof field !== "string" && typeof field !== "number" && typeof field !== "boolean" && field !== null)) {
      throw new TypeError("projectedFields contains an unsupported field.");
    }
    result[key] = field;
  }
  return Object.freeze(result) as LessonProjectedFields;
};

const validateListedDocumentPathCoherence = (input: Readonly<{
  collectionPath: string;
  documentPath: string;
  sourceSurface: LegacyLessonSourceSurface;
}>): Readonly<{ levelId: string; moduleId?: string; lessonId: string }> => {
  const documentSegments = input.documentPath.split("/");
  if (input.sourceSurface === "DIRECT_LEVEL_LESSON") {
    const levelId = requireSafeIdentifier(documentSegments[1], "levelId");
    const lessonId = requireSafeIdentifier(documentSegments[3], "lessonId");
    if (deriveDirectLessonCollectionPath({ levelId }) !== input.collectionPath) {
      throw new TypeError("lesson collection path does not match document path.");
    }
    return { levelId, lessonId };
  }
  const levelId = requireSafeIdentifier(documentSegments[1], "levelId");
  const moduleId = requireSafeIdentifier(documentSegments[3], "moduleId");
  const lessonId = requireSafeIdentifier(documentSegments[5], "lessonId");
  if (deriveNestedLessonCollectionPath({ levelId, moduleId }) !== input.collectionPath) {
    throw new TypeError("lesson collection path does not match document path.");
  }
  return { levelId, moduleId, lessonId };
};

export const validateLessonListedDocument = (value: unknown): LessonListedDocument => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("listed document must be an object.");
  const input = value as Record<string, unknown>;
  const sourceSurface = input.sourceSurface;
  if (!LESSON_SOURCE_SURFACES.includes(sourceSurface as LegacyLessonSourceSurface)) throw new TypeError("listed document source surface is invalid.");
  const typedSurface = sourceSurface as LegacyLessonSourceSurface;
  const logicalSourceId = requireNonEmptyString(input.logicalSourceId, "logicalSourceId");
  const documentId = requireSafeIdentifier(input.documentId, "documentId");
  const documentPath = requireNonEmptyString(input.documentPath, "documentPath");
  const collectionPath = validateLessonCollectionPath(input.collectionPath, typedSurface);
  if (typedSurface === "DIRECT_LEVEL_LESSON") validateDirectLessonDocumentPath({ documentPath, documentId, logicalSourceId, sourceSurface: typedSurface });
  else validateNestedLessonDocumentPath({ documentPath, documentId, logicalSourceId, sourceSurface: typedSurface });
  const pathIdentity = validateListedDocumentPathCoherence({ collectionPath, documentPath, sourceSurface: typedSurface });
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const databaseId = requireNonEmptyString(input.databaseId, "databaseId");
  const sourceReference = input.sourceReference;
  if (typeof sourceReference !== "object" || sourceReference === null || Array.isArray(sourceReference)) throw new TypeError("sourceReference is invalid.");
  const reference = sourceReference as Record<string, unknown>;
  if (reference.recordId !== documentId || reference.collectionPath !== documentPath || typeof reference.entityKind !== "string") throw new TypeError("sourceReference is incoherent.");
  const readProvenance = input.readProvenance;
  if (typeof readProvenance !== "object" || readProvenance === null || Array.isArray(readProvenance)) throw new TypeError("readProvenance is invalid.");
  const provenance = readProvenance as Record<string, unknown>;
  if (provenance.schemaVariant !== LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT
    || provenance.discoveryStrategyVersion !== LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION
    || provenance.readPurposeVersion !== LESSON_INVENTORY_READ_PURPOSE_VERSION
    || typeof provenance.pageIndex !== "number" || !Number.isInteger(provenance.pageIndex) || provenance.pageIndex < 0) {
    throw new TypeError("readProvenance is invalid.");
  }
  const projectedFields = validateProjectedFields(input.projectedFields);
  if (projectedFields.lessonId !== undefined && projectedFields.lessonId !== pathIdentity.lessonId) {
    throw new TypeError("projected lessonId does not match document path.");
  }
  if (projectedFields.levelId !== undefined && projectedFields.levelId !== pathIdentity.levelId) {
    throw new TypeError("projected levelId does not match document path.");
  }
  if (typedSurface === "NESTED_MODULE_LESSON"
    && projectedFields.moduleId !== undefined && projectedFields.moduleId !== pathIdentity.moduleId) {
    throw new TypeError("projected moduleId does not match document path.");
  }
  return Object.freeze({
    logicalSourceId,
    sourceSurface: typedSurface,
    projectId,
    databaseId,
    collectionPath,
    documentPath,
    documentId,
    projectedFields,
    sourceReference: Object.freeze({
      collectionPath: documentPath,
      entityKind: reference.entityKind,
      recordId: documentId,
    }),
    readProvenance: Object.freeze({
      schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
      discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
      readPurposeVersion: LESSON_INVENTORY_READ_PURPOSE_VERSION,
      pageIndex: provenance.pageIndex,
    }),
  });
};

export const validateLessonCollectionPage = (value: unknown): LessonCollectionPage => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("collection page must be an object.");
  const input = value as Record<string, unknown>;
  const documentsValue = input.documents;
  if (!Array.isArray(documentsValue)) throw new TypeError("collection page documents must be an array.");
  const documents = Object.freeze(documentsValue.map((document) => validateLessonListedDocument(document)));
  if (typeof input.returnedDocumentCount !== "number" || input.returnedDocumentCount !== documents.length) throw new TypeError("collection page count is invalid.");
  if (typeof input.requestIdentity !== "string" || input.requestIdentity.length === 0) throw new TypeError("requestIdentity is invalid.");
  if (typeof input.pageIndex !== "number" || !Number.isInteger(input.pageIndex) || input.pageIndex < 0) throw new TypeError("pageIndex is invalid.");
  const nextPageToken = validateLessonPageToken(input.nextPageToken);
  const readMetadata = input.readMetadata;
  if (typeof readMetadata !== "object" || readMetadata === null || Array.isArray(readMetadata)) throw new TypeError("readMetadata is invalid.");
  const metadata = readMetadata as Record<string, unknown>;
  const projectId = requireNonEmptyString(metadata.projectId, "readMetadata.projectId");
  const databaseId = requireNonEmptyString(metadata.databaseId, "readMetadata.databaseId");
  const sourceSurface = metadata.sourceSurface;
  if (!LESSON_SOURCE_SURFACES.includes(sourceSurface as LegacyLessonSourceSurface)) throw new TypeError("readMetadata.sourceSurface is invalid.");
  const collectionPath = validateLessonCollectionPath(metadata.collectionPath, sourceSurface as LegacyLessonSourceSurface);
  for (const document of documents) {
    if (document.projectId !== projectId
      || document.databaseId !== databaseId
      || document.sourceSurface !== sourceSurface
      || document.collectionPath !== collectionPath
      || document.readProvenance.pageIndex !== input.pageIndex) {
      throw new TypeError("collection page metadata is incoherent with listed documents.");
    }
  }
  return Object.freeze({
    requestIdentity: input.requestIdentity,
    documents,
    returnedDocumentCount: documents.length,
    nextPageToken,
    pageIndex: input.pageIndex,
    readMetadata: Object.freeze({ projectId, databaseId, collectionPath, sourceSurface: sourceSurface as LegacyLessonSourceSurface }),
  });
};

export const validateTerminalLessonCollectionPage = (value: unknown): LessonCollectionPage => {
  const page = validateLessonCollectionPage(value);
  if (page.nextPageToken !== null) throw new TypeError("a page with a continuation token is not terminal.");
  return page;
};

export const validateLessonCollectionReadFailure = (value: unknown): LessonCollectionReadFailure => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("collection read failure must be an object.");
  const input = value as Record<string, unknown>;
  if (!INVENTORY_FAILURE_CODES.includes(input.code as InventoryFailureCode)) throw new TypeError("failure code is invalid.");
  return Object.freeze({ code: input.code as InventoryFailureCode, message: requireNonEmptyString(input.message, "message") });
};

export const validateLessonCollectionReadResult = (value: unknown): LessonCollectionReadResult => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("collection read result must be an object.");
  const input = value as Record<string, unknown>;
  if (input.kind === "page") return Object.freeze({ kind: "page", page: validateLessonCollectionPage(input.page) });
  if (input.kind === "failure") return Object.freeze({ kind: "failure", failure: validateLessonCollectionReadFailure(input.failure) });
  throw new TypeError("collection read result kind is invalid.");
};

export const validateInventoryCompletenessState = (value: unknown): InventoryCompletenessState => {
  if (!INVENTORY_COMPLETENESS_STATES.includes(value as InventoryCompletenessState)) throw new TypeError("inventory completeness state is invalid.");
  return value as InventoryCompletenessState;
};
