import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION,
  MAX_REST_VALUE_NODE_COUNT_PAIR,
} from "../../functions/lib/migration/phase05FirestoreRestValuePolicy.js";
import {
  PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION,
} from "../../functions/lib/migration/phase05LessonUnknownFieldPolicy.js";
import {
  parsePhase05LessonInventoryDocument,
} from "../../functions/lib/migration/phase05LessonInventoryDocumentParser.js";

export const AUTHORIZATION_ENV = "PHASE05_A1_1_PAIRED_INVENTORY_READ_AUTHORIZATION";
export const AUTHORIZATION_VALUE = "phase05-a1-1-paired-inventory-read-v1";
export const STREAM_SIZE_MEASUREMENT_AUTHORIZATION_ENV = "PHASE05_A1_1_STREAM_SIZE_MEASUREMENT_AUTHORIZATION";
export const STREAM_SIZE_MEASUREMENT_AUTHORIZATION_VALUE = "phase05-a1-1-stream-size-measurement-v1";
export const QUOTA_PROJECT_ENV = "GOOGLE_CLOUD_QUOTA_PROJECT";
export const PROJECT_ID = "english-for-polish";
export const DATABASE_ID = "(default)";
export const LEVEL_ID = "A1";
export const LESSON_ID = "A1_1";
export const NESTED_MODULE_ID = "A1_M01_pruebaa1";
export const DIRECT_DOCUMENT_PATH = "levels/A1/lessons/A1_1";
export const NESTED_DOCUMENT_PATH = "levels/A1/modules/A1_M01_pruebaa1/lessons/A1_1";
export const DIRECT_RESPONSE_BYTE_LIMIT = 65536;
export const NESTED_RESPONSE_BYTE_LIMIT = 65536;
export const TOTAL_RESPONSE_BYTE_LIMIT = 131072;
export const DIAGNOSTIC_STREAM_MEASUREMENT_STOP_THRESHOLD_BYTES = 1048576;
export const MAX_PROVIDER_REQUESTS = 2;
export const MAX_LOGICAL_DOCUMENT_READS = 2;
export const MAX_QUERY_REQUESTS = 0;
export const MAX_INDEX_ENTRY_OPERATIONS = 0;
export const WRITES_MAX = 0;
export const RETRIES_MAX = 0;
export const REDIRECT_MODE = "error";
export const COMPLETENESS_LABEL = "PAIRED_EXACT_TARGETS_TESTED_KNOWN_NESTED_CANDIDATE_READ_GLOBAL_PARENT_SET_UNKNOWN";
export const PROVIDER_TRANSPORT = "TWO_INDEPENDENT_EXACT_REST_GETS";
export const POLICY_VERSIONS = Object.freeze({
  restValue: "phase05-firestore-rest-value-v1",
  unknownFields: "phase05-lesson-unknown-fields-v1",
});

export const DIRECT_RESOURCE_NAME = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${DIRECT_DOCUMENT_PATH}`;
export const NESTED_RESOURCE_NAME = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${NESTED_DOCUMENT_PATH}`;
export const DIRECT_ENDPOINT = `https://firestore.googleapis.com/v1/${DIRECT_RESOURCE_NAME}`;
export const NESTED_ENDPOINT = `https://firestore.googleapis.com/v1/${NESTED_RESOURCE_NAME}`;

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const APP_NAME = "phase05-a1-1-paired-inventory-read";

const safeFailure = (failureCode, stage, requestCount = 0, totalResponseBytes = 0, oversizeEvidence, streamSizeMeasurement) => Object.freeze({
  status: "FAILED",
  failureCode,
  stage,
  requestCount,
  totalResponseBytes,
  ...(failureCode === "PROVIDER_RESPONSE_TOO_LARGE" && oversizeEvidence
    ? { oversizeEvidence: Object.freeze(oversizeEvidence) }
    : {}),
  ...(failureCode === "PROVIDER_RESPONSE_TOO_LARGE" && streamSizeMeasurement
    ? { streamSizeMeasurement: Object.freeze(streamSizeMeasurement) }
    : {}),
  limits: Object.freeze({
    maxProviderRequests: MAX_PROVIDER_REQUESTS,
    maxLogicalDocumentReads: MAX_LOGICAL_DOCUMENT_READS,
    maxQueryRequests: MAX_QUERY_REQUESTS,
    maxIndexEntryOperations: MAX_INDEX_ENTRY_OPERATIONS,
    writes: WRITES_MAX,
    retries: RETRIES_MAX,
  }),
});

const emit = (runtime, result) => {
  try { (runtime.output ?? (() => {}))(result); } catch { /* Output never triggers another request. */ }
  return result;
};

const getAdminApi = (runtime) => {
  if (runtime.adminApi) return runtime.adminApi;
  const require = createRequire(path.join(repositoryRoot, "functions", "package.json"));
  return require("firebase-admin/app");
};

const cancelBody = async (response) => {
  try { await response?.body?.cancel?.(); } catch { /* No provider body or error escapes. */ }
};

const oversizedFailure = (oversizeEvidence, streamSizeMeasurement) => Object.assign(new Error(), {
  safeFailureCode: "PROVIDER_RESPONSE_TOO_LARGE",
  oversizeEvidence,
  streamSizeMeasurement,
});

const readBoundedBody = async (response, byteLimit, decode, { measureStreamSize = false } = {}) => {
  const declaredLength = response?.headers?.get?.("content-length");
  if (declaredLength !== null && declaredLength !== undefined) {
    if (!/^[0-9]+$/u.test(declaredLength)) throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_INVALID" });
    const exactDeclaredLength = BigInt(declaredLength);
    if (exactDeclaredLength > BigInt(byteLimit)) {
      await cancelBody(response);
      const oversizeEvidence = {
        mode: "DECLARED_CONTENT_LENGTH",
        responseByteLimit: byteLimit,
        ...(exactDeclaredLength <= BigInt(Number.MAX_SAFE_INTEGER)
          ? { declaredContentLengthBytes: Number(exactDeclaredLength) }
          : {}),
      };
      throw oversizedFailure(oversizeEvidence);
    }
  }
  if (!response?.body) return { byteLength: 0, text: "" };
  if (typeof response.body.getReader !== "function") throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_INVALID" });
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  const streamedOversizeEvidence = {
    mode: "STREAMED_RESPONSE_BODY",
    responseByteLimit: byteLimit,
    minimumObservedResponseBytesAtFailure: byteLimit + 1,
  };

  const measureOversizedStream = async (initialMeasuredResponseBytes) => {
    let measuredResponseBytes = initialMeasuredResponseBytes;
    const ceiling = DIAGNOSTIC_STREAM_MEASUREMENT_STOP_THRESHOLD_BYTES;

    if (measuredResponseBytes > ceiling) {
      try { await reader.cancel(); } catch { /* Never retry oversized responses. */ }
      throw oversizedFailure(streamedOversizeEvidence, {
        outcome: "DIAGNOSTIC_CEILING_EXCEEDED",
        minimumMeasuredResponseBytes: ceiling + 1,
        diagnosticHardCeilingBytes: ceiling,
      });
    }

    while (true) {
      let item;
      try {
        item = await reader.read();
      } catch {
        throw oversizedFailure(streamedOversizeEvidence, {
          outcome: "MEASUREMENT_INCOMPLETE",
          minimumMeasuredResponseBytes: measuredResponseBytes,
          diagnosticHardCeilingBytes: ceiling,
        });
      }
      if (item.done) {
        item = undefined;
        throw oversizedFailure(streamedOversizeEvidence, {
          outcome: "EXACT_TOTAL_MEASURED",
          measuredResponseBytes,
          diagnosticHardCeilingBytes: ceiling,
        });
      }
      let chunk = item.value;
      if (!(chunk instanceof Uint8Array)) {
        chunk = undefined;
        item = undefined;
        throw oversizedFailure(streamedOversizeEvidence, {
          outcome: "MEASUREMENT_INCOMPLETE",
          minimumMeasuredResponseBytes: measuredResponseBytes,
          diagnosticHardCeilingBytes: ceiling,
        });
      }
      const chunkByteLength = chunk.byteLength;
      if (!Number.isSafeInteger(chunkByteLength) || chunkByteLength < 0
        || chunkByteLength > Number.MAX_SAFE_INTEGER - measuredResponseBytes) {
        chunk = undefined;
        item = undefined;
        throw oversizedFailure(streamedOversizeEvidence, {
          outcome: "MEASUREMENT_INCOMPLETE",
          minimumMeasuredResponseBytes: measuredResponseBytes,
          diagnosticHardCeilingBytes: ceiling,
        });
      }
      const exceedsCeiling = chunkByteLength > ceiling - measuredResponseBytes;
      if (!exceedsCeiling) measuredResponseBytes += chunkByteLength;
      chunk = undefined;
      item = undefined;
      if (exceedsCeiling) {
        try { await reader.cancel(); } catch { /* Never retry oversized responses. */ }
        throw oversizedFailure(streamedOversizeEvidence, {
          outcome: "DIAGNOSTIC_CEILING_EXCEEDED",
          minimumMeasuredResponseBytes: ceiling + 1,
          diagnosticHardCeilingBytes: ceiling,
        });
      }
    }
  };

  try {
    while (true) {
      let readResult = await reader.read();
      if (readResult.done) {
        readResult = undefined;
        break;
      }
      let value = readResult.value;
      if (!(value instanceof Uint8Array)) {
        value = undefined;
        readResult = undefined;
        throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_INVALID" });
      }
      const chunkByteLength = value.byteLength;
      if (!Number.isSafeInteger(chunkByteLength) || chunkByteLength < 0
        || chunkByteLength > Number.MAX_SAFE_INTEGER - total) {
        chunks.length = 0;
        value = undefined;
        readResult = undefined;
        try { await reader.cancel(); } catch { /* Never retry oversized responses. */ }
        throw oversizedFailure(streamedOversizeEvidence);
      }
      const nextTotal = total + chunkByteLength;
      if (chunkByteLength > byteLimit - total) {
        chunks.length = 0;
        value = undefined;
        readResult = undefined;
        if (measureStreamSize) await measureOversizedStream(nextTotal);
        try { await reader.cancel(); } catch { /* Never retry oversized responses. */ }
        throw oversizedFailure(streamedOversizeEvidence);
      }
      total = nextTotal;
      if (decode) chunks.push(value);
      value = undefined;
      readResult = undefined;
    }
  } finally {
    try { reader.releaseLock(); } catch { /* No response details are exposed. */ }
  }
  if (!decode) return { byteLength: total, text: "" };
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { byteLength: total, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_INVALID" });
  }
};

const makeContext = (nested) => {
  const sourceSurface = nested ? "NESTED_MODULE_LESSON" : "DIRECT_LEVEL_LESSON";
  const sourceKind = nested ? "level_module_lesson" : "level_lesson";
  const logicalSourceId = nested ? "legacy.level_module_lesson" : "legacy.level_lesson";
  const expectedDocumentPath = nested ? NESTED_DOCUMENT_PATH : DIRECT_DOCUMENT_PATH;
  const expectedDocumentName = nested ? NESTED_RESOURCE_NAME : DIRECT_RESOURCE_NAME;
  return Object.freeze({
    sourceSurface,
    expectedLevelId: LEVEL_ID,
    expectedLessonId: LESSON_ID,
    expectedModuleId: nested ? NESTED_MODULE_ID : null,
    expectedDocumentPath,
    expectedDocumentName,
    sourceReference: Object.freeze({
      collectionPath: expectedDocumentPath,
      entityKind: sourceKind,
      recordId: LESSON_ID,
    }),
    logicalSourceId,
    sourceKind,
    schemaVariant: "legacy-v1",
    discoveryStrategyVersion: "phase05-source-discovery-v1",
    restValuePolicyVersion: PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION,
    unknownFieldPolicyVersion: PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION,
  });
};

const versionCheck = (expectedPolicyVersions = POLICY_VERSIONS) => expectedPolicyVersions !== null
  && typeof expectedPolicyVersions === "object"
  && PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION === expectedPolicyVersions.restValue
  && PHASE05_LESSON_UNKNOWN_FIELD_POLICY_VERSION === expectedPolicyVersions.unknownFields;

const parseFoundResponse = (text, nested) => {
  let document;
  try { document = JSON.parse(text); } catch { return { ok: false, failureCode: "MALFORMED_PROVIDER_RESPONSE" }; }
  const parsed = parsePhase05LessonInventoryDocument(document, makeContext(nested));
  return parsed.ok ? { ok: true, record: parsed.record, valueNodeCount: parsed.valueNodeCount } : parsed;
};

const fetchTarget = async ({ runtime, endpoint, nested, token, requestCount, totalResponseBytes, measureStreamSize }) => {
  const fetchFn = runtime.fetch ?? globalThis.fetch;
  if (typeof fetchFn !== "function") return { ok: false, result: safeFailure("PROVIDER_FETCH_FAILED", nested ? "NESTED_GET" : "DIRECT_GET", requestCount, totalResponseBytes) };
  let response;
  try {
    response = await fetchFn(endpoint, {
      method: "GET",
      redirect: REDIRECT_MODE,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-goog-user-project": PROJECT_ID,
      },
    });
  } catch {
    return { ok: false, result: safeFailure("PROVIDER_FETCH_FAILED", nested ? "NESTED_GET" : "DIRECT_GET", requestCount, totalResponseBytes) };
  }
  if (response?.status !== 200 && response?.status !== 404) {
    await cancelBody(response);
    return { ok: false, result: safeFailure("PROVIDER_HTTP_STATUS_UNEXPECTED", nested ? "NESTED_GET" : "DIRECT_GET", requestCount, totalResponseBytes) };
  }
  const byteLimit = nested ? NESTED_RESPONSE_BYTE_LIMIT : DIRECT_RESPONSE_BYTE_LIMIT;
  let body;
  try {
    body = await readBoundedBody(response, byteLimit, response.status === 200, { measureStreamSize });
  } catch (error) {
    const failureCode = error?.safeFailureCode ?? "PROVIDER_RESPONSE_INVALID";
    return { ok: false, result: safeFailure(
      failureCode,
      nested ? "NESTED_GET" : "DIRECT_GET",
      requestCount,
      totalResponseBytes,
      failureCode === "PROVIDER_RESPONSE_TOO_LARGE" ? error?.oversizeEvidence : undefined,
      failureCode === "PROVIDER_RESPONSE_TOO_LARGE" ? error?.streamSizeMeasurement : undefined,
    ) };
  }
  const nextTotal = totalResponseBytes + body.byteLength;
  if (nextTotal > TOTAL_RESPONSE_BYTE_LIMIT) {
    return { ok: false, result: safeFailure("PROVIDER_RESPONSE_TOO_LARGE", nested ? "NESTED_GET" : "DIRECT_GET", requestCount, nextTotal, {
      mode: "PAIR_TOTAL_RESPONSE_BYTES",
      pairObservedResponseBytes: nextTotal,
      pairResponseByteLimit: TOTAL_RESPONSE_BYTE_LIMIT,
    }) };
  }
  if (response.status === 404) return { ok: true, result: { result: "MISSING", target: nested ? NESTED_DOCUMENT_PATH : DIRECT_DOCUMENT_PATH }, byteLength: body.byteLength, totalResponseBytes: nextTotal, valueNodeCount: 0 };
  const parsed = parseFoundResponse(body.text, nested);
  if (!parsed.ok) {
    const failureCode = parsed.failureCode === "PROVIDER_RESOURCE_IDENTITY_MISMATCH"
      ? parsed.failureCode
      : "MALFORMED_PROVIDER_RESPONSE";
    return { ok: false, result: safeFailure(failureCode, nested ? "NESTED_DOCUMENT_VALIDATION" : "DIRECT_DOCUMENT_VALIDATION", requestCount, nextTotal) };
  }
  return {
    ok: true,
    result: { result: "FOUND", target: nested ? NESTED_DOCUMENT_PATH : DIRECT_DOCUMENT_PATH, inventory: parsed.record },
    byteLength: body.byteLength,
    totalResponseBytes: nextTotal,
    valueNodeCount: parsed.valueNodeCount,
  };
};

const runWithExpectedPolicyVersions = async (runtime = {}, expectedPolicyVersions = POLICY_VERSIONS) => {
  const env = runtime.env ?? process.env;
  const args = runtime.args ?? [];
  if (!Array.isArray(args) || args.length !== 0) return emit(runtime, safeFailure("UNEXPECTED_ARGUMENTS", "ARGUMENT_GUARD"));
  if (PROJECT_ID !== "english-for-polish" || DATABASE_ID !== "(default)" || LEVEL_ID !== "A1"
    || LESSON_ID !== "A1_1" || NESTED_MODULE_ID !== "A1_M01_pruebaa1"
    || DIRECT_ENDPOINT !== `https://firestore.googleapis.com/v1/${DIRECT_RESOURCE_NAME}`
    || NESTED_ENDPOINT !== `https://firestore.googleapis.com/v1/${NESTED_RESOURCE_NAME}`) {
    return emit(runtime, safeFailure("TARGET_CONFIGURATION_INVALID", "TARGET_GUARD"));
  }
  if (!versionCheck(expectedPolicyVersions)) return emit(runtime, safeFailure("POLICY_VERSION_MISMATCH", "POLICY_VERSION_GUARD"));
  if (env[AUTHORIZATION_ENV] !== AUTHORIZATION_VALUE) return emit(runtime, safeFailure("AUTHORIZATION_NOT_ARMED", "AUTHORIZATION_GUARD"));
  if (env[QUOTA_PROJECT_ENV] !== PROJECT_ID) return emit(runtime, safeFailure("QUOTA_PROJECT_MISMATCH", "QUOTA_GUARD"));
  if (typeof env.GOOGLE_APPLICATION_CREDENTIALS === "string" && env.GOOGLE_APPLICATION_CREDENTIALS.length > 0) {
    return emit(runtime, safeFailure("CREDENTIAL_ENVIRONMENT_REJECTED", "CREDENTIAL_GUARD"));
  }
  const diagnosticAuthorization = env[STREAM_SIZE_MEASUREMENT_AUTHORIZATION_ENV];
  const diagnosticAuthorizationIsPresent = diagnosticAuthorization !== undefined
    && diagnosticAuthorization !== null
    && diagnosticAuthorization !== "";
  if (diagnosticAuthorizationIsPresent && diagnosticAuthorization !== STREAM_SIZE_MEASUREMENT_AUTHORIZATION_VALUE) {
    return emit(runtime, safeFailure("DIAGNOSTIC_AUTHORIZATION_INVALID", "DIAGNOSTIC_AUTHORIZATION_GUARD"));
  }
  const measureNestedStreamSize = diagnosticAuthorization === STREAM_SIZE_MEASUREMENT_AUTHORIZATION_VALUE;

  let app;
  let ownsApp = false;
  let requestCount = 0;
  let totalResponseBytes = 0;
  let valueNodeCount = 0;
  try {
    const admin = getAdminApi(runtime);
    const credential = (runtime.applicationDefault ?? admin.applicationDefault)();
    if (!credential || typeof credential.getAccessToken !== "function") {
      return emit(runtime, safeFailure("TOKEN_ACQUISITION_FAILED", "ADC"));
    }
    if ((runtime.getApps ?? admin.getApps)().some((candidate) => candidate?.name === APP_NAME)) {
      return emit(runtime, safeFailure("APP_NAME_COLLISION", "ADMIN_APP_INITIALIZATION"));
    }
    app = await (runtime.initializeApp ?? admin.initializeApp)({ credential, projectId: PROJECT_ID }, APP_NAME);
    ownsApp = true;
    const access = await credential.getAccessToken();
    const token = access?.access_token;
    if (typeof token !== "string" || token.length === 0) return emit(runtime, safeFailure("TOKEN_ACQUISITION_FAILED", "TOKEN_ACQUISITION"));

    requestCount += 1;
    const direct = await fetchTarget({ runtime, endpoint: DIRECT_ENDPOINT, nested: false, token, requestCount, totalResponseBytes, measureStreamSize: false });
    if (!direct.ok) return emit(runtime, direct.result);
    totalResponseBytes = direct.totalResponseBytes;
    valueNodeCount += direct.valueNodeCount;

    requestCount += 1;
    const nested = await fetchTarget({ runtime, endpoint: NESTED_ENDPOINT, nested: true, token, requestCount, totalResponseBytes, measureStreamSize: measureNestedStreamSize });
    if (!nested.ok) return emit(runtime, nested.result);
    totalResponseBytes = nested.totalResponseBytes;
    valueNodeCount += nested.valueNodeCount;
    if (valueNodeCount > MAX_REST_VALUE_NODE_COUNT_PAIR) {
      return emit(runtime, safeFailure("REST_VALUE_NODE_COUNT_EXCEEDED", "PAIR_VALIDATION", requestCount, totalResponseBytes));
    }

    const directResult = direct.result;
    const nestedResult = nested.result;
    const pairedClassification = `${directResult.result === "FOUND" ? "DIRECT_FOUND" : "DIRECT_MISSING"}_${nestedResult.result === "FOUND" ? "NESTED_FOUND" : "NESTED_MISSING"}`;
    return emit(runtime, Object.freeze({
      status: "SUCCESS",
      providerTransport: PROVIDER_TRANSPORT,
      projectId: PROJECT_ID,
      databaseId: DATABASE_ID,
      levelId: LEVEL_ID,
      lessonId: LESSON_ID,
      directTarget: DIRECT_DOCUMENT_PATH,
      nestedTarget: NESTED_DOCUMENT_PATH,
      directResult,
      nestedResult,
      pairedClassification,
      completeness: COMPLETENESS_LABEL,
      policyVersions: POLICY_VERSIONS,
      requestCount,
      totalResponseBytes,
      limits: Object.freeze({
        maxProviderRequests: MAX_PROVIDER_REQUESTS,
        maxLogicalDocumentReads: MAX_LOGICAL_DOCUMENT_READS,
        maxQueryRequests: MAX_QUERY_REQUESTS,
        maxIndexEntryOperations: MAX_INDEX_ENTRY_OPERATIONS,
        writes: WRITES_MAX,
        retries: RETRIES_MAX,
        directResponseByteLimit: DIRECT_RESPONSE_BYTE_LIMIT,
        nestedResponseByteLimit: NESTED_RESPONSE_BYTE_LIMIT,
        totalResponseByteLimit: TOTAL_RESPONSE_BYTE_LIMIT,
        missingDocumentBillingMinimum: "UNPROVEN",
      }),
    }));
  } catch (error) {
    return emit(runtime, safeFailure(error?.safeFailureCode ?? "PROVIDER_FETCH_FAILED", "PROVIDER_EXECUTION", requestCount, totalResponseBytes));
  } finally {
    if (ownsApp) {
      try {
        const admin = getAdminApi(runtime);
        await (runtime.deleteApp ?? admin.deleteApp)(app);
      } catch {
        // Cleanup failure is not allowed to expose provider or credential details.
      }
    }
  }
};

export const runPhase05A1_1PairedInventoryRead = (runtime = {}) =>
  runWithExpectedPolicyVersions(runtime, POLICY_VERSIONS);

export const runPhase05A1_1PairedInventoryReadForTest = (runtime, expectedPolicyVersions) =>
  runWithExpectedPolicyVersions(runtime, expectedPolicyVersions);

const isDirectExecution = () => typeof process.argv[1] === "string"
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution()) {
  const output = (result) => process.stdout.write(`${JSON.stringify(result)}\n`);
  if (process.argv.length !== 2) {
    output(safeFailure("UNEXPECTED_ARGUMENTS", "ARGUMENT_GUARD"));
    process.exitCode = 1;
  } else {
    runPhase05A1_1PairedInventoryRead({ env: process.env, args: [], output })
      .then((result) => { if (result.status !== "SUCCESS") process.exitCode = 1; })
      .catch(() => {
        output(safeFailure("PROVIDER_FETCH_FAILED", "PROVIDER_EXECUTION"));
        process.exitCode = 1;
      });
  }
}
