import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORIZATION_ENV,
  AUTHORIZATION_VALUE,
  COMPLETENESS_LABEL,
  DIRECT_ENDPOINT,
  DIRECT_RESOURCE_NAME,
  NESTED_ENDPOINT,
  NESTED_RESOURCE_NAME,
  POLICY_VERSIONS,
  PROJECT_ID,
  QUOTA_PROJECT_ENV,
  runPhase05A1_1PairedInventoryRead,
  runPhase05A1_1PairedInventoryReadForTest,
} from "../scripts/migration/phase05A1_1PairedInventoryRead.mjs";

const armedEnv = () => ({
  [AUTHORIZATION_ENV]: AUTHORIZATION_VALUE,
  [QUOTA_PROJECT_ENV]: PROJECT_ID,
});

const restDocument = (name, fields = { title: { stringValue: "safe title" }, privateUnknown: { stringValue: "private value" } }) => ({ name, fields });
const response = (status, body = "") => new Response(body, { status });
const responseWithContentLength = (status, body, declaredLength) => ({
  status,
  headers: { get: (name) => name.toLowerCase() === "content-length" ? declaredLength : null },
  body: new Response(body).body,
});
const streamedResponse = (status, chunks, declaredLength = null, counters = {}) => {
  let index = 0;
  const body = {
    async cancel() { counters.cancel = (counters.cancel ?? 0) + 1; },
    getReader() {
      return {
        async read() {
          if (index >= chunks.length) return { done: true };
          return { done: false, value: new TextEncoder().encode(chunks[index++]) };
        },
        async cancel() { counters.cancel = (counters.cancel ?? 0) + 1; },
        releaseLock() {},
      };
    },
  };
  return {
    status,
    headers: { get: (name) => name.toLowerCase() === "content-length" ? declaredLength : null },
    body,
  };
};

const runWith = async ({ responses = [response(200, JSON.stringify(restDocument(DIRECT_RESOURCE_NAME))), response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME, { moduleId: { stringValue: "A1_M01_pruebaa1" } })))], env = armedEnv(), args = [], expectedPolicyVersions } = {}) => {
  const calls = { adc: 0, token: 0, initialize: 0, delete: 0, fetch: [] };
  const credential = { async getAccessToken() { calls.token += 1; return { access_token: "test-token" }; } };
  const queue = [...responses];
  const runtime = {
    env,
    args,
    adminApi: { applicationDefault: () => { calls.adc += 1; return credential; }, getApps: () => [], initializeApp: async () => { calls.initialize += 1; return { name: "test-app" }; }, deleteApp: async () => { calls.delete += 1; } },
    fetch: async (url, init) => { calls.fetch.push({ url, init }); return queue.shift() ?? response(500, "extra request"); },
  };
  const result = expectedPolicyVersions === undefined
    ? await runPhase05A1_1PairedInventoryRead(runtime)
    : await runPhase05A1_1PairedInventoryReadForTest(runtime, expectedPolicyVersions);
  return { result, calls };
};

test("harness imports and asserts the exact shared policy versions", () => {
  assert.deepEqual(POLICY_VERSIONS, {
    restValue: "phase05-firestore-rest-value-v1",
    unknownFields: "phase05-lesson-unknown-fields-v1",
  });
});

test("argument, arming, quota, and credential guards run before ADC", async () => {
  for (const input of [
    { args: ["extra"] },
    { env: {} },
    { env: { ...armedEnv(), [QUOTA_PROJECT_ENV]: "other" } },
    { env: { ...armedEnv(), GOOGLE_APPLICATION_CREDENTIALS: "external.json" } },
  ]) {
    const { result, calls } = await runWith(input);
    assert.equal(result.status, "FAILED");
    assert.equal(calls.adc, 0);
    assert.equal(calls.token, 0);
    assert.equal(calls.fetch.length, 0);
  }
});

test("policy-version mismatch fails at its guard before ADC, token, or fetch", async () => {
  for (const expectedPolicyVersions of [
    { ...POLICY_VERSIONS, restValue: "wrong-rest-policy" },
    { ...POLICY_VERSIONS, unknownFields: "wrong-unknown-policy" },
  ]) {
    const { result, calls } = await runWith({ expectedPolicyVersions });
    assert.equal(result.status, "FAILED");
    assert.equal(result.failureCode, "POLICY_VERSION_MISMATCH");
    assert.equal(result.stage, "POLICY_VERSION_GUARD");
    assert.equal(calls.adc, 0);
    assert.equal(calls.token, 0);
    assert.equal(calls.fetch.length, 0);
  }
});

test("two exact sequential GETs use one token, redirect error, and no query or body", async () => {
  const { result, calls } = await runWith();
  assert.equal(result.status, "SUCCESS");
  assert.equal(calls.adc, 1);
  assert.equal(calls.token, 1);
  assert.equal(calls.fetch.length, 2);
  assert.deepEqual(calls.fetch.map((call) => call.url), [DIRECT_ENDPOINT, NESTED_ENDPOINT]);
  for (const { init } of calls.fetch) {
    assert.equal(init.method, "GET");
    assert.equal(init.redirect, "error");
    assert.equal(init.headers["x-goog-user-project"], PROJECT_ID);
    assert.equal(Object.hasOwn(init, "body"), false);
  }
  assert.equal(calls.delete, 1);
});

test("all four 200/404 pairs return acquisition-only classification", async () => {
  const pairs = [
    [[response(200, JSON.stringify(restDocument(DIRECT_RESOURCE_NAME))), response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME)))], "DIRECT_FOUND_NESTED_FOUND"],
    [[response(200, JSON.stringify(restDocument(DIRECT_RESOURCE_NAME))), response(404, "private nested 404")], "DIRECT_FOUND_NESTED_MISSING"],
    [[response(404, "private direct 404"), response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME)))], "DIRECT_MISSING_NESTED_FOUND"],
    [[response(404, "private direct 404"), response(404, "private nested 404")], "DIRECT_MISSING_NESTED_MISSING"],
  ];
  for (const [responses, classification] of pairs) {
    const { result, calls } = await runWith({ responses });
    assert.equal(result.status, "SUCCESS");
    assert.equal(result.pairedClassification, classification);
    assert.equal(calls.fetch.length, 2);
    assert.equal(result.completeness, COMPLETENESS_LABEL);
  }
});

test("direct unexpected status, malformed response, and identity mismatch stop before nested", async () => {
  const cases = [
    response(403, "private error"),
    response(200, "not-json"),
    response(200, JSON.stringify(restDocument("projects/wrong/databases/(default)/documents/levels/A1/lessons/A1_1"))),
  ];
  for (const first of cases) {
    const { result, calls } = await runWith({ responses: [first, response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME)))] });
    assert.equal(result.status, "FAILED");
    assert.equal(calls.fetch.length, 1);
    assert.equal(JSON.stringify(result).includes("private error"), false);
  }
});

test("nested unexpected status and malformed response fail without retries", async () => {
  for (const second of [response(503, "secret provider body"), response(200, "not-json")]) {
    const { result, calls } = await runWith({ responses: [response(404), second] });
    assert.equal(result.status, "FAILED");
    assert.equal(calls.fetch.length, 2);
    assert.equal(JSON.stringify(result).includes("secret provider body"), false);
  }
});

test("per-response byte limit accepts exact boundary and rejects one byte over", async () => {
  const padDocument = (name, fields) => {
    const text = JSON.stringify(restDocument(name, fields));
    return `${text}${" ".repeat(65536 - Buffer.byteLength(text))}`;
  };
  const direct = padDocument(DIRECT_RESOURCE_NAME, {});
  const nested = padDocument(NESTED_RESOURCE_NAME, { moduleId: { stringValue: "A1_M01_pruebaa1" } });
  const atLimit = await runWith({ responses: [response(200, direct), response(200, nested)] });
  assert.equal(atLimit.result.status, "SUCCESS");
  assert.equal(atLimit.result.totalResponseBytes, 131072);
  const oversized = await runWith({ responses: [response(200, "x".repeat(65537)), response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME)))] });
  assert.equal(oversized.result.status, "FAILED");
  assert.equal(oversized.result.failureCode, "PROVIDER_RESPONSE_TOO_LARGE");
  assert.deepEqual(oversized.result.oversizeEvidence, {
    mode: "STREAMED_RESPONSE_BODY",
    responseByteLimit: 65536,
    minimumObservedResponseBytesAtFailure: 65537,
  });
  assert.equal(oversized.calls.fetch.length, 1);
});

test("declared Content-Length one byte over is sanitized, cancels the body, and stops before nested request", async () => {
  const counters = {};
  const secretHeader = "65537";
  const declaredOversizeResponse = streamedResponse(200, ["private-body-marker"], secretHeader, counters);
  const { result, calls } = await runWith({ responses: [
    declaredOversizeResponse,
    response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME))),
  ] });
  assert.deepEqual(result.oversizeEvidence, {
    mode: "DECLARED_CONTENT_LENGTH",
    responseByteLimit: 65536,
    declaredContentLengthBytes: 65537,
  });
  assert.equal(result.failureCode, "PROVIDER_RESPONSE_TOO_LARGE");
  assert.equal(result.stage, "DIRECT_GET");
  assert.equal(result.requestCount, 1);
  assert.equal(calls.fetch.length, 1);
  assert.equal(typeof result.oversizeEvidence.declaredContentLengthBytes, "number");
  assert.equal(JSON.stringify(result).includes("private-body-marker"), false);
  assert.equal(counters.cancel, 1);
});

test("valid very large decimal Content-Length is compared exactly and omits unsafe numeric length", async () => {
  const veryLargeDeclaredLength = `${Number.MAX_SAFE_INTEGER + 1}${"9".repeat(30)}`;
  const { result, calls } = await runWith({ responses: [
    responseWithContentLength(200, "private-oversize-marker", veryLargeDeclaredLength),
    response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME))),
  ] });
  assert.deepEqual(result.oversizeEvidence, {
    mode: "DECLARED_CONTENT_LENGTH",
    responseByteLimit: 65536,
  });
  assert.equal(Object.hasOwn(result.oversizeEvidence, "declaredContentLengthBytes"), false);
  assert.equal(JSON.stringify(result).includes(veryLargeDeclaredLength), false);
  assert.equal(JSON.stringify(result).includes("private-oversize-marker"), false);
  assert.equal(result.failureCode, "PROVIDER_RESPONSE_TOO_LARGE");
  assert.equal(calls.fetch.length, 1);
});

test("malformed direct Content-Length remains invalid and has no oversize evidence", async () => {
  for (const declaredLength of ["not-a-number", "-1", "1.5"]) {
    const { result, calls } = await runWith({ responses: [
      responseWithContentLength(200, "private-body-marker", declaredLength),
      response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME))),
    ] });
    assert.equal(result.status, "FAILED");
    assert.equal(result.failureCode, "PROVIDER_RESPONSE_INVALID");
    assert.equal(result.stage, "DIRECT_GET");
    assert.equal(result.requestCount, 1);
    assert.equal(Object.hasOwn(result, "oversizeEvidence"), false);
    assert.equal(calls.fetch.length, 1);
    assert.equal(JSON.stringify(result).includes("private-body-marker"), false);
    assert.equal(JSON.stringify(result).includes(declaredLength), false);
  }
});

test("streamed overflow uses the same threshold evidence across chunk layouts and cancels without retry", async () => {
  const layouts = [
    ["stream-marker-", "x".repeat(65537 - "stream-marker-".length)],
    ["stream-marker-" + "x".repeat(40000 - "stream-marker-".length), "x".repeat(25537)],
  ];
  for (const chunks of layouts) {
    const counters = {};
    const oversizedStream = streamedResponse(200, chunks, null, counters);
    const { result, calls } = await runWith({ responses: [
      oversizedStream,
      response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME))),
    ] });
    assert.equal(result.failureCode, "PROVIDER_RESPONSE_TOO_LARGE");
    assert.equal(result.stage, "DIRECT_GET");
    assert.deepEqual(result.oversizeEvidence, {
      mode: "STREAMED_RESPONSE_BODY",
      responseByteLimit: 65536,
      minimumObservedResponseBytesAtFailure: 65537,
    });
    assert.equal(counters.cancel, 1);
    assert.equal(calls.fetch.length, 1);
    assert.equal(JSON.stringify(result).includes("stream-marker-"), false);
  }
});

test("nested response oversize fails after the direct read without retry or body leakage", async () => {
  const nestedSecret = `private-nested-body-${"x".repeat(65537)}`;
  const { result, calls } = await runWith({ responses: [
    response(200, JSON.stringify(restDocument(DIRECT_RESOURCE_NAME))),
    response(200, nestedSecret),
    response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME))),
  ] });
  assert.equal(result.status, "FAILED");
  assert.equal(result.stage, "NESTED_GET");
  assert.equal(result.requestCount, 2);
  assert.equal(result.totalResponseBytes, Buffer.byteLength(JSON.stringify(restDocument(DIRECT_RESOURCE_NAME))));
  assert.deepEqual(result.oversizeEvidence, {
    mode: "STREAMED_RESPONSE_BODY",
    responseByteLimit: 65536,
    minimumObservedResponseBytesAtFailure: 65537,
  });
  assert.equal(Object.hasOwn(result, "directResult"), false);
  assert.equal(calls.fetch.length, 2);
  assert.equal(JSON.stringify(result).includes("private-nested-body"), false);
});

test("real-run analog preserves direct byte accounting and emits only nested declared-length evidence", async () => {
  const directBody = JSON.stringify(restDocument(DIRECT_RESOURCE_NAME, { title: { stringValue: "x" } }));
  const paddedDirectBody = `${directBody}${" ".repeat(187 - Buffer.byteLength(directBody))}`;
  assert.equal(Buffer.byteLength(paddedDirectBody), 187);
  const nestedMarker = "private-nested-provider-body";
  const { result, calls } = await runWith({ responses: [
    response(200, paddedDirectBody),
    responseWithContentLength(200, nestedMarker, "65537"),
  ] });
  assert.equal(result.status, "FAILED");
  assert.equal(result.failureCode, "PROVIDER_RESPONSE_TOO_LARGE");
  assert.equal(result.stage, "NESTED_GET");
  assert.equal(result.requestCount, 2);
  assert.equal(result.totalResponseBytes, 187);
  assert.deepEqual(result.oversizeEvidence, {
    mode: "DECLARED_CONTENT_LENGTH",
    responseByteLimit: 65536,
    declaredContentLengthBytes: 65537,
  });
  assert.equal(Object.hasOwn(result, "directResult"), false);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("65537"), true);
  assert.equal(serialized.includes(nestedMarker), false);
  assert.equal(calls.fetch.length, 2);
});

test("direct and nested 404 response bodies are never emitted", async () => {
  const directSecret = "private-direct-404-marker";
  const nestedSecret = "private-nested-404-marker";
  const { result, calls } = await runWith({ responses: [
    response(404, directSecret),
    response(404, nestedSecret),
  ] });
  const serialized = JSON.stringify(result);
  assert.equal(result.status, "SUCCESS");
  assert.equal(result.directResult.result, "MISSING");
  assert.equal(result.nestedResult.result, "MISSING");
  assert.equal(serialized.includes(directSecret), false);
  assert.equal(serialized.includes(nestedSecret), false);
  assert.equal(calls.fetch.length, 2);
});

test("invalid direct known/unknown Values fail before nested and never leak raw payload", async () => {
  const secret = "raw-value-secret";
  const { result, calls } = await runWith({ responses: [
    response(200, JSON.stringify(restDocument(DIRECT_RESOURCE_NAME, { unknown: { stringValue: secret, extra: true } }))),
    response(200, JSON.stringify(restDocument(NESTED_RESOURCE_NAME))),
  ] });
  assert.equal(result.status, "FAILED");
  assert.equal(calls.fetch.length, 1);
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("successful output contains only approved schema and sanitized inventory", async () => {
  const { result } = await runWith();
  assert.deepEqual(Object.keys(result).sort(), [
    "completeness", "databaseId", "directResult", "directTarget", "lessonId", "levelId", "limits", "nestedResult", "nestedTarget", "pairedClassification", "policyVersions", "projectId", "providerTransport", "requestCount", "status", "totalResponseBytes",
  ].sort());
  assert.equal(JSON.stringify(result).includes("test-token"), false);
  assert.equal(JSON.stringify(result).includes("private value"), false);
  assert.equal(JSON.stringify(result).includes("access_token"), false);
  assert.deepEqual(result.limits, {
    maxProviderRequests: 2,
    maxLogicalDocumentReads: 2,
    maxQueryRequests: 0,
    maxIndexEntryOperations: 0,
    writes: 0,
    retries: 0,
    directResponseByteLimit: 65536,
    nestedResponseByteLimit: 65536,
    totalResponseByteLimit: 131072,
    missingDocumentBillingMinimum: "UNPROVEN",
  });
});
