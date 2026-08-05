import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as packageDomain from "@mipymetic/saas-contracts/domain";
import * as academicDomain from "../../../src/domain/academic/enums.js";
import * as identityDomain from "../../../src/domain/identity/enums.js";
import * as organizationDomain from "../../../src/domain/organization/enums.js";

const expected = Object.freeze({
  ACCESS_STATES: ["pending_email_verification", "pending_tenant_approval", "active", "suspended", "rejected"],
  REGISTRATION_REQUEST_STATUSES: ["pending", "approved", "rejected", "cancelled", "expired"],
  TENANT_TYPES: ["university", "academy", "school", "company"],
  TENANT_STATUSES: ["active", "suspended", "archived"],
  MEMBERSHIP_STATUSES: ["approved", "suspended", "removed"],
  COURSE_STATUSES: ["draft", "active", "archived"],
  ENROLLMENT_STATUSES: ["pending", "active", "completed", "cancelled"],
});

const domainAdapters = Object.freeze({
  ACCESS_STATES: identityDomain.ACCESS_STATES,
  REGISTRATION_REQUEST_STATUSES: identityDomain.REGISTRATION_REQUEST_STATUSES,
  TENANT_TYPES: organizationDomain.TENANT_TYPES,
  TENANT_STATUSES: organizationDomain.TENANT_STATUSES,
  MEMBERSHIP_STATUSES: organizationDomain.MEMBERSHIP_STATUSES,
  COURSE_STATUSES: academicDomain.COURSE_STATUSES,
  ENROLLMENT_STATUSES: academicDomain.ENROLLMENT_STATUSES,
});

test("foundational Domain contracts preserve exact values, order and freezing", () => {
  for (const [name, values] of Object.entries(expected)) {
    assert.deepEqual(Object.values(packageDomain[name]), values, name);
    assert.equal(Object.isFrozen(packageDomain[name]), true, name);
  }
});

test("Domain adapters preserve package reference identity", () => {
  for (const name of Object.keys(expected)) {
    assert.strictEqual(domainAdapters[name], packageDomain[name], name);
  }
});

test("Rules literals remain a subset of the migrated persisted status contracts", async () => {
  const rules = await readFile("firestore.rules", "utf8");
  const persisted = new Set([
    ...expected.TENANT_STATUSES,
    ...expected.MEMBERSHIP_STATUSES,
    ...expected.COURSE_STATUSES,
    ...expected.ENROLLMENT_STATUSES,
  ]);
  const requiredRulesLiterals = [
    "active", "suspended", "archived", "approved", "removed",
    "draft", "completed", "cancelled",
  ];
  for (const value of requiredRulesLiterals) {
    assert.equal(persisted.has(value), true, value);
    assert.match(rules, new RegExp(`status\\s*==\\s*"${value}"|role\\s*==\\s*"${value}"`), value);
  }
});
