import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FIRST_READ_AUTHORIZATION_ENV = "PHASE05_FIRST_BOUNDED_PROVIDER_READ_AUTHORIZATION";
export const FIRST_READ_AUTHORIZATION_VALUE = "phase05-direct-a1-read-v1";
export const QUOTA_PROJECT_ENV = "GOOGLE_CLOUD_QUOTA_PROJECT";
export const PROJECT_ID = "english-for-polish";
export const DATABASE_ID = "(default)";
export const COLLECTION_PATH = "levels/A1/lessons";
export const REST_ENDPOINT = "https://firestore.googleapis.com/v1/projects/english-for-polish/databases/(default)/documents/levels/A1:runQuery";
export const RESPONSE_BYTE_LIMIT = 65536;
export const MAX_DOCUMENTS = 5;
export const COMPLETENESS_LABEL = "PAGE_LOCAL_PARTIAL_OR_UNKNOWN";
export const FIRST_READ_PACKET = Object.freeze({
  projectId: PROJECT_ID,
  databaseId: DATABASE_ID,
  collectionPath: COLLECTION_PATH,
  collectionId: "lessons",
  fieldProjection: Object.freeze([
    "lessonId", "levelId", "level", "nivel", "moduleId", "moduleTitle", "title", "titulo", "orderInModule", "status",
  ]),
  maxDocuments: MAX_DOCUMENTS,
  maxPages: 1,
  order: "DOCUMENT_PATH_ASC",
});

const safeError = (category, stage) => ({
  status: "FAILURE",
  category,
  stage,
  message: "The bounded lesson read stopped safely.",
});

const isPathWithinRepository = (candidate, repositoryRoot, pathApi) => {
  const relative = pathApi.relative(repositoryRoot, candidate);
  const comparable = pathApi === path.win32 ? relative.toLowerCase() : relative;
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
    return { ok: false, category: "CREDENTIAL_PATH_INVALID" };
  }
  try {
    const absoluteConfiguredPath = pathApi.isAbsolute(configuredPath)
      ? pathApi.resolve(configuredPath)
      : pathApi.resolve(repositoryRoot, configuredPath);
    if (!fileExists(absoluteConfiguredPath)) return { ok: false, category: "CREDENTIAL_PATH_INVALID" };
    const resolvedRoot = realpath(repositoryRoot);
    const resolvedCredential = realpath(absoluteConfiguredPath);
    if (isPathWithinRepository(resolvedCredential, resolvedRoot, pathApi)) {
      return { ok: false, category: "REPOSITORY_LOCAL_CREDENTIAL_PATH_REJECTED" };
    }
    return { ok: true, result: "EXTERNAL_CREDENTIAL_PATH_ALLOWED" };
  } catch {
    return { ok: false, category: "CREDENTIAL_PATH_INVALID" };
  }
};

const getRepositoryRoot = () => path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const createRunQueryBody = () => ({
  structuredQuery: {
    from: [{ collectionId: "lessons" }],
    select: { fields: FIRST_READ_PACKET.fieldProjection.map((fieldPath) => ({ fieldPath })) },
    orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
    limit: MAX_DOCUMENTS,
  },
});

const scalarFromRestValue = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value);
  if (entries.length !== 1) return undefined;
  const [type, raw] = entries[0];
  if (type === "stringValue" && typeof raw === "string") return raw;
  if (type === "integerValue" && (typeof raw === "string" || typeof raw === "number")) {
    const number = Number(raw);
    return Number.isSafeInteger(number) ? number : undefined;
  }
  if (type === "doubleValue" && typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (type === "booleanValue" && typeof raw === "boolean") return raw;
  if (type === "nullValue" && raw === "NULL_VALUE") return null;
  return undefined;
};

const safeDocumentIdentity = (name) => {
  if (typeof name !== "string") return null;
  const prefix = "projects/english-for-polish/databases/(default)/documents/levels/A1/lessons/";
  if (!name.startsWith(prefix)) return null;
  const suffix = name.slice(prefix.length);
  if (!suffix || suffix.includes("/") || suffix === "." || suffix === "..") return null;
  return { documentId: suffix, documentPath: `levels/A1/lessons/${suffix}` };
};

const sanitizeDocument = (document) => {
  if (!document || typeof document !== "object" || Array.isArray(document)
    || (document.fields !== undefined && (!document.fields || typeof document.fields !== "object" || Array.isArray(document.fields)))) return null;
  const identity = safeDocumentIdentity(document.name);
  if (!identity) return null;
  const projectedFields = {};
  for (const field of FIRST_READ_PACKET.fieldProjection) {
    const value = scalarFromRestValue(document.fields?.[field]);
    if (value !== undefined) projectedFields[field] = value;
  }
  return { ...identity, projectedFields };
};

const readBoundedResponse = async (response) => {
  if (!response?.body || typeof response.body.getReader !== "function") {
    throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
      if (total + value.byteLength > RESPONSE_BYTE_LIMIT) {
        try { await reader.cancel(); } catch { /* Stop consuming; never retry. */ }
        throw Object.assign(new Error(), { safeCategory: "RESPONSE_TOO_LARGE" });
      }
      total += value.byteLength;
      chunks.push(value);
    }
  } finally {
    try { reader.releaseLock(); } catch { /* No data is exposed. */ }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
  }
};

const consumeRunQueryResponse = async (response) => {
  if (!response || response.ok !== true) throw Object.assign(new Error(), { safeCategory: "PROVIDER_READ_FAILED" });
  const text = await readBoundedResponse(response);
  let entries;
  try { entries = JSON.parse(text); } catch { throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" }); }
  if (!Array.isArray(entries)) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
  const documents = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
    const allowedEntryKeys = new Set(["document", "transaction", "readTime", "skippedResults"]);
    if (Object.keys(entry).some((key) => !allowedEntryKeys.has(key))) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
    if (!Object.hasOwn(entry, "document")) {
      if (Object.hasOwn(entry, "transaction") && typeof entry.transaction !== "string") throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
      if (Object.hasOwn(entry, "readTime") && typeof entry.readTime !== "string") throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
      if (Object.hasOwn(entry, "skippedResults") && (!Number.isInteger(entry.skippedResults) || entry.skippedResults < 0)) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
      continue;
    }
    if (documents.length >= MAX_DOCUMENTS) continue;
    const document = sanitizeDocument(entry.document);
    if (!document) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
    documents.push(document);
  }
  return documents;
};

const getAdminApi = (runtime) => runtime.adminApi ?? (() => {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  return createRequire(path.join(repositoryRoot, "functions", "package.json"))("firebase-admin/app");
})();

/** One-shot REST reader. Runtime injection is for local mocks only; production uses native fetch. */
export const runPhase05FirstBoundedProviderRead = async (runtime = {}) => {
  const env = runtime.env ?? process.env;
  if (env[FIRST_READ_AUTHORIZATION_ENV] !== FIRST_READ_AUTHORIZATION_VALUE) return safeError("EXECUTION_NOT_AUTHORIZED", "ARMING_GUARD");
  if (env[QUOTA_PROJECT_ENV] !== PROJECT_ID) return safeError("QUOTA_PROJECT_INVALID", "QUOTA_PROJECT_GUARD");
  const credentialEnvironment = inspectCredentialEnvironment({
    env,
    repositoryRoot: runtime.repositoryRoot ?? getRepositoryRoot(),
    pathApi: runtime.pathApi ?? path,
    fileExists: runtime.fileExists ?? fs.existsSync,
    realpath: runtime.realpath ?? ((value) => fs.realpathSync.native(value)),
  });
  if (!credentialEnvironment.ok) return safeError(credentialEnvironment.category, "CREDENTIAL_PATH_GUARD");

  let app;
  let ownsApp = false;
  let report;
  try {
    const admin = getAdminApi(runtime);
    const credential = (runtime.applicationDefault ?? admin.applicationDefault)();
    if (!credential || typeof credential.getAccessToken !== "function") throw Object.assign(new Error(), { safeCategory: "TOKEN_ACQUISITION_FAILED" });
    const appName = "phase05-first-bounded-lesson-read";
    if ((runtime.getApps ?? admin.getApps)().some((candidate) => candidate?.name === appName)) {
      throw Object.assign(new Error(), { safeCategory: "APP_NAME_COLLISION" });
    }
    app = await (runtime.initializeApp ?? admin.initializeApp)(
      { credential, projectId: PROJECT_ID }, appName,
    );
    ownsApp = true;
    const access = await credential.getAccessToken();
    const token = access?.access_token;
    if (typeof token !== "string" || token.length === 0) throw Object.assign(new Error(), { safeCategory: "TOKEN_ACQUISITION_FAILED" });
    const fetchFn = runtime.fetch ?? globalThis.fetch;
    if (typeof fetchFn !== "function") throw Object.assign(new Error(), { safeCategory: "PROVIDER_READ_FAILED" });
    const response = await fetchFn(REST_ENDPOINT, {
      method: "POST",
      redirect: "error",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-goog-user-project": PROJECT_ID,
      },
      body: JSON.stringify(createRunQueryBody()),
    });
    const documents = await consumeRunQueryResponse(response);
    report = {
      status: "SUCCESS",
      providerTransport: "REST_ONE_SHOT",
      endpoint: REST_ENDPOINT,
      method: "POST",
      returnedDocumentCount: documents.length,
      documents,
      completeness: COMPLETENESS_LABEL,
      maxDocuments: MAX_DOCUMENTS,
      maxPages: 1,
      fieldProjectionCount: FIRST_READ_PACKET.fieldProjection.length,
      credentialEnvironmentResult: credentialEnvironment.result,
    };
  } catch (error) {
    const category = ["RESPONSE_TOO_LARGE", "MALFORMED_RESPONSE", "PROVIDER_READ_FAILED", "TOKEN_ACQUISITION_FAILED", "APP_NAME_COLLISION"].includes(error?.safeCategory)
      ? error.safeCategory
      : "PROVIDER_READ_FAILED";
    report = safeError(category, category === "TOKEN_ACQUISITION_FAILED" ? "TOKEN_ACQUISITION" : "REST_RUNQUERY");
  } finally {
    if (ownsApp) {
      try {
        const admin = getAdminApi(runtime);
        await (runtime.deleteApp ?? admin.deleteApp)(app);
      } catch {
        if (report?.status === "SUCCESS") report = safeError("CLEANUP_FAILED", "APP_CLEANUP");
      }
    }
  }
  try { (runtime.output ?? (() => {}))(report); } catch { /* Output is best-effort; never triggers another request. */ }
  return report;
};

const isDirectExecution = () => typeof process.argv[1] === "string"
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution()) {
  runPhase05FirstBoundedProviderRead({ env: process.env, output: (report) => process.stdout.write(`${JSON.stringify(report)}\n`) })
    .then((report) => { if (report.status !== "SUCCESS") process.exitCode = 1; })
    .catch(() => { process.stdout.write(`${JSON.stringify(safeError("PROVIDER_READ_FAILED", "RUNTIME"))}\n`); process.exitCode = 1; });
}
