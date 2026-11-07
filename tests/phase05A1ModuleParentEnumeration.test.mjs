import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  APP_NAME,
  COLLECTION_ID,
  COMPLETENESS_LABEL,
  DATABASE_ID,
  MAX_DOCUMENTS,
  MAX_PAGES,
  MODULE_ENUMERATION_AUTHORIZATION_ENV,
  MODULE_ENUMERATION_AUTHORIZATION_VALUE,
  PARENT_PATH,
  PROJECT_ID,
  PROJECTED_FIELDS,
  PROVIDER_TRANSPORT,
  QUOTA_PROJECT_ENV,
  REST_ENDPOINT,
  RESPONSE_BYTE_LIMIT,
  createRunQueryBody,
  inspectCredentialEnvironment,
  runPhase05A1ModuleParentEnumeration,
} from "../scripts/migration/phase05A1ModuleParentEnumeration.mjs";

const token = "mocked-token-must-not-leak";
const resourcePrefix = "projects/english-for-polish/databases/(default)/documents/levels/A1/modules/";
const makeDocument = (moduleId, fields = { title: { stringValue: `Title ${moduleId}` } }) => ({
  name: `${resourcePrefix}${moduleId}`,
  fields: { ...fields, privateField: { stringValue: "PRIVATE_UNREQUESTED_VALUE" } },
  createTime: "PRIVATE_CREATE_TIME",
  updateTime: "PRIVATE_UPDATE_TIME",
});

const makeResponse = (entries, { ok = true, status = 200 } = {}) => {
  const bytes = new TextEncoder().encode(JSON.stringify(entries));
  return {
    ok,
    status,
    body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
  };
};

const fixture = ({
  authorization = MODULE_ENUMERATION_AUTHORIZATION_VALUE,
  quota = PROJECT_ID,
  credentialPath,
  fileExists,
  realpath,
  responseValue,
  fetchError,
  existingApps = [],
  tokenValue = token,
  tokenError,
  deleteError,
} = {}) => {
  const calls = { adc: 0, token: 0, init: 0, delete: 0, fetch: 0, output: [] };
  const app = { name: APP_NAME };
  const credential = {
    getAccessToken: async () => {
      calls.token += 1;
      if (tokenError) throw tokenError;
      return { access_token: tokenValue };
    },
  };
  const runtime = {
    env: {
      [MODULE_ENUMERATION_AUTHORIZATION_ENV]: authorization,
      [QUOTA_PROJECT_ENV]: quota,
      ...(credentialPath === undefined ? {} : { GOOGLE_APPLICATION_CREDENTIALS: credentialPath }),
    },
    repositoryRoot: "C:\\workspace\\polish-learning",
    pathApi: path.win32,
    fileExists: fileExists ?? (() => true),
    realpath: realpath ?? ((value) => path.win32.resolve(value)),
    adminApi: {
      applicationDefault: () => { calls.adc += 1; return credential; },
      getApps: () => existingApps,
      initializeApp: async () => { calls.init += 1; return app; },
      deleteApp: async () => { calls.delete += 1; if (deleteError) throw deleteError; },
    },
    fetch: async (...args) => {
      calls.fetch += 1;
      calls.fetchArgs = args;
      if (fetchError) throw fetchError;
      return responseValue ?? makeResponse([]);
    },
    output: (value) => calls.output.push(value),
  };
  return { calls, runtime };
};

test("the frozen query is exactly one projected A1 modules query", () => {
  assert.deepEqual(createRunQueryBody(), {
    structuredQuery: {
      select: { fields: [{ fieldPath: "title" }] },
      from: [{ collectionId: "modules", allDescendants: false }],
      orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
      limit: 5,
    },
  });
  assert.deepEqual(PROJECTED_FIELDS, ["title"]);
  assert.equal(COLLECTION_ID, "modules");
  assert.equal(PARENT_PATH, "levels/A1");
  assert.equal(DATABASE_ID, "(default)");
  assert.equal(MAX_DOCUMENTS, 5);
  assert.equal(MAX_PAGES, 1);
});

test("missing or mismatched arming and quota guards stop before ADC, token, or fetch", async () => {
  const cases = [
    fixture({ authorization: undefined }),
    fixture({ authorization: "wrong" }),
    fixture({ quota: undefined }),
    fixture({ quota: "another-project" }),
  ];
  delete cases[0].runtime.env[MODULE_ENUMERATION_AUTHORIZATION_ENV];
  delete cases[2].runtime.env[QUOTA_PROJECT_ENV];
  for (const { calls, runtime } of cases) {
    const report = await runPhase05A1ModuleParentEnumeration(runtime);
    assert.equal(report.status, "FAILURE");
    assert.equal(calls.adc + calls.token + calls.fetch, 0);
    assert.equal(calls.output.length, 1);
  }
  assert.equal(cases[0].calls.output[0].category, "EXECUTION_NOT_AUTHORIZED");
  assert.equal(cases[1].calls.output[0].category, "EXECUTION_NOT_AUTHORIZED");
  assert.equal(cases[2].calls.output[0].category, "QUOTA_PROJECT_INVALID");
  assert.equal(cases[3].calls.output[0].category, "QUOTA_PROJECT_INVALID");
});

test("repository credential paths including relative and traversal forms fail before ADC", async () => {
  for (const credentialPath of [
    "C:\\workspace\\polish-learning",
    "C:\\workspace\\polish-learning\\credentials\\secret.json",
    "credentials\\secret.json",
    "nested\\..\\credentials\\secret.json",
    "..\\polish-learning\\credentials\\secret.json",
  ]) {
    const { calls, runtime } = fixture({ credentialPath });
    const report = await runPhase05A1ModuleParentEnumeration(runtime);
    assert.equal(report.category, "REPOSITORY_LOCAL_CREDENTIAL_PATH_REJECTED");
    assert.equal(calls.adc + calls.token + calls.fetch, 0);
    assert.equal(JSON.stringify(report).includes("secret.json"), false);
  }
});

test("external sibling credential path is allowed while malformed or unresolvable paths fail closed", async () => {
  const sibling = fixture({ credentialPath: "C:\\workspace\\polish-learning-backup\\credential.json" });
  const siblingReport = await runPhase05A1ModuleParentEnumeration(sibling.runtime);
  assert.equal(siblingReport.status, "SUCCESS");
  assert.equal(siblingReport.credentialEnvironmentResult, "EXTERNAL_CREDENTIAL_PATH_ALLOWED");
  assert.equal(sibling.calls.adc, 1);
  assert.equal(sibling.calls.fetch, 1);

  const malformed = fixture({ credentialPath: "C:\\private\\secret.json", realpath: () => { throw new Error("SECRET_PATH"); } });
  const malformedReport = await runPhase05A1ModuleParentEnumeration(malformed.runtime);
  assert.equal(malformedReport.category, "CREDENTIAL_PATH_INVALID");
  assert.equal(malformed.calls.adc + malformed.calls.token + malformed.calls.fetch, 0);
  assert.equal(JSON.stringify(malformedReport).includes("private"), false);
  assert.equal(JSON.stringify(malformedReport).includes("SECRET_PATH"), false);
});

test("one ADC, token, and native fetch use exact endpoint, quota header, body, and redirect mode", async () => {
  const { calls, runtime } = fixture({ responseValue: makeResponse([{ document: makeDocument("A1_M01_intro") }]) });
  const report = await runPhase05A1ModuleParentEnumeration(runtime);
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
  assert.equal(calls.fetch, 1);
  assert.equal(calls.init, 1);
  assert.equal(calls.delete, 1);
  const [url, init] = calls.fetchArgs;
  assert.equal(url, REST_ENDPOINT);
  assert.equal(init.method, "POST");
  assert.equal(init.redirect, "error");
  assert.equal(init.headers.Authorization, `Bearer ${token}`);
  assert.equal(init.headers["x-goog-user-project"], PROJECT_ID);
  assert.equal(init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(init.body), createRunQueryBody());
  assert.equal(report.providerTransport, "REST_ONE_SHOT");
  assert.equal(JSON.stringify(report).includes(token), false);
  assert.equal(JSON.stringify(calls.output).includes(token), false);
});

test("resource name supplies identity, missing title stays absent, and unrequested fields are omitted", async () => {
  const { runtime } = fixture({ responseValue: makeResponse([
    { readTime: "2026-11-07T00:00:00Z" },
    { document: makeDocument("A1_M01_intro", { title: { stringValue: "Introduction" }, moduleId: { stringValue: "FAKE_ID" } }) },
    { document: makeDocument("A1_M02_world", { moduleId: { stringValue: "FAKE_ID_2" } }) },
    { document: makeDocument("A1_M03_misc", { title: { integerValue: "12" } }) },
  ]) });
  const report = await runPhase05A1ModuleParentEnumeration(runtime);
  assert.equal(report.status, "SUCCESS");
  assert.equal(report.returnedModuleCount, 3);
  assert.deepEqual(report.modules, [
    { moduleId: "A1_M01_intro", modulePath: "levels/A1/modules/A1_M01_intro", projectedFields: { title: "Introduction" } },
    { moduleId: "A1_M02_world", modulePath: "levels/A1/modules/A1_M02_world", projectedFields: {} },
    { moduleId: "A1_M03_misc", modulePath: "levels/A1/modules/A1_M03_misc", projectedFields: {} },
  ]);
  const serialized = JSON.stringify(report);
  for (const forbidden of ["FAKE_ID", "PRIVATE_UNREQUESTED_VALUE", "PRIVATE_CREATE_TIME", "PRIVATE_UPDATE_TIME", "readTime"]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("out-of-scope and malformed resource names fail closed", async () => {
  const names = [
    "projects/another-project/databases/(default)/documents/levels/A1/modules/M01",
    "projects/english-for-polish/databases/other-db/documents/levels/A1/modules/M01",
    "projects/english-for-polish/databases/(default)/documents/levels/A2/modules/M01",
    "projects/english-for-polish/databases/(default)/documents/levels/A1/lessons/A1_1",
    "projects/english-for-polish/databases/(default)/documents/levels/A1/modules/M01/lessons/A1_1",
    "projects/english-for-polish/databases/(default)/documents/levels/A1/modules/",
    "projects/english-for-polish/databases/(default)/documents/levels/A1/modules/M01/extra",
  ];
  for (const name of names) {
    const { calls, runtime } = fixture({ responseValue: makeResponse([{ document: { name } }]) });
    const report = await runPhase05A1ModuleParentEnumeration(runtime);
    assert.equal(report.category, "MALFORMED_RESPONSE");
    assert.equal(calls.fetch, 1);
    assert.equal(JSON.stringify(report).includes(name), false);
  }
});

test("zero, short, and full-limit pages preserve partial-or-unknown completeness", async () => {
  for (const count of [0, 1, 2, 3, 4, 5]) {
    const entries = [{ readTime: "2026-11-07T00:00:00Z" }, ...Array.from({ length: count }, (_, index) => ({ document: makeDocument(`module-${index + 1}`) }))];
    const { calls, runtime } = fixture({ responseValue: makeResponse(entries) });
    const report = await runPhase05A1ModuleParentEnumeration(runtime);
    assert.equal(report.status, "SUCCESS");
    assert.equal(report.returnedModuleCount, count);
    assert.equal(report.modules.length <= 5, true);
    assert.equal(report.completeness, COMPLETENESS_LABEL);
    assert.equal(report.maxDocuments, 5);
    assert.equal(report.maxPages, 1);
    assert.equal(report.fieldProjectionCount, 1);
    assert.equal(calls.fetch, 1);
  }
});

test("a sixth valid module fails safely rather than being silently discarded", async () => {
  const { calls, runtime } = fixture({ responseValue: makeResponse(Array.from({ length: 6 }, (_, index) => ({ document: makeDocument(`module-${index + 1}`) }))) });
  const report = await runPhase05A1ModuleParentEnumeration(runtime);
  assert.equal(report.status, "FAILURE");
  assert.equal(report.category, "DOCUMENT_LIMIT_EXCEEDED");
  assert.equal(Object.hasOwn(report, "modules"), false);
  assert.equal(calls.fetch, 1);
});

test("oversized body is cancelled during streaming and is never retried", async () => {
  let cancelled = false;
  const { calls, runtime } = fixture({ responseValue: {
    ok: true,
    body: new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(RESPONSE_BYTE_LIMIT)); controller.enqueue(new Uint8Array(1)); },
      cancel() { cancelled = true; },
    }),
  } });
  const report = await runPhase05A1ModuleParentEnumeration(runtime);
  assert.equal(report.category, "RESPONSE_TOO_LARGE");
  assert.equal(RESPONSE_BYTE_LIMIT, 65536);
  assert.equal(calls.fetch, 1);
  assert.equal(calls.token, 1);
  assert.equal(cancelled, true);
});

test("malformed framing, HTTP errors, fetch failures, and raw provider details are sanitized", async () => {
  const cases = [
    fixture({ responseValue: makeResponse("not-json") }),
    fixture({ responseValue: makeResponse({ document: makeDocument("module-1") }) }),
    fixture({ responseValue: makeResponse([{}]) }),
    fixture({ responseValue: makeResponse([{ unexpected: "RAW_SECRET" }]) }),
    fixture({ responseValue: makeResponse([], { ok: false, status: 403 }) }),
    fixture({ fetchError: new Error("RAW_SECRET oauth.invalid private body") }),
  ];
  for (const { calls, runtime } of cases) {
    const report = await runPhase05A1ModuleParentEnumeration(runtime);
    assert.equal(report.status, "FAILURE");
    assert.equal(calls.fetch, 1);
    assert.equal(JSON.stringify(report).includes("RAW_SECRET"), false);
    assert.equal(JSON.stringify(report).includes("oauth.invalid"), false);
  }
});

test("token acquisition and app lifecycle are bounded and failures remain sanitized", async () => {
  const collision = fixture({ existingApps: [{ name: APP_NAME }] });
  const collisionReport = await runPhase05A1ModuleParentEnumeration(collision.runtime);
  assert.equal(collisionReport.category, "APP_NAME_COLLISION");
  assert.equal(collision.calls.adc, 1);
  assert.equal(collision.calls.token + collision.calls.fetch, 0);

  const tokenFailure = fixture({ tokenError: new Error(`RAW_${token}_ERROR`) });
  const tokenReport = await runPhase05A1ModuleParentEnumeration(tokenFailure.runtime);
  assert.equal(tokenReport.category, "TOKEN_ACQUISITION_FAILED");
  assert.equal(tokenFailure.calls.adc, 1);
  assert.equal(tokenFailure.calls.token, 1);
  assert.equal(tokenFailure.calls.fetch, 0);
  assert.equal(JSON.stringify(tokenReport).includes(token), false);

  const cleanupFailure = fixture({ responseValue: makeResponse([]), deleteError: new Error("RAW_CLEANUP_ERROR") });
  const cleanupReport = await runPhase05A1ModuleParentEnumeration(cleanupFailure.runtime);
  assert.equal(cleanupReport.category, "CLEANUP_FAILED");
  assert.equal(cleanupFailure.calls.fetch, 1);
  assert.equal(cleanupFailure.calls.delete, 1);
  assert.equal(JSON.stringify(cleanupReport).includes("RAW_CLEANUP_ERROR"), false);
});

test("the mock suite uses no real provider dependency or Firestore transport", async () => {
  const { calls, runtime } = fixture();
  assert.equal(Object.hasOwn(runtime.adminApi, "getFirestore"), false);
  const report = await runPhase05A1ModuleParentEnumeration(runtime);
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
  assert.equal(calls.fetch, 1);
});
