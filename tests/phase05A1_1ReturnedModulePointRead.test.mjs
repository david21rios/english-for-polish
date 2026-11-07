import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  APP_NAME,
  AUTHORIZATION_ENV,
  AUTHORIZATION_VALUE,
  CANDIDATES,
  CANDIDATE_COUNT,
  CANDIDATE_MODULE_IDS,
  COMPLETENESS_LABEL,
  DATABASE_ID,
  FIELD_PROJECTION_COUNT,
  HTTP_FETCHES_MAX,
  LESSON_ID,
  LOGICAL_DOCUMENT_READS_MAX,
  MAX_BILLABLE_DOCUMENT_READS,
  PER_RESPONSE_BYTE_LIMIT,
  POINT_READS_MAX,
  PROJECT_ID,
  PROJECTED_FIELDS,
  QUERY_REQUESTS_MAX,
  QUOTA_PROJECT_ENV,
  REDIRECT_MODE,
  RETRIES_MAX,
  TOTAL_RESPONSE_BYTES_MAX,
  WRITES_MAX,
  inspectCredentialEnvironment,
  runA1_1ReturnedModulePointRead,
} from "../scripts/migration/phase05A1_1ReturnedModulePointRead.mjs";

const TOKEN = "mock-token-must-never-escape";
const REPOSITORY_ROOT = "C:\\workspace\\polish-learning";

const streamResponse = (status, value = "") => {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value));
  return {
    status,
    body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
  };
};

const documentResponse = (candidateIndex, { name, fields, extra } = {}) => {
  const candidate = CANDIDATES[candidateIndex];
  return streamResponse(200, {
    name: name ?? candidate.resourceName,
    ...(fields === undefined ? {} : { fields }),
    ...(extra ?? {}),
  });
};

const fixture = ({
  authorization = AUTHORIZATION_VALUE,
  quota = PROJECT_ID,
  credentialPath,
  extraEnv = {},
  fileExists = () => true,
  realpath = (value) => path.win32.resolve(value),
  responses = Array.from({ length: 4 }, () => streamResponse(404, "not-json 404 body is intentionally ignored")),
  fetchErrorAt = -1,
  initError,
  tokenError,
  cleanupError,
  existingApps = [],
} = {}) => {
  const calls = { adc: 0, token: 0, init: 0, delete: 0, fetch: 0, fetchArgs: [], outputs: [] };
  const credential = {
    getAccessToken: async () => {
      calls.token += 1;
      if (tokenError) throw tokenError;
      return { access_token: TOKEN };
    },
  };
  const app = { name: APP_NAME };
  const runtime = {
    env: {
      [AUTHORIZATION_ENV]: authorization,
      [QUOTA_PROJECT_ENV]: quota,
      ...extraEnv,
      ...(credentialPath === undefined ? {} : { GOOGLE_APPLICATION_CREDENTIALS: credentialPath }),
    },
    repositoryRoot: REPOSITORY_ROOT,
    pathApi: path.win32,
    fileExists,
    realpath,
    adminApi: {
      applicationDefault: () => { calls.adc += 1; return credential; },
      getApps: () => existingApps,
      initializeApp: async (...args) => {
        calls.init += 1;
        calls.initArgs = args;
        if (initError) throw initError;
        return app;
      },
      deleteApp: async () => {
        calls.delete += 1;
        if (cleanupError) throw cleanupError;
      },
    },
    fetch: async (...args) => {
      const index = calls.fetch++;
      calls.fetchArgs.push(args);
      if (index === fetchErrorAt) throw new Error("RAW provider exception secret");
      return responses[index] ?? streamResponse(404);
    },
    output: (value) => calls.outputs.push(value),
  };
  if (credentialPath !== undefined) runtime.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
  return { calls, runtime };
};

const found = (index, fields) => documentResponse(index, { fields });
const success = async (options) => {
  const context = fixture(options);
  const report = await runA1_1ReturnedModulePointRead(context.runtime);
  return { ...context, report };
};

test("frozen target, four candidate identities, paths, and GET masks are exact", async () => {
  assert.equal(PROJECT_ID, "english-for-polish");
  assert.equal(DATABASE_ID, "(default)");
  assert.equal(CANDIDATE_COUNT, 4);
  assert.deepEqual(CANDIDATE_MODULE_IDS, ["A1_M01_pruebaa1", "A1_M02_my_world", "A1_M03_daily_life", "A1_M04_around_me"]);
  assert.deepEqual(PROJECTED_FIELDS, ["lessonId"]);
  assert.equal(FIELD_PROJECTION_COUNT, 1);
  assert.deepEqual(CANDIDATES.map(({ documentPath }) => documentPath), [
    "levels/A1/modules/A1_M01_pruebaa1/lessons/A1_1",
    "levels/A1/modules/A1_M02_my_world/lessons/A1_1",
    "levels/A1/modules/A1_M03_daily_life/lessons/A1_1",
    "levels/A1/modules/A1_M04_around_me/lessons/A1_1",
  ]);
  assert.deepEqual(CANDIDATES.map(({ endpoint }) => new URL(endpoint).searchParams.get("mask.fieldPaths")), ["lessonId", "lessonId", "lessonId", "lessonId"]);
  assert.equal(CANDIDATES.length, 4);
});

test("missing arming fails before ADC, token, or network", async () => {
  const { calls, runtime } = fixture({ authorization: undefined });
  delete runtime.env[AUTHORIZATION_ENV];
  const report = await runA1_1ReturnedModulePointRead(runtime);
  assert.equal(report.failureCode, "AUTHORIZATION_NOT_ARMED");
  assert.equal(calls.adc + calls.token + calls.fetch, 0);
});

test("incorrect arming fails before ADC, token, or network", async () => {
  const { calls, runtime } = fixture({ authorization: "wrong" });
  const report = await runA1_1ReturnedModulePointRead(runtime);
  assert.equal(report.failureCode, "AUTHORIZATION_NOT_ARMED");
  assert.equal(calls.adc + calls.token + calls.fetch, 0);
});

test("missing quota fails before ADC, token, or network", async () => {
  const { calls, runtime } = fixture({ quota: undefined });
  delete runtime.env[QUOTA_PROJECT_ENV];
  const report = await runA1_1ReturnedModulePointRead(runtime);
  assert.equal(report.failureCode, "QUOTA_PROJECT_MISMATCH");
  assert.equal(calls.adc + calls.token + calls.fetch, 0);
});

test("wrong quota fails before ADC, token, or network", async () => {
  const { calls, runtime } = fixture({ quota: "another-project" });
  const report = await runA1_1ReturnedModulePointRead(runtime);
  assert.equal(report.failureCode, "QUOTA_PROJECT_MISMATCH");
  assert.equal(calls.adc + calls.token + calls.fetch, 0);
});

test("unset credential override allows only mocked default ADC flow", async () => {
  const { calls, report } = await success();
  assert.equal(report.status, "SUCCESS");
  assert.equal(report.credentialEnvironmentResult, "DEFAULT_ADC_ALLOWED");
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
});

test("repository root credential path is rejected before ADC", async () => {
  const { calls, report } = await success({ credentialPath: REPOSITORY_ROOT });
  assert.equal(report.failureCode, "CREDENTIAL_ENVIRONMENT_REJECTED");
  assert.equal(calls.adc + calls.token + calls.fetch, 0);
});

test("repository descendant credential path is rejected before ADC", async () => {
  const { calls, report } = await success({ credentialPath: `${REPOSITORY_ROOT}\\credentials\\service.json` });
  assert.equal(report.failureCode, "CREDENTIAL_ENVIRONMENT_REJECTED");
  assert.equal(calls.adc + calls.token + calls.fetch, 0);
});

test("relative traversal resolving into the repository is rejected", () => {
  const result = inspectCredentialEnvironment({
    env: { GOOGLE_APPLICATION_CREDENTIALS: "nested\\..\\credentials\\service.json" },
    repositoryRoot: REPOSITORY_ROOT,
    pathApi: path.win32,
    fileExists: () => true,
    realpath: (value) => path.win32.resolve(value),
  });
  assert.deepEqual(result, { ok: false, failureCode: "CREDENTIAL_ENVIRONMENT_REJECTED" });
});

test("similar-prefix sibling is not falsely classified as repository descendant", () => {
  const result = inspectCredentialEnvironment({
    env: { GOOGLE_APPLICATION_CREDENTIALS: "C:\\workspace\\polish-learning-backup\\credential.json" },
    repositoryRoot: REPOSITORY_ROOT,
    pathApi: path.win32,
    fileExists: () => true,
    realpath: (value) => path.win32.resolve(value),
  });
  assert.deepEqual(result, { ok: true, result: "EXTERNAL_CREDENTIAL_PATH_ALLOWED" });
});

test("malformed or unresolvable configured credential path fails closed", () => {
  const result = inspectCredentialEnvironment({
    env: { GOOGLE_APPLICATION_CREDENTIALS: "C:\\outside\\broken.json" },
    repositoryRoot: REPOSITORY_ROOT,
    pathApi: path.win32,
    fileExists: () => { throw new Error("private credential path"); },
    realpath: () => { throw new Error("private credential path"); },
  });
  assert.deepEqual(result, { ok: false, failureCode: "CREDENTIAL_ENVIRONMENT_REJECTED" });
});

test("four exact GETs use frozen endpoints, field mask, quota header, redirect error, and one token", async () => {
  const { calls, report } = await success();
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
  assert.equal(calls.fetch, 4);
  for (let index = 0; index < 4; index += 1) {
    const [url, init] = calls.fetchArgs[index];
    assert.equal(url, CANDIDATES[index].endpoint);
    assert.equal(init.method, "GET");
    assert.equal(init.redirect, "error");
    assert.equal(init.headers["x-goog-user-project"], PROJECT_ID);
    assert.equal(new URL(url).searchParams.get("mask.fieldPaths"), "lessonId");
    assert.equal(Object.hasOwn(init, "body"), false);
  }
  assert.equal(REDIRECT_MODE, "error");
});

test("target-related environment overrides and CLI target handling cannot expand candidates", async () => {
  const { calls, report } = await success({ extraEnv: {
    PROJECT_ID: "other-project",
    LEVEL_ID: "A2",
    LESSON_ID: "A1_2",
    CANDIDATE_MODULE_IDS: "extra-module",
  } });
  assert.deepEqual(CANDIDATES.map((item) => item.moduleId), ["A1_M01_pruebaa1", "A1_M02_my_world", "A1_M03_daily_life", "A1_M04_around_me"]);
  assert.equal(report.candidateCount, 4);
  assert.equal(calls.fetch, 4);
  const source = fs.readFileSync(new URL("../scripts/migration/phase05A1_1ReturnedModulePointRead.mjs", import.meta.url), "utf8");
  assert.match(source, /process\.argv\.length !== 2/u);
  assert.doesNotMatch(source, /process\.argv\[[2-9]\]/u);
  assert.doesNotMatch(source, /runQuery|batchGet|listDocuments|structuredQuery|pageToken|nextPageToken/iu);
});

test("exact 404 is MISSING even when its bounded body is not JSON, and later candidates continue", async () => {
  const responses = [streamResponse(404, "arbitrary private 404 body"), found(1), streamResponse(404), streamResponse(404)];
  const { calls, report } = await success({ responses });
  assert.equal(report.status, "SUCCESS");
  assert.deepEqual(report.candidateResults.map((item) => item.result), ["MISSING", "FOUND", "MISSING", "MISSING"]);
  assert.equal(calls.fetch, 4);
  assert.equal(JSON.stringify(report).includes("arbitrary private 404 body"), false);
});

test("an exact 404 with no response body is still MISSING", async () => {
  const noBody404 = { status: 404, body: null };
  const { report } = await success({ responses: [noBody404, ...Array.from({ length: 3 }, () => streamResponse(404))] });
  assert.equal(report.status, "SUCCESS");
  assert.equal(report.candidateResults[0].result, "MISSING");
});

test("FOUND accepts exact name when lessonId is absent and does not synthesize it", async () => {
  const { report } = await success({ responses: [documentResponse(0), ...Array.from({ length: 3 }, () => streamResponse(404))] });
  assert.equal(report.candidateResults[0].result, "FOUND");
  assert.equal(Object.hasOwn(report.candidateResults[0], "lessonId"), false);
});

test("valid returned lessonId is safely emitted", async () => {
  const { report } = await success({ responses: [found(0, { lessonId: { stringValue: LESSON_ID } }), ...Array.from({ length: 3 }, () => streamResponse(404))] });
  assert.equal(report.candidateResults[0].lessonId, LESSON_ID);
});

test("wrong string lessonId fails closed", async () => {
  const { calls, report } = await success({ responses: [found(0, { lessonId: { stringValue: "A1_2" } })] });
  assert.equal(report.failureCode, "PROVIDER_PROJECTED_LESSON_ID_INVALID");
  assert.equal(calls.fetch, 1);
});

test("non-string or malformed lessonId representation fails closed", async () => {
  for (const lessonId of [{ integerValue: "1" }, { stringValue: "A1_1", booleanValue: true }, "A1_1"]) {
    const { calls, report } = await success({ responses: [found(0, { lessonId })] });
    assert.equal(report.failureCode, "PROVIDER_PROJECTED_LESSON_ID_INVALID");
    assert.equal(calls.fetch, 1);
  }
});

test("HTTP 201 and other non-200/non-404 statuses fail closed rather than using response.ok", async () => {
  for (const status of [201, 204, 401, 403, 429, 500, 503]) {
    const { calls, report } = await success({ responses: [streamResponse(status, "private error body")] });
    assert.equal(report.failureCode, "PROVIDER_HTTP_STATUS_UNEXPECTED");
    assert.equal(calls.fetch, 1);
    assert.equal(JSON.stringify(report).includes("private error body"), false);
  }
});

test("wrong project, database, level, module, lesson, descendant, and malformed resource names fail", async () => {
  const badNames = [
    "projects/other/databases/(default)/documents/levels/A1/modules/A1_M01_pruebaa1/lessons/A1_1",
    "projects/english-for-polish/databases/other/documents/levels/A1/modules/A1_M01_pruebaa1/lessons/A1_1",
    "projects/english-for-polish/databases/(default)/documents/levels/A2/modules/A1_M01_pruebaa1/lessons/A1_1",
    "projects/english-for-polish/databases/(default)/documents/levels/A1/modules/A1_M02_my_world/lessons/A1_1",
    "projects/english-for-polish/databases/(default)/documents/levels/A1/modules/A1_M01_pruebaa1/lessons/A1_2",
    `${CANDIDATES[0].resourceName}/child`,
    "malformed/resource/name",
  ];
  for (const name of badNames) {
    const { calls, report } = await success({ responses: [documentResponse(0, { name })] });
    assert.equal(report.failureCode, "PROVIDER_RESOURCE_IDENTITY_MISMATCH");
    assert.equal(calls.fetch, 1);
    assert.equal(JSON.stringify(report).includes(name), false);
  }
});

test("invalid top-level response shapes and extra unprojected fields fail safely", async () => {
  for (const body of ["not-json", "null", "[]", { name: CANDIDATES[0].resourceName, unexpected: "RAW" }, { name: CANDIDATES[0].resourceName, fields: { title: { stringValue: "private" } } }]) {
    const { calls, report } = await success({ responses: [streamResponse(200, body)] });
    assert.equal(report.failureCode, "PROVIDER_RESPONSE_INVALID");
    assert.equal(calls.fetch, 1);
    assert.equal(JSON.stringify(report).includes("private"), false);
  }
});

test("oversized streamed response is cancelled, fails closed, and is never retried", async () => {
  let cancelled = false;
  const oversized = {
    status: 200,
    body: new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(PER_RESPONSE_BYTE_LIMIT)); controller.enqueue(new Uint8Array(1)); },
      cancel() { cancelled = true; },
    }),
  };
  const { calls, report } = await success({ responses: [oversized] });
  assert.equal(report.failureCode, "PROVIDER_RESPONSE_TOO_LARGE");
  assert.equal(calls.fetch, 1);
  assert.equal(cancelled, true);
  assert.equal(PER_RESPONSE_BYTE_LIMIT, 65536);
  assert.equal(TOTAL_RESPONSE_BYTES_MAX, CANDIDATE_COUNT * PER_RESPONSE_BYTE_LIMIT);
});

test("zero FOUND results classify only the returned candidates", async () => {
  const { report } = await success();
  assert.equal(report.foundCount, 0);
  assert.equal(report.classification, "NO_MATCH_IN_RETURNED_MODULE_CANDIDATES");
  assert.equal(report.completeness, COMPLETENESS_LABEL);
  assert.equal(JSON.stringify(report).includes("ABSENT"), false);
});

test("one FOUND continues through remaining candidates and remains returned-candidate qualified", async () => {
  const responses = [found(0), streamResponse(404), streamResponse(404), streamResponse(404)];
  const { calls, report } = await success({ responses });
  assert.equal(calls.fetch, 4);
  assert.equal(report.foundCount, 1);
  assert.equal(report.classification, "UNIQUE_MATCH_IN_RETURNED_MODULE_CANDIDATES");
  assert.equal(report.completeness, COMPLETENESS_LABEL);
});

test("multiple FOUND results are detected after the first match", async () => {
  const responses = [found(0), found(1), streamResponse(404), found(3)];
  const { calls, report } = await success({ responses });
  assert.equal(calls.fetch, 4);
  assert.equal(report.foundCount, 3);
  assert.equal(report.classification, "MULTIPLE_MATCHES_IN_RETURNED_MODULE_CANDIDATES");
});

test("unexpected status stops immediately and unexecuted candidates are not marked missing", async () => {
  const responses = [found(0), streamResponse(404), streamResponse(500), streamResponse(404)];
  const { calls, report } = await success({ responses });
  assert.equal(calls.fetch, 3);
  assert.equal(report.failureCode, "PROVIDER_HTTP_STATUS_UNEXPECTED");
  assert.equal(report.testedCandidateCount, 2);
  assert.equal(report.candidateResults.length, 2);
  assert.deepEqual(report.candidateResults.map((item) => item.result), ["FOUND", "MISSING"]);
  assert.equal(report.candidateResults.some((item) => item.moduleId === CANDIDATE_MODULE_IDS[3]), false);
});

test("transport exception stops without retry or exposing raw exception details", async () => {
  const { calls, report } = await success({ fetchErrorAt: 1 });
  assert.equal(calls.fetch, 2);
  assert.equal(report.failureCode, "PROVIDER_FETCH_FAILED");
  assert.equal(JSON.stringify(report).includes("RAW provider exception"), false);
});

test("all requests share one token and enforce the frozen budgets", async () => {
  const { calls, report } = await success();
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
  assert.equal(calls.fetch, 4);
  assert.equal(HTTP_FETCHES_MAX, 4);
  assert.equal(LOGICAL_DOCUMENT_READS_MAX, 4);
  assert.equal(POINT_READS_MAX, 4);
  assert.equal(QUERY_REQUESTS_MAX, 0);
  assert.equal(RETRIES_MAX, 0);
  assert.equal(WRITES_MAX, 0);
  assert.equal(MAX_BILLABLE_DOCUMENT_READS, 4);
  assert.equal(report.maxLogicalDocumentReads, 4);
});

test("app setup and cleanup are bounded and app name collision fails closed", async () => {
  const normal = await success();
  assert.equal(normal.calls.init, 1);
  assert.equal(normal.calls.delete, 1);
  const collision = fixture({ existingApps: [{ name: APP_NAME }] });
  const report = await runA1_1ReturnedModulePointRead(collision.runtime);
  assert.equal(report.failureCode, "APP_NAME_COLLISION");
  assert.equal(collision.calls.token + collision.calls.fetch, 0);
});

test("failed token acquisition is bounded, sanitized, and performs no provider fetch", async () => {
  const context = fixture({ tokenError: new Error(`secret ${TOKEN} oauth.invalid`) });
  const report = await runA1_1ReturnedModulePointRead(context.runtime);
  assert.equal(report.failureCode, "TOKEN_ACQUISITION_FAILED");
  assert.equal(context.calls.adc, 1);
  assert.equal(context.calls.token, 1);
  assert.equal(context.calls.fetch, 0);
  assert.equal(JSON.stringify(report).includes(TOKEN), false);
});

test("all serialized output is sanitized of token, header, path, raw body, and OAuth details", async () => {
  const { calls, report } = await success({
    responses: [streamResponse(403, `Authorization: Bearer ${TOKEN} oauth.invalid private-body ADC_JSON account@example.com`)],
  });
  const output = JSON.stringify([report, calls.outputs]);
  for (const forbidden of [TOKEN, "Authorization", "oauth.invalid", "private-body", "ADC_JSON", "account@example.com", "credential-secret", REPOSITORY_ROOT]) {
    assert.equal(output.includes(forbidden), false);
  }
});

test("cleanup failure is sanitized and cannot turn partial evidence into success", async () => {
  const { calls, report } = await success({ cleanupError: new Error("raw cleanup secret") });
  assert.equal(calls.delete, 1);
  assert.equal(report.failureCode, "APP_CLEANUP_FAILED");
  assert.equal(JSON.stringify(report).includes("raw cleanup secret"), false);
});

test("provider activity remains completely mocked in this suite", async () => {
  const { calls, report } = await success();
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
  assert.equal(calls.fetch, 4);
  assert.equal(Object.hasOwn(calls, "realProvider"), false);
});
