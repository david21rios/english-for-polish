import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

export const AUTHORIZATION_ENV = "PHASE05_A1_1_RETURNED_MODULE_POINT_READ_AUTHORIZATION";
export const AUTHORIZATION_VALUE = "phase05-a1-1-returned-module-point-read-v1";
export const QUOTA_PROJECT_ENV = "GOOGLE_CLOUD_QUOTA_PROJECT";
export const PROJECT_ID = "english-for-polish";
export const DATABASE_ID = "(default)";
export const LEVEL_ID = "A1";
export const LESSON_ID = "A1_1";
export const CANDIDATE_MODULE_IDS = Object.freeze([
  "A1_M01_pruebaa1",
  "A1_M02_my_world",
  "A1_M03_daily_life",
  "A1_M04_around_me",
]);
export const CANDIDATE_COUNT = 4;
export const PROJECTED_FIELDS = Object.freeze(["lessonId"]);
export const FIELD_PROJECTION_COUNT = 1;
export const PER_RESPONSE_BYTE_LIMIT = 65536;
export const TOTAL_RESPONSE_BYTES_MAX = 262144;
export const HTTP_FETCHES_MAX = 4;
export const LOGICAL_DOCUMENT_READS_MAX = 4;
export const POINT_READS_MAX = 4;
export const QUERY_REQUESTS_MAX = 0;
export const PAGES_MAX = 0;
export const RETRIES_MAX = 0;
export const WRITES_MAX = 0;
export const REDIRECT_MODE = "error";
export const DATABASE_EDITION = "STANDARD";
export const MAX_BILLABLE_DOCUMENT_READS = 4;
export const INDEX_ENTRY_READ_OPERATIONS_MAX = 0;
export const MISSING_POINT_READ_BILLING_MINIMUM = "UNPROVEN";
export const COMPLETENESS_LABEL = "RETURNED_MODULE_CANDIDATES_COMPLETE_GLOBAL_PARENT_SET_UNKNOWN";
export const PROVIDER_TRANSPORT = "REST_EXACT_DOCUMENT_GET_SEQUENCE";
export const APP_NAME = "phase05-a1-1-returned-module-point-read";

const safeFailure = (failureCode, extra = {}) => ({
  status: "FAILED",
  failureCode,
  ...extra,
});

const emit = (runtime, result) => {
  try { (runtime.output ?? (() => {}))(result); } catch { /* Output must never trigger another request. */ }
  return result;
};

const getCandidate = (moduleId) => {
  const documentPath = `levels/${LEVEL_ID}/modules/${moduleId}/lessons/${LESSON_ID}`;
  const resourceName = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${documentPath}`;
  const endpoint = `https://firestore.googleapis.com/v1/${resourceName}?mask.fieldPaths=${PROJECTED_FIELDS[0]}`;
  return Object.freeze({ moduleId, documentPath, resourceName, endpoint });
};

export const CANDIDATES = Object.freeze(CANDIDATE_MODULE_IDS.map(getCandidate));

const isWithinRepository = (candidate, repositoryRoot, pathApi) => {
  const relative = pathApi.relative(repositoryRoot, candidate);
  const comparable = pathApi.sep === "\\" ? relative.toLowerCase() : relative;
  return comparable === "" || (!pathApi.isAbsolute(relative)
    && comparable !== ".."
    && !comparable.startsWith(`..${pathApi.sep}`));
};

export const inspectCredentialEnvironment = ({
  env,
  repositoryRoot,
  pathApi = path,
  fileExists = fs.existsSync,
  realpath = (value) => fs.realpathSync.native(value),
}) => {
  const configuredPath = env?.GOOGLE_APPLICATION_CREDENTIALS;
  if (configuredPath === undefined || configuredPath === "") {
    return { ok: true, result: "DEFAULT_ADC_ALLOWED" };
  }
  if (typeof configuredPath !== "string" || configuredPath.trim() === "") {
    return { ok: false, failureCode: "CREDENTIAL_ENVIRONMENT_REJECTED" };
  }
  try {
    const absoluteConfiguredPath = pathApi.isAbsolute(configuredPath)
      ? pathApi.resolve(configuredPath)
      : pathApi.resolve(repositoryRoot, configuredPath);
    if (!fileExists(absoluteConfiguredPath)) {
      return { ok: false, failureCode: "CREDENTIAL_ENVIRONMENT_REJECTED" };
    }
    const resolvedRoot = realpath(repositoryRoot);
    const resolvedCredential = realpath(absoluteConfiguredPath);
    if (isWithinRepository(resolvedCredential, resolvedRoot, pathApi)) {
      return { ok: false, failureCode: "CREDENTIAL_ENVIRONMENT_REJECTED" };
    }
    return { ok: true, result: "EXTERNAL_CREDENTIAL_PATH_ALLOWED" };
  } catch {
    return { ok: false, failureCode: "CREDENTIAL_ENVIRONMENT_REJECTED" };
  }
};

const getRepositoryRoot = () => path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const readBoundedBody = async (response, { decode = true, allowEmptyBody = false } = {}) => {
  if (!response?.body && allowEmptyBody) return { byteLength: 0 };
  if (!response?.body || typeof response.body.getReader !== "function") {
    throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_INVALID" });
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) {
        throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_INVALID" });
      }
      if (total + value.byteLength > PER_RESPONSE_BYTE_LIMIT) {
        try { await reader.cancel(); } catch { /* Never retry an oversized response. */ }
        throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_TOO_LARGE" });
      }
      total += value.byteLength;
      chunks.push(value);
    }
  } finally {
    try { reader.releaseLock(); } catch { /* No response details are exposed. */ }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (!decode) return { byteLength: total };
  try { return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), byteLength: total }; }
  catch { throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_RESPONSE_INVALID" }); }
};

const cancelResponseBody = async (response) => {
  try { await response?.body?.cancel?.(); } catch { /* No retry and no provider detail escapes. */ }
};

const parseFoundDocument = (text, candidate) => {
  let document;
  try { document = JSON.parse(text); } catch {
    return { ok: false, failureCode: "PROVIDER_RESPONSE_INVALID" };
  }
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    return { ok: false, failureCode: "PROVIDER_RESPONSE_INVALID" };
  }
  const allowedDocumentKeys = new Set(["name", "fields", "createTime", "updateTime"]);
  if (Object.keys(document).some((key) => !allowedDocumentKeys.has(key))) {
    return { ok: false, failureCode: "PROVIDER_RESPONSE_INVALID" };
  }
  if (typeof document.name !== "string") {
    return { ok: false, failureCode: "PROVIDER_RESPONSE_INVALID" };
  }
  if (document.name !== candidate.resourceName) {
    return { ok: false, failureCode: "PROVIDER_RESOURCE_IDENTITY_MISMATCH" };
  }
  const result = { moduleId: candidate.moduleId, documentPath: candidate.documentPath, result: "FOUND" };
  if (document.fields !== undefined) {
    if (!document.fields || typeof document.fields !== "object" || Array.isArray(document.fields)
      || Object.keys(document.fields).some((key) => key !== "lessonId")) {
      return { ok: false, failureCode: "PROVIDER_RESPONSE_INVALID" };
    }
    if (Object.hasOwn(document.fields, "lessonId")) {
      const lessonIdValue = document.fields.lessonId;
      if (!lessonIdValue || typeof lessonIdValue !== "object" || Array.isArray(lessonIdValue)
        || Object.keys(lessonIdValue).length !== 1
        || typeof lessonIdValue.stringValue !== "string"
        || lessonIdValue.stringValue !== LESSON_ID) {
        return { ok: false, failureCode: "PROVIDER_PROJECTED_LESSON_ID_INVALID" };
      }
      result.lessonId = LESSON_ID;
    }
  }
  return { ok: true, result };
};

const getAdminApi = (runtime) => runtime.adminApi ?? (() => {
  const repositoryRoot = getRepositoryRoot();
  return createRequire(path.join(repositoryRoot, "functions", "package.json"))("firebase-admin/app");
})();

const failureWithProgress = (failureCode, candidateResults, candidate, providerRequestCount, totalResponseBytes) => safeFailure(failureCode, {
  testedCandidateCount: candidateResults.length,
  providerRequestCount,
  totalResponseBytes,
  candidateResults,
  ...(candidate ? { failingCandidate: { moduleId: candidate.moduleId, documentPath: candidate.documentPath } } : {}),
  maxLogicalDocumentReads: LOGICAL_DOCUMENT_READS_MAX,
  maxProviderRequests: HTTP_FETCHES_MAX,
});

/** Bounded, exact-document A1_1 probes. Runtime dependencies are replaceable only for local tests. */
export const runA1_1ReturnedModulePointRead = async (runtime = {}) => {
  const env = runtime.env ?? process.env;
  if (env[AUTHORIZATION_ENV] !== AUTHORIZATION_VALUE) {
    return emit(runtime, safeFailure("AUTHORIZATION_NOT_ARMED", { testedCandidateCount: 0, candidateResults: [] }));
  }
  if (env[QUOTA_PROJECT_ENV] !== PROJECT_ID) {
    return emit(runtime, safeFailure("QUOTA_PROJECT_MISMATCH", { testedCandidateCount: 0, candidateResults: [] }));
  }
  const credentialEnvironment = inspectCredentialEnvironment({
    env,
    repositoryRoot: runtime.repositoryRoot ?? getRepositoryRoot(),
    pathApi: runtime.pathApi ?? path,
    fileExists: runtime.fileExists ?? fs.existsSync,
    realpath: runtime.realpath ?? ((value) => fs.realpathSync.native(value)),
  });
  if (!credentialEnvironment.ok) {
    return emit(runtime, safeFailure(credentialEnvironment.failureCode, { testedCandidateCount: 0, candidateResults: [] }));
  }

  let app;
  let ownsApp = false;
  let report;
  let stage = "ADC";
  const candidateResults = [];
  let providerRequestCount = 0;
  let totalResponseBytes = 0;
  try {
    const admin = runtime.adminApi ?? getAdminApi(runtime);
    const credential = (runtime.applicationDefault ?? admin.applicationDefault)();
    if (!credential || typeof credential.getAccessToken !== "function") {
      throw Object.assign(new Error(), { safeFailureCode: "TOKEN_ACQUISITION_FAILED" });
    }
    if ((runtime.getApps ?? admin.getApps)().some((candidate) => candidate?.name === APP_NAME)) {
      throw Object.assign(new Error(), { safeFailureCode: "APP_NAME_COLLISION" });
    }
    stage = "ADMIN_APP_INITIALIZATION";
    app = await (runtime.initializeApp ?? admin.initializeApp)({ credential, projectId: PROJECT_ID }, APP_NAME);
    ownsApp = true;
    stage = "TOKEN_ACQUISITION";
    const access = await credential.getAccessToken();
    const token = access?.access_token;
    if (typeof token !== "string" || token.length === 0) {
      throw Object.assign(new Error(), { safeFailureCode: "TOKEN_ACQUISITION_FAILED" });
    }
    const fetchFn = runtime.fetch ?? globalThis.fetch;
    if (typeof fetchFn !== "function") {
      throw Object.assign(new Error(), { safeFailureCode: "PROVIDER_FETCH_FAILED" });
    }

    for (const candidate of CANDIDATES) {
      let response;
      providerRequestCount += 1;
      try {
        response = await fetchFn(candidate.endpoint, {
          method: "GET",
          redirect: REDIRECT_MODE,
          headers: {
            Authorization: `Bearer ${token}`,
            "x-goog-user-project": PROJECT_ID,
          },
        });
      } catch {
        report = failureWithProgress("PROVIDER_FETCH_FAILED", candidateResults, candidate, providerRequestCount, totalResponseBytes);
        break;
      }

      if (response?.status !== 200 && response?.status !== 404) {
        await cancelResponseBody(response);
        report = failureWithProgress("PROVIDER_HTTP_STATUS_UNEXPECTED", candidateResults, candidate, providerRequestCount, totalResponseBytes);
        break;
      }

      let body;
      try {
        body = await readBoundedBody(response, { decode: response.status === 200, allowEmptyBody: response.status === 404 });
        totalResponseBytes += body.byteLength;
        if (totalResponseBytes > TOTAL_RESPONSE_BYTES_MAX) {
          report = failureWithProgress("PROVIDER_RESPONSE_TOO_LARGE", candidateResults, candidate, providerRequestCount, totalResponseBytes);
          break;
        }
      } catch (error) {
        report = failureWithProgress(error?.safeFailureCode ?? "PROVIDER_RESPONSE_INVALID", candidateResults, candidate, providerRequestCount, totalResponseBytes);
        break;
      }

      if (response.status === 404) {
        candidateResults.push({ moduleId: candidate.moduleId, documentPath: candidate.documentPath, result: "MISSING" });
        continue;
      }
      const found = parseFoundDocument(body.text, candidate);
      if (!found.ok) {
        report = failureWithProgress(found.failureCode, candidateResults, candidate, providerRequestCount, totalResponseBytes);
        break;
      }
      candidateResults.push(found.result);
    }

    if (!report) {
      const foundCount = candidateResults.filter((result) => result.result === "FOUND").length;
      const classification = foundCount === 0
        ? "NO_MATCH_IN_RETURNED_MODULE_CANDIDATES"
        : foundCount === 1
          ? "UNIQUE_MATCH_IN_RETURNED_MODULE_CANDIDATES"
          : "MULTIPLE_MATCHES_IN_RETURNED_MODULE_CANDIDATES";
      report = {
        status: "SUCCESS",
        providerTransport: PROVIDER_TRANSPORT,
        projectId: PROJECT_ID,
        databaseId: DATABASE_ID,
        levelId: LEVEL_ID,
        lessonId: LESSON_ID,
        candidateCount: CANDIDATE_COUNT,
        testedCandidateCount: candidateResults.length,
        foundCount,
        candidateResults,
        classification,
        completeness: COMPLETENESS_LABEL,
        maxLogicalDocumentReads: LOGICAL_DOCUMENT_READS_MAX,
        maxProviderRequests: HTTP_FETCHES_MAX,
        fieldProjectionCount: FIELD_PROJECTION_COUNT,
        credentialEnvironmentResult: credentialEnvironment.result,
      };
    }
  } catch (error) {
    const failureCode = error?.safeFailureCode
      ?? (stage === "ADC" || stage === "TOKEN_ACQUISITION" ? "TOKEN_ACQUISITION_FAILED" : "PROVIDER_FETCH_FAILED");
    report = failureWithProgress(failureCode, candidateResults, undefined, providerRequestCount, totalResponseBytes);
  } finally {
    if (ownsApp) {
      try {
        const admin = runtime.adminApi ?? getAdminApi(runtime);
        await (runtime.deleteApp ?? admin.deleteApp)(app);
      } catch {
        report = failureWithProgress("APP_CLEANUP_FAILED", candidateResults, undefined, providerRequestCount, totalResponseBytes);
      }
    }
  }
  return emit(runtime, report ?? failureWithProgress("PROVIDER_FETCH_FAILED", candidateResults, undefined, providerRequestCount, totalResponseBytes));
};

const isDirectExecution = () => typeof process.argv[1] === "string"
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution()) {
  const output = (result) => process.stdout.write(`${JSON.stringify(result)}\n`);
  if (process.argv.length !== 2) {
    output(safeFailure("UNEXPECTED_ARGUMENTS", { testedCandidateCount: 0, candidateResults: [] }));
    process.exitCode = 1;
  } else {
    runA1_1ReturnedModulePointRead({ env: process.env, output })
      .then((result) => { if (result.status !== "SUCCESS") process.exitCode = 1; })
      .catch(() => {
        output(safeFailure("PROVIDER_FETCH_FAILED", { testedCandidateCount: 0, candidateResults: [] }));
        process.exitCode = 1;
      });
  }
}
