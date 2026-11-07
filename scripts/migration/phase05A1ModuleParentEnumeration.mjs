import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MODULE_ENUMERATION_AUTHORIZATION_ENV = "PHASE05_A1_MODULE_PARENT_ENUMERATION_AUTHORIZATION";
export const MODULE_ENUMERATION_AUTHORIZATION_VALUE = "phase05-a1-module-parent-enumeration-v1";
export const QUOTA_PROJECT_ENV = "GOOGLE_CLOUD_QUOTA_PROJECT";
export const PROJECT_ID = "english-for-polish";
export const DATABASE_ID = "(default)";
export const PARENT_PATH = "levels/A1";
export const COLLECTION_PATH = "levels/A1/modules";
export const COLLECTION_ID = "modules";
export const REST_ENDPOINT = "https://firestore.googleapis.com/v1/projects/english-for-polish/databases/(default)/documents/levels/A1:runQuery";
export const PROJECTED_FIELDS = Object.freeze(["title"]);
export const RESPONSE_BYTE_LIMIT = 65536;
export const MAX_DOCUMENTS = 5;
export const MAX_PAGES = 1;
export const COMPLETENESS_LABEL = "PAGE_LOCAL_PARTIAL_OR_UNKNOWN";
export const PROVIDER_TRANSPORT = "REST_ONE_SHOT";
export const APP_NAME = "phase05-a1-module-parent-enumeration";

const safeError = (category, stage) => ({
  status: "FAILURE",
  category,
  stage,
  message: "The bounded A1 module enumeration stopped safely.",
});

const writeOutput = (runtime, result) => {
  try { (runtime.output ?? (() => {}))(result); } catch { /* Output is best-effort and never triggers another request. */ }
  return result;
};

const isPathWithinRepository = (candidate, repositoryRoot, pathApi) => {
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
    select: { fields: [{ fieldPath: "title" }] },
    from: [{ collectionId: COLLECTION_ID, allDescendants: false }],
    orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
    limit: MAX_DOCUMENTS,
  },
});

const safeModuleIdentity = (name) => {
  if (typeof name !== "string") return null;
  const prefix = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${COLLECTION_PATH}/`;
  if (!name.startsWith(prefix)) return null;
  const moduleId = name.slice(prefix.length);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/u.test(moduleId) || moduleId === "." || moduleId === "..") return null;
  return { moduleId, modulePath: `${COLLECTION_PATH}/${moduleId}` };
};

const safeTitle = (fields) => {
  if (fields === undefined) return undefined;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return undefined;
  const title = fields.title;
  if (!title || typeof title !== "object" || Array.isArray(title)
    || Object.keys(title).length !== 1 || typeof title.stringValue !== "string") return undefined;
  return title.stringValue;
};

const sanitizeModuleDocument = (document) => {
  if (!document || typeof document !== "object" || Array.isArray(document)
    || (document.fields !== undefined && (!document.fields || typeof document.fields !== "object" || Array.isArray(document.fields)))) {
    return null;
  }
  const identity = safeModuleIdentity(document.name);
  if (!identity) return null;
  const projectedFields = {};
  const title = safeTitle(document.fields);
  if (title !== undefined) projectedFields.title = title;
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
    try { reader.releaseLock(); } catch { /* No provider data is exposed. */ }
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
  let entries;
  try { entries = JSON.parse(await readBoundedResponse(response)); } catch (error) {
    if (error?.safeCategory) throw error;
    throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
  }
  if (!Array.isArray(entries)) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
  const modules = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
    const allowedEntryKeys = new Set(["document", "transaction", "readTime", "skippedResults"]);
    if (Object.keys(entry).some((key) => !allowedEntryKeys.has(key))) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
    if (!Object.hasOwn(entry, "document")) {
      const hasMetadata = Object.hasOwn(entry, "transaction") || Object.hasOwn(entry, "readTime") || Object.hasOwn(entry, "skippedResults");
      if (!hasMetadata
        || (Object.hasOwn(entry, "transaction") && typeof entry.transaction !== "string")
        || (Object.hasOwn(entry, "readTime") && typeof entry.readTime !== "string")
        || (Object.hasOwn(entry, "skippedResults") && (!Number.isInteger(entry.skippedResults) || entry.skippedResults < 0))) {
        throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
      }
      continue;
    }
    if (modules.length >= MAX_DOCUMENTS) throw Object.assign(new Error(), { safeCategory: "DOCUMENT_LIMIT_EXCEEDED" });
    const module = sanitizeModuleDocument(entry.document);
    if (!module) throw Object.assign(new Error(), { safeCategory: "MALFORMED_RESPONSE" });
    modules.push(module);
  }
  return modules;
};

const getAdminApi = (runtime) => runtime.adminApi ?? (() => {
  const repositoryRoot = getRepositoryRoot();
  return createRequire(path.join(repositoryRoot, "functions", "package.json"))("firebase-admin/app");
})();

/** One-shot, A1 modules-only REST enumeration. Runtime injection is for local mocks. */
export const runPhase05A1ModuleParentEnumeration = async (runtime = {}) => {
  const env = runtime.env ?? process.env;
  if (env[MODULE_ENUMERATION_AUTHORIZATION_ENV] !== MODULE_ENUMERATION_AUTHORIZATION_VALUE) {
    return writeOutput(runtime, safeError("EXECUTION_NOT_AUTHORIZED", "ARMING_GUARD"));
  }
  if (env[QUOTA_PROJECT_ENV] !== PROJECT_ID) {
    return writeOutput(runtime, safeError("QUOTA_PROJECT_INVALID", "QUOTA_PROJECT_GUARD"));
  }
  const credentialEnvironment = inspectCredentialEnvironment({
    env,
    repositoryRoot: runtime.repositoryRoot ?? getRepositoryRoot(),
    pathApi: runtime.pathApi ?? path,
    fileExists: runtime.fileExists ?? fs.existsSync,
    realpath: runtime.realpath ?? ((value) => fs.realpathSync.native(value)),
  });
  if (!credentialEnvironment.ok) return writeOutput(runtime, safeError(credentialEnvironment.category, "CREDENTIAL_PATH_GUARD"));

  let app;
  let ownsApp = false;
  let report;
  let stage = "ADC";
  try {
    const admin = getAdminApi(runtime);
    const credential = (runtime.applicationDefault ?? admin.applicationDefault)();
    if (!credential || typeof credential.getAccessToken !== "function") {
      throw Object.assign(new Error(), { safeCategory: "TOKEN_ACQUISITION_FAILED" });
    }
    if ((runtime.getApps ?? admin.getApps)().some((candidate) => candidate?.name === APP_NAME)) {
      throw Object.assign(new Error(), { safeCategory: "APP_NAME_COLLISION" });
    }
    stage = "ADMIN_APP_INITIALIZATION";
    app = await (runtime.initializeApp ?? admin.initializeApp)({ credential, projectId: PROJECT_ID }, APP_NAME);
    ownsApp = true;
    stage = "TOKEN_ACQUISITION";
    const access = await credential.getAccessToken();
    const token = access?.access_token;
    if (typeof token !== "string" || token.length === 0) {
      throw Object.assign(new Error(), { safeCategory: "TOKEN_ACQUISITION_FAILED" });
    }
    const fetchFn = runtime.fetch ?? globalThis.fetch;
    if (typeof fetchFn !== "function") throw Object.assign(new Error(), { safeCategory: "PROVIDER_READ_FAILED" });
    stage = "REST_RUNQUERY";
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
    const modules = await consumeRunQueryResponse(response);
    report = {
      status: "SUCCESS",
      providerTransport: PROVIDER_TRANSPORT,
      endpoint: REST_ENDPOINT,
      method: "POST",
      returnedModuleCount: modules.length,
      modules,
      completeness: COMPLETENESS_LABEL,
      maxDocuments: MAX_DOCUMENTS,
      maxPages: MAX_PAGES,
      fieldProjectionCount: PROJECTED_FIELDS.length,
      credentialEnvironmentResult: credentialEnvironment.result,
    };
  } catch (error) {
    const safeCategories = ["RESPONSE_TOO_LARGE", "MALFORMED_RESPONSE", "DOCUMENT_LIMIT_EXCEEDED", "PROVIDER_READ_FAILED", "TOKEN_ACQUISITION_FAILED", "APP_NAME_COLLISION"];
    const category = safeCategories.includes(error?.safeCategory)
      ? error.safeCategory
      : stage === "TOKEN_ACQUISITION" || stage === "ADC" ? "TOKEN_ACQUISITION_FAILED" : "PROVIDER_READ_FAILED";
    const safeStage = category === "TOKEN_ACQUISITION_FAILED" ? stage : category === "APP_NAME_COLLISION" ? "ADMIN_APP_INITIALIZATION" : "REST_RUNQUERY";
    report = safeError(category, safeStage);
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
  return writeOutput(runtime, report);
};

const isDirectExecution = () => typeof process.argv[1] === "string"
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution()) {
  runPhase05A1ModuleParentEnumeration({ env: process.env, output: (report) => process.stdout.write(`${JSON.stringify(report)}\n`) })
    .then((report) => { if (report.status !== "SUCCESS") process.exitCode = 1; })
    .catch(() => { process.stdout.write(`${JSON.stringify(safeError("PROVIDER_READ_FAILED", "RUNTIME"))}\n`); process.exitCode = 1; });
}
