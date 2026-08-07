import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import * as contracts from "@mipymetic/saas-contracts";
import * as auditContracts from "@mipymetic/saas-contracts/audit";
import * as authorityContracts from "@mipymetic/saas-contracts/authority";
import * as commandContracts from "@mipymetic/saas-contracts/commands";
import * as domainContracts from "@mipymetic/saas-contracts/domain";
import * as errorContracts from "@mipymetic/saas-contracts/errors";
import * as persistenceContracts from "@mipymetic/saas-contracts/persistence";
import * as validationContracts from "@mipymetic/saas-contracts/validation";

test("public API is explicit and stable", () => {
  const names = Object.keys(contracts);
  assert.equal(names.length, new Set(names).size);
  assert.ok(names.includes("TENANT_FIELDS"));
  assert.ok(names.includes("platformAuthorityDocumentPath"));
  assert.ok(names.includes("canonicalJsonStringify"));
});

test("export map subpaths resolve through the workspace package", () => {
  assert.strictEqual(persistenceContracts.COURSE_FIELDS, contracts.COURSE_FIELDS);
  assert.strictEqual(validationContracts.isPlainObject, contracts.isPlainObject);
  assert.strictEqual(commandContracts.COMMAND_TYPES, contracts.COMMAND_TYPES);
  assert.strictEqual(authorityContracts.PLATFORM_AUTHORITY, contracts.PLATFORM_AUTHORITY);
  assert.strictEqual(auditContracts.AUDIT_LEVELS, contracts.AUDIT_LEVELS);
  assert.strictEqual(errorContracts.COMMON_ERROR_CODES, contracts.COMMON_ERROR_CODES);
  assert.deepEqual(Object.keys(domainContracts), [
    "ACCESS_STATES",
    "ACCESS_STATE_CONTEXT",
    "ACCESS_STATE_PRECEDENCE",
    "CAPABILITY_SCOPES",
    "COURSE_STATUSES",
    "ENROLLMENT_STATUSES",
    "ENROLLMENT_STATUS_TRANSITIONS",
    "MEMBERSHIP_ROLES",
    "MEMBERSHIP_STATUSES",
    "MEMBERSHIP_STATUS_TRANSITIONS",
    "NULL_ACCESS_STATE_CASES",
    "PLATFORM_ROLES",
    "REGISTRATION_REQUEST_STATUSES",
    "TENANT_STATUSES",
    "TENANT_TYPES",
    "WORKFLOW_ACTORS",
  ]);
  assert.strictEqual(domainContracts.TENANT_STATUSES, contracts.TENANT_STATUSES);
});

test("physical field contracts preserve exact values and freezing", () => {
  assert.deepEqual(contracts.COURSE_FIELDS, ["courseId", "tenantId", "displayName", "description", "learningLanguage", "supportLanguageCode", "interfaceLanguages", "cefrLevel", "status", "createdAt", "updatedAt", "archivedAt"]);
  assert.ok(Object.isFrozen(contracts.COURSE_FIELDS));
  assert.strictEqual(contracts.COURSE_FIELDS, contracts.COURSE_REQUIRED_FIELDS);
});

test("identifier and path contracts reject noncanonical segments", () => {
  assert.equal(contracts.membershipDocumentPath("tenant-a", "membership-a"), "tenants/tenant-a/memberships/membership-a");
  assert.equal(contracts.platformAuthorityRegistryDocumentPath(), "platformControl/authorityRegistry");
  assert.throws(() => contracts.courseDocumentPath("tenant-a", "bad/id"), TypeError);
  assert.equal(contracts.validateDocumentIdentifier(" x ", "uid").ok, true);
  assert.equal(contracts.validateDocumentIdentifier("..", "uid").ok, false);
});

test("plain object, exact keys, enum and BCP 47 helpers are strict", () => {
  assert.equal(contracts.hasExactKeys({ a: 1 }, ["a"]), true);
  assert.equal(contracts.hasExactKeys({ a: 1, b: 2 }, ["a"]), false);
  assert.equal(contracts.isEnumValue("running", contracts.COMMAND_STATUSES), true);
  assert.equal(contracts.isEnumValue("RUNNING", contracts.COMMAND_STATUSES), false);
  assert.equal(contracts.isCanonicalBcp47("pl-PL"), true);
  assert.equal(contracts.isCanonicalBcp47("pl-pl"), false);
});

test("JSON utilities copy, freeze and serialize deterministically", () => {
  const input = { z: [2, { b: true }], a: "ą" };
  const copy = contracts.deepCopyJsonValue(input);
  assert.notStrictEqual(copy, input);
  assert.equal(contracts.canonicalJsonStringify(input), '{"a":"ą","z":[2,{"b":true}]}');
  contracts.deepFreezeJsonValue(copy);
  assert.ok(Object.isFrozen(copy));
  assert.ok(Object.isFrozen(copy.z));
  assert.deepEqual([...contracts.canonicalJsonUtf8({ a: "x" })], [123, 34, 97, 34, 58, 34, 120, 34, 125]);
  assert.throws(() => contracts.deepCopyJsonValue(new Date()), TypeError);
});

test("shared declarative contracts use exact approved values", () => {
  assert.deepEqual(Object.values(contracts.PLATFORM_AUTHORITY_STATUSES), ["provisioning", "active", "revoking", "revoked", "recovery_required"]);
  assert.deepEqual(Object.values(contracts.COMMAND_STATUSES), ["pending", "running", "succeeded", "failed_retryable", "failed_terminal", "recovery_required"]);
  assert.deepEqual(Object.values(contracts.AUDIT_LEVELS), ["basic", "privileged", "critical"]);
  assert.equal(contracts.BACKEND_ERROR_CODES.ALREADY_EXISTS, "ALREADY_EXISTS");
});

const walk = async (directory) => (await readdir(directory, { withFileTypes: true })).flatMap((entry) => {
  const location = path.join(directory, entry.name);
  return entry.isDirectory() ? [walk(location)] : [location];
});
const flatten = async (values) => (await Promise.all(values)).flat(Infinity);

test("dependency audit rejects forbidden package imports and runtime globals", async () => {
  const root = path.resolve("packages/saas-contracts/src");
  const files = await flatten(await walk(root));
  const forbidden = [/from\s+["'](?:firebase|firebase-admin|firebase-functions|react|react-dom|vite)/, /src\/firebase/, /\b(?:window|document|localStorage|sessionStorage|Buffer)\s*[.([]/, /node:(?:fs|path|process)/];
  for (const file of files.filter((name) => name.endsWith(".js"))) {
    const source = await readFile(file, "utf8");
    for (const pattern of forbidden) assert.equal(pattern.test(source), false, `${file} contains ${pattern}`);
  }
});
