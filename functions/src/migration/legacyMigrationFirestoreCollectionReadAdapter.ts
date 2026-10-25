import { createHash } from "node:crypto";
import { TextDecoder } from "node:util";
import {
  DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  DIRECT_LEGACY_LESSON_SOURCE_KIND,
  LESSON_INITIAL_FIELD_PROJECTION,
  LESSON_INVENTORY_READ_PURPOSE_VERSION,
  NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
  NESTED_LEGACY_LESSON_SOURCE_KIND,
  deriveLessonCollectionReadRequestIdentity,
  validateDirectLessonDocumentPath,
  validateLessonCollectionPage,
  validateLessonCollectionReadRequest,
  validateNestedLessonDocumentPath,
  type InventoryFailureCode,
  type LessonCollectionReadRequest,
  type LessonCollectionReadResult,
  type LessonProjectedFields,
} from "./legacyLessonSourceDiscoveryContracts.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
} from "./legacyMigrationSourceDiscovery.js";
import type { LegacyMigrationCollectionReadPort } from "./legacyMigrationReadPorts.js";
import { LegacyMigrationDryRunError } from "./legacyMigrationDryRunOrchestrator.js";

export const LEGACY_MIGRATION_LESSON_COLLECTION_PAGE_TOKEN_VERSION = "lesson-collection-page-v1" as const;

export type LegacyMigrationFirestoreCollectionRawDocument = Readonly<{
  id: string;
  path: string;
  data: unknown;
}>;

export type LegacyMigrationFirestoreCollectionPageQueryInput = Readonly<{
  projectId: string;
  databaseId: string;
  collectionPath: string;
  fieldProjection: readonly string[];
  pageSize: number;
  startAfterDocumentId: string | null;
  order: "DOCUMENT_PATH_ASC";
}>;

export type LegacyMigrationFirestoreCollectionReadDependency = Readonly<{
  runCollectionPageQuery: (
    input: LegacyMigrationFirestoreCollectionPageQueryInput,
  ) => Promise<readonly LegacyMigrationFirestoreCollectionRawDocument[]>;
}>;

export type LegacyMigrationFirestoreCollectionReadAdapterInput = Readonly<{
  dependency: LegacyMigrationFirestoreCollectionReadDependency;
  selectedProjectId: string;
  selectedDatabaseId: string;
}>;

export type LegacyMigrationFirestoreCollectionReadAdapter = LegacyMigrationCollectionReadPort;

type LessonCollectionPageTokenPayload = Readonly<{
  version: typeof LEGACY_MIGRATION_LESSON_COLLECTION_PAGE_TOKEN_VERSION;
  paginationScopeId: string;
  lastDocumentId: string;
  lastDocumentPath: string;
  pageIndex: number;
  checksum: string;
}>;

const TOKEN_KEYS = Object.freeze([
  "version",
  "paginationScopeId",
  "lastDocumentId",
  "lastDocumentPath",
  "pageIndex",
  "checksum",
] as const);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();

const sha256 = (value: string): string => createHash("sha256").update(value, "utf8").digest("hex");

const encodeBase64Url = (value: string): string => Buffer.from(value, "utf8").toString("base64url");

const strictUtf8Decoder = new TextDecoder("utf-8", { fatal: true });

const decodeBase64Url = (value: string): string => {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error("page token encoding is invalid.");
  const decoded = strictUtf8Decoder.decode(Buffer.from(value, "base64url"));
  if (encodeBase64Url(decoded) !== value) throw new Error("page token encoding is not canonical.");
  return decoded;
};

const tokenWithoutChecksum = (payload: Readonly<{
  version: typeof LEGACY_MIGRATION_LESSON_COLLECTION_PAGE_TOKEN_VERSION;
  paginationScopeId: string;
  lastDocumentId: string;
  lastDocumentPath: string;
  pageIndex: number;
}>): string => JSON.stringify(payload);

const paginationScopeInput = (request: LessonCollectionReadRequest) => ({
  logicalSourceId: request.logicalSourceId,
  sourceSurface: request.sourceSurface,
  projectId: request.projectId,
  databaseId: request.databaseId,
  collectionPath: request.collectionPath,
  fieldProjection: [...request.fieldProjection],
  pageSize: request.pageSize,
  maxPages: request.maxPages,
  maxDocuments: request.maxDocuments,
  order: request.order,
  schemaVariant: request.schemaVariant,
  discoveryStrategyVersion: request.discoveryStrategyVersion,
  readPurposeVersion: request.readPurposeVersion,
});

export const deriveLessonCollectionPaginationScopeId = (
  request: LessonCollectionReadRequest,
): string => sha256(JSON.stringify(paginationScopeInput(request)));

const encodePageToken = (input: Readonly<{
  paginationScopeId: string;
  lastDocumentId: string;
  lastDocumentPath: string;
  pageIndex: number;
}>): string => {
  const unsigned = {
    version: LEGACY_MIGRATION_LESSON_COLLECTION_PAGE_TOKEN_VERSION,
    paginationScopeId: input.paginationScopeId,
    lastDocumentId: input.lastDocumentId,
    lastDocumentPath: input.lastDocumentPath,
    pageIndex: input.pageIndex,
  } as const;
  const payload: LessonCollectionPageTokenPayload = {
    ...unsigned,
    checksum: sha256(tokenWithoutChecksum(unsigned)),
  };
  return encodeBase64Url(JSON.stringify(payload));
};

const hasExactTokenKeys = (value: Record<string, unknown>): boolean => {
  const keys = Object.keys(value).sort();
  return keys.length === TOKEN_KEYS.length && keys.every((key, index) => key === [...TOKEN_KEYS].sort()[index]);
};

const decodePageToken = (
  request: LessonCollectionReadRequest,
  token: string,
): Readonly<{ lastDocumentId: string; lastDocumentPath: string; pageIndex: number }> => {
  const encodedPayload = decodeBase64Url(token);
  const decoded = JSON.parse(encodedPayload) as unknown;
  if (!isRecord(decoded) || !hasExactTokenKeys(decoded)
    || decoded.version !== LEGACY_MIGRATION_LESSON_COLLECTION_PAGE_TOKEN_VERSION
    || !nonEmpty(decoded.paginationScopeId)
    || !nonEmpty(decoded.lastDocumentId)
    || !nonEmpty(decoded.lastDocumentPath)
    || typeof decoded.pageIndex !== "number"
    || !Number.isFinite(decoded.pageIndex)
    || !Number.isInteger(decoded.pageIndex)
    || !Number.isSafeInteger(decoded.pageIndex)
    || decoded.pageIndex < 1
    || !/^[a-f0-9]{64}$/u.test(decoded.checksum as string)) {
    throw new Error("page token payload is invalid.");
  }
  const unsigned = {
    version: decoded.version,
    paginationScopeId: decoded.paginationScopeId,
    lastDocumentId: decoded.lastDocumentId,
    lastDocumentPath: decoded.lastDocumentPath,
    pageIndex: decoded.pageIndex,
  } as const;
  const canonicalPayload = JSON.stringify({ ...unsigned, checksum: decoded.checksum });
  if (encodedPayload !== canonicalPayload) throw new Error("page token JSON is not canonical.");
  if (sha256(tokenWithoutChecksum(unsigned)) !== decoded.checksum) {
    throw new Error("page token checksum is invalid.");
  }
  if (decoded.paginationScopeId !== deriveLessonCollectionPaginationScopeId(request)) {
    throw new Error("page token scope does not match the request.");
  }
  const expectedPath = `${request.collectionPath}/${decoded.lastDocumentId}`;
  if (decoded.lastDocumentPath !== expectedPath) throw new Error("page token document path is invalid.");
  if (request.sourceSurface === "DIRECT_LEVEL_LESSON") {
    validateDirectLessonDocumentPath({
      documentPath: decoded.lastDocumentPath,
      documentId: decoded.lastDocumentId,
      logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
      sourceSurface: request.sourceSurface,
    });
  } else {
    validateNestedLessonDocumentPath({
      documentPath: decoded.lastDocumentPath,
      documentId: decoded.lastDocumentId,
      logicalSourceId: NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
      sourceSurface: request.sourceSurface,
    });
  }
  return {
    lastDocumentId: decoded.lastDocumentId,
    lastDocumentPath: decoded.lastDocumentPath,
    pageIndex: decoded.pageIndex,
  };
};

const failure = (code: InventoryFailureCode, message: string): LessonCollectionReadResult => ({
  kind: "failure",
  failure: { code, message },
});

const providerErrorCode = (error: unknown): unknown =>
  isRecord(error) ? error.code ?? error.status : undefined;

const normalizeProviderError = (error: unknown): LessonCollectionReadResult => {
  const code = providerErrorCode(error);
  const text = typeof code === "string" ? code.toLowerCase() : "";
  if (code === 7 || text === "7" || text.includes("permission-denied") || text.includes("permission_denied")) {
    return failure("PERMISSION_DENIED", "The Firestore collection read was denied.");
  }
  if (code === 14 || text === "14" || text.includes("unavailable")) {
    return failure("PROVIDER_UNAVAILABLE", "The Firestore provider was unavailable.");
  }
  if (code === 5 || text === "5" || text.includes("not-found") || text.includes("not_found")) {
    return failure("NOT_FOUND", "The Firestore collection target was not found.");
  }
  return failure("PROVIDER_READ_FAILED", "The Firestore collection read failed.");
};

const scalar = (value: unknown): value is string | number | boolean | null =>
  value === null || typeof value === "string" || typeof value === "boolean"
  || (typeof value === "number" && Number.isFinite(value));

const isPlainProviderDataRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
};

const normalizeProjectedFields = (
  data: unknown,
): LessonProjectedFields => {
  if (!isPlainProviderDataRecord(data)) throw new Error("provider projected data is not a plain record.");
  const projection = new Set<string>(LESSON_INITIAL_FIELD_PROJECTION);
  if (Object.keys(data).some((key) => !projection.has(key))) {
    throw new Error("provider returned a field outside the approved projection.");
  }
  const result: Record<string, string | number | boolean | null> = {};
  for (const field of LESSON_INITIAL_FIELD_PROJECTION) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    const value = data[field];
    if (!scalar(value)) throw new Error(`provider projected field '${field}' is not a supported scalar.`);
    result[field] = value;
  }
  return Object.freeze(result) as LessonProjectedFields;
};

const normalizeDocument = (
  request: LessonCollectionReadRequest,
  raw: LegacyMigrationFirestoreCollectionRawDocument,
  pageIndex: number,
) => {
  if (!nonEmpty(raw.id) || !nonEmpty(raw.path) || raw.path !== `${request.collectionPath}/${raw.id}`) {
    throw new Error("provider document path is incoherent.");
  }
  if (request.sourceSurface === "DIRECT_LEVEL_LESSON") {
    validateDirectLessonDocumentPath({
      documentPath: raw.path,
      documentId: raw.id,
      logicalSourceId: DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
      sourceSurface: request.sourceSurface,
    });
  } else {
    validateNestedLessonDocumentPath({
      documentPath: raw.path,
      documentId: raw.id,
      logicalSourceId: NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID,
      sourceSurface: request.sourceSurface,
    });
  }
  const projectedFields = normalizeProjectedFields(raw.data);
  return {
    logicalSourceId: request.logicalSourceId,
    sourceSurface: request.sourceSurface,
    projectId: request.projectId,
    databaseId: request.databaseId,
    collectionPath: request.collectionPath,
    documentPath: raw.path,
    documentId: raw.id,
    projectedFields,
    sourceReference: {
      collectionPath: raw.path,
      entityKind: request.sourceSurface === "DIRECT_LEVEL_LESSON" ? DIRECT_LEGACY_LESSON_SOURCE_KIND : NESTED_LEGACY_LESSON_SOURCE_KIND,
      recordId: raw.id,
    },
    readProvenance: {
      schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
      discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
      readPurposeVersion: LESSON_INVENTORY_READ_PURPOSE_VERSION,
      pageIndex,
    },
  };
};

const normalizeRequest = (value: unknown): LessonCollectionReadRequest => validateLessonCollectionReadRequest(value);

export const createLegacyMigrationFirestoreCollectionReadAdapter = (
  input: LegacyMigrationFirestoreCollectionReadAdapterInput,
): LegacyMigrationFirestoreCollectionReadAdapter => {
  if (typeof input?.dependency?.runCollectionPageQuery !== "function") {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "Collection read dependency is missing runCollectionPageQuery.");
  }
  if (!nonEmpty(input.selectedProjectId) || !nonEmpty(input.selectedDatabaseId)) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "Collection read provider binding is incomplete.");
  }
  return Object.freeze({
    listDocuments: async (value: LessonCollectionReadRequest): Promise<LessonCollectionReadResult> => {
      let request: LessonCollectionReadRequest;
      try {
        request = normalizeRequest(value);
        if (request.projectId !== input.selectedProjectId || request.databaseId !== input.selectedDatabaseId) {
          return failure("PROVIDER_BINDING_MISMATCH", "The collection request does not match the selected provider binding.");
        }
      } catch {
        return failure("INVALID_REQUEST", "The collection read request is invalid.");
      }

      let cursor: Readonly<{ lastDocumentId: string; lastDocumentPath: string; pageIndex: number }> | null = null;
      if (request.pageToken !== null && request.pageToken !== undefined) {
        try {
          cursor = decodePageToken(request, request.pageToken);
        } catch {
          return failure("INVALID_REQUEST", "The collection page token is invalid.");
        }
      }
      const pageIndex = cursor?.pageIndex ?? 0;
      const providerLimit = Math.min(request.pageSize, request.maxDocuments);
      let documents: readonly LegacyMigrationFirestoreCollectionRawDocument[];
      try {
        documents = await input.dependency.runCollectionPageQuery({
          projectId: request.projectId,
          databaseId: request.databaseId,
          collectionPath: request.collectionPath,
          fieldProjection: request.fieldProjection,
          pageSize: providerLimit,
          startAfterDocumentId: cursor?.lastDocumentId ?? null,
          order: "DOCUMENT_PATH_ASC",
        });
      } catch (error) {
        return normalizeProviderError(error);
      }
      if (!Array.isArray(documents) || documents.length > providerLimit) {
        return failure("MALFORMED_PROVIDER_RESPONSE", "The provider returned an invalid collection page.");
      }
      try {
        const normalizedDocuments = documents.map((document) => normalizeDocument(request, document, pageIndex));
        const last = normalizedDocuments[normalizedDocuments.length - 1];
        const nextPageIndex = pageIndex + 1;
        if (documents.length === providerLimit && last !== undefined && !Number.isSafeInteger(nextPageIndex)) {
          return failure("MALFORMED_PROVIDER_RESPONSE", "The provider page index cannot be advanced safely.");
        }
        const nextPageToken = documents.length === providerLimit && last !== undefined
          ? encodePageToken({
            paginationScopeId: deriveLessonCollectionPaginationScopeId(request),
            lastDocumentId: last.documentId,
            lastDocumentPath: last.documentPath,
            pageIndex: nextPageIndex,
          })
          : null;
        const page = validateLessonCollectionPage({
          requestIdentity: deriveLessonCollectionReadRequestIdentity(request),
          documents: normalizedDocuments,
          returnedDocumentCount: normalizedDocuments.length,
          nextPageToken,
          pageIndex,
          readMetadata: {
            projectId: request.projectId,
            databaseId: request.databaseId,
            collectionPath: request.collectionPath,
            sourceSurface: request.sourceSurface,
          },
        });
        return { kind: "page", page };
      } catch {
        return failure("MALFORMED_PROVIDER_RESPONSE", "The provider returned malformed lesson data.");
      }
    },
  });
};

export const isLessonCollectionSource = (logicalSourceId: string): boolean =>
  logicalSourceId === DIRECT_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID
  || logicalSourceId === NESTED_LEGACY_LESSON_SOURCE_DESCRIPTOR_ID;
