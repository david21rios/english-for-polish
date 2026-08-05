import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as packageDomain from "@mipymetic/saas-contracts/domain";
import * as academicDomain from "../../../src/domain/academic/enums.js";
import { CAPABILITIES } from "../../../src/domain/authorization/capabilities.js";
import * as authorizationDomain from "../../../src/domain/authorization/enums.js";
import { ROLE_CAPABILITY_MATRIX } from "../../../src/domain/authorization/roleCapabilityMatrix.js";
import * as identityDomain from "../../../src/domain/identity/enums.js";
import * as organizationDomain from "../../../src/domain/organization/enums.js";
import * as workflowActorDomain from "../../../src/domain/workflow/actors.js";
import { COURSE_WORKFLOW } from "../../../src/domain/workflow/courseWorkflow.js";
import { ENROLLMENT_WORKFLOW } from "../../../src/domain/workflow/enrollmentWorkflow.js";
import { MEMBERSHIP_WORKFLOW } from "../../../src/domain/workflow/membershipWorkflow.js";
import { REGISTRATION_REQUEST_WORKFLOW } from "../../../src/domain/workflow/registrationRequestWorkflow.js";
import { TENANT_WORKFLOW } from "../../../src/domain/workflow/tenantWorkflow.js";

const expected = Object.freeze({
  ACCESS_STATES: ["pending_email_verification", "pending_tenant_approval", "active", "suspended", "rejected"],
  REGISTRATION_REQUEST_STATUSES: ["pending", "approved", "rejected", "cancelled", "expired"],
  TENANT_TYPES: ["university", "academy", "school", "company"],
  TENANT_STATUSES: ["active", "suspended", "archived"],
  MEMBERSHIP_STATUSES: ["approved", "suspended", "removed"],
  COURSE_STATUSES: ["draft", "active", "archived"],
  ENROLLMENT_STATUSES: ["pending", "active", "completed", "cancelled"],
  MEMBERSHIP_ROLES: ["student", "teacher", "tenant_admin"],
  PLATFORM_ROLES: ["platform_admin"],
  CAPABILITY_SCOPES: ["self", "tenant", "platform"],
  WORKFLOW_ACTORS: ["identity_self", "tenant_admin", "platform_admin", "platform_system"],
});

const domainAdapters = Object.freeze({
  ACCESS_STATES: identityDomain.ACCESS_STATES,
  REGISTRATION_REQUEST_STATUSES: identityDomain.REGISTRATION_REQUEST_STATUSES,
  TENANT_TYPES: organizationDomain.TENANT_TYPES,
  TENANT_STATUSES: organizationDomain.TENANT_STATUSES,
  MEMBERSHIP_STATUSES: organizationDomain.MEMBERSHIP_STATUSES,
  COURSE_STATUSES: academicDomain.COURSE_STATUSES,
  ENROLLMENT_STATUSES: academicDomain.ENROLLMENT_STATUSES,
  MEMBERSHIP_ROLES: organizationDomain.MEMBERSHIP_ROLES,
  PLATFORM_ROLES: authorizationDomain.PLATFORM_ROLES,
  CAPABILITY_SCOPES: authorizationDomain.CAPABILITY_SCOPES,
  WORKFLOW_ACTORS: workflowActorDomain.WORKFLOW_ACTORS,
});

test("Membership and platform roles remain separate and match Rules literals", async () => {
  const membershipRoles = Object.values(packageDomain.MEMBERSHIP_ROLES);
  const platformRoles = Object.values(packageDomain.PLATFORM_ROLES);
  assert.deepEqual(membershipRoles, ["student", "teacher", "tenant_admin"]);
  assert.deepEqual(platformRoles, ["platform_admin"]);
  assert.equal(membershipRoles.includes("platform_admin"), false);
  const rules = await readFile("firestore.rules", "utf8");
  for (const role of membershipRoles) assert.match(rules, new RegExp(`\\"${role}\\"`), role);
});

test("capability descriptors and role matrices use only migrated roles and scopes", () => {
  const scopes = new Set(Object.values(packageDomain.CAPABILITY_SCOPES));
  for (const capability of Object.values(CAPABILITIES)) assert.equal(scopes.has(capability.scope), true, capability.id);
  assert.deepEqual(Object.keys(ROLE_CAPABILITY_MATRIX.membershipRoles), Object.values(packageDomain.MEMBERSHIP_ROLES));
  assert.deepEqual(Object.keys(ROLE_CAPABILITY_MATRIX.platformRoles), Object.values(packageDomain.PLATFORM_ROLES));
});

test("all workflow actor references belong to the migrated actor contract", () => {
  const allowed = new Set([
    ...Object.values(packageDomain.WORKFLOW_ACTORS),
    packageDomain.MEMBERSHIP_ROLES.TEACHER,
  ]);
  const workflows = [TENANT_WORKFLOW, REGISTRATION_REQUEST_WORKFLOW, MEMBERSHIP_WORKFLOW, COURSE_WORKFLOW, ENROLLMENT_WORKFLOW];
  for (const workflow of workflows) {
    for (const actor of workflow.creationActors) assert.equal(allowed.has(actor), true, actor);
    for (const transition of workflow.transitions) {
      for (const actor of transition.actors) assert.equal(allowed.has(actor), true, actor);
    }
  }
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
