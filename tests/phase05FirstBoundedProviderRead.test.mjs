import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  COMPLETENESS_LABEL,
  FIRST_READ_AUTHORIZATION_ENV,
  FIRST_READ_AUTHORIZATION_VALUE,
  FIRST_READ_PACKET,
  MAX_DOCUMENTS,
  PROJECT_ID,
  QUOTA_PROJECT_ENV,
  REST_ENDPOINT,
  RESPONSE_BYTE_LIMIT,
  createRunQueryBody,
  inspectCredentialEnvironment,
  runPhase05FirstBoundedProviderRead,
} from "../scripts/migration/phase05FirstBoundedProviderRead.mjs";

const token = "mocked-token-do-not-print";
const prefix = "projects/english-for-polish/databases/(default)/documents/levels/A1/lessons/";
const makeDoc = (index, fields = {}) => ({
  name: `${prefix}lesson-${index}`,
  fields: {
    lessonId: { stringValue: `lesson-${index}` },
    title: { stringValue: `Title ${index}` },
    orderInModule: { integerValue: String(index) },
    status: { booleanValue: true },
    ...fields,
  },
  createTime: "PRIVATE_CREATE_TIME",
  updateTime: "PRIVATE_UPDATE_TIME",
  unexpected: { stringValue: "PRIVATE_UNPROJECTED" },
});

const response = (entries, { ok = true, status = 200 } = {}) => {
  const bytes = new TextEncoder().encode(JSON.stringify(entries));
  return {
    ok,
    status,
    body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
  };
};

const fixture = ({ authorization = FIRST_READ_AUTHORIZATION_VALUE, quota = PROJECT_ID, credentialPath, fileExists, realpath, responseValue, fetchError, existingApps = [] } = {}) => {
  const calls = { adc: 0, token: 0, init: 0, delete: 0, fetch: 0, output: [] };
  const app = { name: "phase05-first-bounded-lesson-read" };
  const credential = { getAccessToken: async () => { calls.token += 1; return { access_token: token }; } };
  const runtime = {
    env: {
      [FIRST_READ_AUTHORIZATION_ENV]: authorization,
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
      deleteApp: async () => { calls.delete += 1; },
    },
    fetch: async (...args) => {
      calls.fetch += 1;
      calls.fetchArgs = args;
      if (fetchError) throw fetchError;
      return responseValue ?? response([]);
    },
    output: (value) => calls.output.push(value),
  };
  return { calls, runtime };
};

test("frozen request is the exact single projected StructuredQuery", () => {
  assert.deepEqual(createRunQueryBody(), {
    structuredQuery: {
      from: [{ collectionId: "lessons" }],
      select: { fields: ["lessonId", "levelId", "level", "nivel", "moduleId", "moduleTitle", "title", "titulo", "orderInModule", "status"].map((fieldPath) => ({ fieldPath })) },
      orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
      limit: 5,
    },
  });
  assert.equal(FIRST_READ_PACKET.fieldProjection.length, 10);
});

test("arming and quota guards fail before ADC, token, and network", async () => {
  for (const authorization of [undefined, "wrong"]) {
    const { calls, runtime } = fixture({ authorization });
    if (authorization === undefined) delete runtime.env[FIRST_READ_AUTHORIZATION_ENV];
    const report = await runPhase05FirstBoundedProviderRead(runtime);
    assert.equal(report.category, "EXECUTION_NOT_AUTHORIZED");
    assert.equal(calls.adc + calls.token + calls.fetch, 0);
  }
  for (const quota of [undefined, "wrong-project"]) {
    const { calls, runtime } = fixture({ quota });
    if (quota === undefined) delete runtime.env[QUOTA_PROJECT_ENV];
    const report = await runPhase05FirstBoundedProviderRead(runtime);
    assert.equal(report.category, "QUOTA_PROJECT_INVALID");
    assert.equal(calls.adc + calls.token + calls.fetch, 0);
  }
});

test("unset and external credential paths allow mocked ADC progression", async () => {
  const unset = fixture();
  const unsetReport = await runPhase05FirstBoundedProviderRead(unset.runtime);
  assert.equal(unsetReport.status, "SUCCESS");
  assert.equal(unsetReport.credentialEnvironmentResult, "DEFAULT_ADC_ALLOWED");
  assert.equal(unset.calls.adc, 1);
  assert.equal(unset.calls.fetch, 1);

  const external = fixture({ credentialPath: "C:\\secrets\\adc.json" });
  const externalReport = await runPhase05FirstBoundedProviderRead(external.runtime);
  assert.equal(externalReport.status, "SUCCESS");
  assert.equal(externalReport.credentialEnvironmentResult, "EXTERNAL_CREDENTIAL_PATH_ALLOWED");
  assert.equal(external.calls.adc, 1);
  assert.equal(external.calls.fetch, 1);
});

test("repository root and descendant credential paths fail before ADC or network", async () => {
  for (const credentialPath of [
    "C:\\workspace\\polish-learning",
    "C:\\workspace\\polish-learning\\credentials\\service-account.json",
  ]) {
    const { calls, runtime } = fixture({ credentialPath });
    const report = await runPhase05FirstBoundedProviderRead(runtime);
    assert.equal(report.category, "REPOSITORY_LOCAL_CREDENTIAL_PATH_REJECTED");
    assert.equal(calls.adc, 0);
    assert.equal(calls.token, 0);
    assert.equal(calls.fetch, 0);
    assert.equal(JSON.stringify(report).includes(credentialPath), false);
  }
});

test("relative and traversal paths are normalized before repository containment checks", () => {
  const inspect = (configuredPath) => inspectCredentialEnvironment({
    env: { GOOGLE_APPLICATION_CREDENTIALS: configuredPath },
    repositoryRoot: "C:\\workspace\\polish-learning",
    pathApi: path.win32,
    fileExists: () => true,
    realpath: (value) => path.win32.resolve(value),
  });
  assert.equal(inspect("credentials\\service-account.json").category, "REPOSITORY_LOCAL_CREDENTIAL_PATH_REJECTED");
  assert.equal(inspect("nested\\..\\credentials\\service-account.json").category, "REPOSITORY_LOCAL_CREDENTIAL_PATH_REJECTED");
  assert.equal(inspect("..\\polish-learning\\credentials\\service-account.json").category, "REPOSITORY_LOCAL_CREDENTIAL_PATH_REJECTED");
});

test("similar-prefix sibling is external and malformed paths fail closed", () => {
  const shared = {
    repositoryRoot: "C:\\workspace\\polish-learning",
    pathApi: path.win32,
    fileExists: () => true,
  };
  const sibling = inspectCredentialEnvironment({
    ...shared,
    env: { GOOGLE_APPLICATION_CREDENTIALS: "C:\\workspace\\polish-learning-backup\\credential.json" },
    realpath: (value) => path.win32.resolve(value),
  });
  assert.deepEqual(sibling, { ok: true, result: "EXTERNAL_CREDENTIAL_PATH_ALLOWED" });
  const malformed = inspectCredentialEnvironment({
    ...shared,
    env: { GOOGLE_APPLICATION_CREDENTIALS: "C:\\secrets\\unresolvable.json" },
    realpath: () => { throw new Error("SECRET_PATH_MUST_NOT_ESCAPE"); },
  });
  assert.deepEqual(malformed, { ok: false, category: "CREDENTIAL_PATH_INVALID" });
});

test("all local preflight guards run before ADC and credential rejection reveals no path", async () => {
  const { calls, runtime } = fixture({
    credentialPath: "C:\\workspace\\polish-learning\\private\\secret.json",
  });
  const report = await runPhase05FirstBoundedProviderRead(runtime);
  assert.equal(report.category, "REPOSITORY_LOCAL_CREDENTIAL_PATH_REJECTED");
  assert.equal(calls.adc + calls.token + calls.fetch, 0);
  const serialized = JSON.stringify(report);
  for (const forbidden of ["private", "secret.json", token, "Authorization"]) assert.equal(serialized.includes(forbidden), false);
});

test("one ADC, one token, one REST fetch uses exact endpoint, headers, and body", async () => {
  const { calls, runtime } = fixture({ responseValue: response([{ document: makeDoc(1) }]) });
  const report = await runPhase05FirstBoundedProviderRead(runtime);
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
  assert.equal(calls.fetch, 1);
  const [url, init] = calls.fetchArgs;
  assert.equal(url, REST_ENDPOINT);
  assert.equal(init.method, "POST");
  assert.equal(init.redirect, "error");
  assert.equal(init.headers.Authorization, `Bearer ${token}`);
  assert.equal(init.headers["x-goog-user-project"], PROJECT_ID);
  assert.equal(init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(init.body), createRunQueryBody());
  assert.equal(report.completeness, COMPLETENESS_LABEL);
  assert.equal(JSON.stringify(report).includes(token), false);
  assert.equal(JSON.stringify(calls.output).includes(token), false);
});

test("zero, short, five, and excess provider entries remain page-local and at most five", async () => {
  for (const count of [0, 2, 5, 8]) {
    const { calls, runtime } = fixture({ responseValue: response(Array.from({ length: count }, (_, i) => ({ document: makeDoc(i + 1) }))) });
    const report = await runPhase05FirstBoundedProviderRead(runtime);
    assert.equal(report.status, "SUCCESS");
    assert.equal(report.returnedDocumentCount, Math.min(count, MAX_DOCUMENTS));
    assert.equal(report.documents.length <= 5, true);
    assert.equal(report.completeness, "PAGE_LOCAL_PARTIAL_OR_UNKNOWN");
    assert.equal(calls.fetch, 1);
    assert.equal(calls.token, 1);
  }
});

test("response is sanitized to approved scalar fields and safe identity only", async () => {
  const { runtime } = fixture({ responseValue: response([{ document: makeDoc(1, {
    level: { stringValue: "A1" },
    nivel: { nullValue: "NULL_VALUE" },
    moduleId: { integerValue: "9007199254740993" },
    moduleTitle: { mapValue: { fields: { private: { stringValue: "DO_NOT_LEAK" } } } },
    title: { stringValue: "Lesson" },
    titulo: { arrayValue: { values: [{ stringValue: "DO_NOT_LEAK" }] } },
    orderInModule: { doubleValue: 2.5 },
    status: { booleanValue: true },
  }) }]) });
  const report = await runPhase05FirstBoundedProviderRead(runtime);
  assert.deepEqual(report.documents[0], {
    documentId: "lesson-1",
    documentPath: "levels/A1/lessons/lesson-1",
    projectedFields: { lessonId: "lesson-1", level: "A1", nivel: null, title: "Lesson", orderInModule: 2.5, status: true },
  });
  const serialized = JSON.stringify(report);
  for (const forbidden of ["PRIVATE_CREATE_TIME", "PRIVATE_UPDATE_TIME", "PRIVATE_UNPROJECTED", "DO_NOT_LEAK", "mapValue", "arrayValue"]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("HTTP failures, thrown fetch, redirect errors, and malformed response never retry or leak", async () => {
  const cases = [503, 500, 429, 403].map((status) => fixture({ responseValue: response([], { ok: false, status }) }));
  cases.push(
    fixture({ fetchError: new Error("SECRET_TOKEN oauth.google.com private body") }),
    fixture({ responseValue: response("not-json") }),
    fixture({ responseValue: { ok: true, body: null } }),
  );
  for (const { calls, runtime } of cases) {
    const report = await runPhase05FirstBoundedProviderRead(runtime);
    assert.equal(report.status, "FAILURE");
    assert.equal(calls.fetch, 1);
    assert.equal(calls.token, 1);
    assert.equal(JSON.stringify(report).includes("SECRET_TOKEN"), false);
    assert.equal(JSON.stringify(report).includes("oauth.google.com"), false);
  }
});

test("oversized streamed response is cancelled and fails without retry", async () => {
  let cancelled = false;
  const { calls, runtime } = fixture({ responseValue: {
    ok: true,
    body: new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(RESPONSE_BYTE_LIMIT)); controller.enqueue(new Uint8Array(1)); },
      cancel() { cancelled = true; },
    }),
  } });
  const report = await runPhase05FirstBoundedProviderRead(runtime);
  assert.equal(report.category, "RESPONSE_TOO_LARGE");
  assert.equal(calls.fetch, 1);
  assert.equal(cancelled, true);
  assert.equal(JSON.stringify(report).includes("["), false);
});

test("REST framing and document identity are fail-closed", async () => {
  for (const entries of [{ document: makeDoc(1) }, [null], [{ document: { ...makeDoc(1), name: "outside/path" } }]]) {
    const { calls, runtime } = fixture({ responseValue: response(entries) });
    const report = await runPhase05FirstBoundedProviderRead(runtime);
    assert.equal(report.status, "FAILURE");
    assert.equal(calls.fetch, 1);
  }
  const { runtime } = fixture({ responseValue: response([{ readTime: "ignored" }]) });
  const validEmpty = await runPhase05FirstBoundedProviderRead(runtime);
  assert.equal(validEmpty.status, "SUCCESS");
  assert.equal(validEmpty.returnedDocumentCount, 0);
});

test("a response at the byte limit can be parsed and app cleanup is bounded", async () => {
  const validJson = `${JSON.stringify([{ readTime: "2026-11-07T00:00:00Z" }])}${" ".repeat(RESPONSE_BYTE_LIMIT - Buffer.byteLength(JSON.stringify([{ readTime: "2026-11-07T00:00:00Z" }])) )}`;
  const exactBytes = new TextEncoder().encode(validJson);
  assert.equal(exactBytes.byteLength, RESPONSE_BYTE_LIMIT);
  const { calls, runtime } = fixture({ responseValue: {
    ok: true,
    body: new ReadableStream({ start(controller) { controller.enqueue(exactBytes); controller.close(); } }),
  } });
  const report = await runPhase05FirstBoundedProviderRead(runtime);
  assert.equal(report.status, "SUCCESS");
  assert.equal(calls.init, 1);
  assert.equal(calls.delete, 1);
  assert.equal(RESPONSE_BYTE_LIMIT, 65536);
});
