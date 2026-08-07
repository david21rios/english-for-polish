import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as packageDomain from "@mipymetic/saas-contracts/domain";
import * as academicDomain from "../../../src/domain/academic/enums.js";
import { CAPABILITIES, CAPABILITY_IDS } from "../../../src/domain/authorization/capabilities.js";
import { IDENTITY_SELF_CAPABILITIES } from "../../../src/domain/authorization/identitySelfCapabilities.js";
import * as authorizationDomain from "../../../src/domain/authorization/enums.js";
import { ROLE_CAPABILITY_MATRIX } from "../../../src/domain/authorization/roleCapabilityMatrix.js";
import * as identityDomain from "../../../src/domain/identity/enums.js";
import * as accessStateDomain from "../../../src/domain/identity/accessStatePrecedence.js";
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

const expectedAccessPrecedence = Object.freeze([
  [1, "email_unverified", "pending_email_verification"],
  [2, "institutional_suspension", "suspended"],
  [3, "approved_membership", "active"],
  [4, "pending_request", "pending_tenant_approval"],
  [5, "rejected_request", "rejected"],
]);

test("access-state contracts preserve context, precedence, order and deep freezing", () => {
  assert.deepEqual(packageDomain.ACCESS_STATE_CONTEXT, {
    scope: "tenant", key: "uid + tenantId", requiresTenantId: true, outsideTenantResult: null,
  });
  assert.deepEqual(
    packageDomain.ACCESS_STATE_PRECEDENCE.map(({ priority, key, result }) => [priority, key, result]),
    expectedAccessPrecedence,
  );
  assert.deepEqual(packageDomain.NULL_ACCESS_STATE_CASES, [
    "any_identity_without_tenant_context",
    "verified_identity_without_registration_request",
    "cancelled_registration_request",
    "expired_registration_request",
    "removed_membership",
    "archived_tenant",
  ]);
  assert.equal(Object.isFrozen(packageDomain.ACCESS_STATE_CONTEXT), true);
  assert.equal(Object.isFrozen(packageDomain.ACCESS_STATE_PRECEDENCE), true);
  for (const rule of packageDomain.ACCESS_STATE_PRECEDENCE) assert.equal(Object.isFrozen(rule), true);
  assert.equal(Object.isFrozen(packageDomain.NULL_ACCESS_STATE_CASES), true);
  assert.strictEqual(accessStateDomain.ACCESS_STATE_CONTEXT, packageDomain.ACCESS_STATE_CONTEXT);
  assert.strictEqual(accessStateDomain.ACCESS_STATE_PRECEDENCE, packageDomain.ACCESS_STATE_PRECEDENCE);
  assert.strictEqual(accessStateDomain.NULL_ACCESS_STATE_CASES, packageDomain.NULL_ACCESS_STATE_CASES);
});

test("Membership and Enrollment transition maps preserve exact allowed and denied semantics", () => {
  assert.deepEqual(packageDomain.MEMBERSHIP_STATUS_TRANSITIONS, {
    approved: ["suspended", "removed"], suspended: ["approved", "removed"], removed: [],
  });
  assert.deepEqual(packageDomain.ENROLLMENT_STATUS_TRANSITIONS, {
    pending: ["active", "cancelled"], active: ["completed", "cancelled"], completed: [], cancelled: [],
  });
  for (const transitions of [
    packageDomain.MEMBERSHIP_STATUS_TRANSITIONS,
    packageDomain.ENROLLMENT_STATUS_TRANSITIONS,
  ]) {
    assert.equal(Object.isFrozen(transitions), true);
    for (const targets of Object.values(transitions)) assert.equal(Object.isFrozen(targets), true);
  }
  assert.strictEqual(organizationDomain.MEMBERSHIP_STATUS_TRANSITIONS, packageDomain.MEMBERSHIP_STATUS_TRANSITIONS);
  assert.strictEqual(academicDomain.ENROLLMENT_STATUS_TRANSITIONS, packageDomain.ENROLLMENT_STATUS_TRANSITIONS);
  assert.equal(packageDomain.MEMBERSHIP_STATUS_TRANSITIONS.removed.includes("approved"), false);
  assert.equal(packageDomain.ENROLLMENT_STATUS_TRANSITIONS.completed.includes("active"), false);
});

test("complete workflow descriptors remain Domain-owned and semantically unchanged", () => {
  const summaries = [
    [TENANT_WORKFLOW, "active", ["archived"], [["active", "suspended"], ["suspended", "active"], ["active", "archived"], ["suspended", "archived"]]],
    [REGISTRATION_REQUEST_WORKFLOW, "pending", ["approved", "rejected", "cancelled", "expired"], [["pending", "approved"], ["pending", "rejected"], ["pending", "cancelled"], ["pending", "expired"]]],
    [MEMBERSHIP_WORKFLOW, "approved", ["removed"], [["approved", "suspended"], ["approved", "removed"], ["suspended", "approved"], ["suspended", "removed"]]],
    [COURSE_WORKFLOW, "draft", ["archived"], [["draft", "active"], ["draft", "archived"], ["active", "archived"]]],
    [ENROLLMENT_WORKFLOW, "pending", ["completed", "cancelled"], [["pending", "active"], ["pending", "cancelled"], ["active", "completed"], ["active", "cancelled"]]],
  ];
  for (const [workflow, initial, terminal, transitions] of summaries) {
    assert.equal(workflow.initialState, initial);
    assert.deepEqual(workflow.terminalStates, terminal);
    assert.deepEqual(workflow.transitions.map(({ from, to }) => [from, to]), transitions);
    assert.equal(Object.isFrozen(workflow), true);
  }
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

test("capability catalog preserves exact IDs, order, descriptors and reference identity", () => {
  const expectedIds = [
    "identity.read_self", "identity.update_self",
    "tenant.read", "tenant.update", "tenant.manage_settings", "tenant.manage_branding",
    "membership.read_self", "membership.leave_self", "membership.list", "membership.suspend",
    "membership.restore", "membership.remove", "membership.change_role",
    "registration_request.create", "registration_request.read_self",
    "registration_request.cancel_self", "registration_request.list", "registration_request.review",
    "course.list", "course.read", "course.create", "course.update", "course.activate", "course.archive",
    "enrollment.read_self", "enrollment.list", "enrollment.create", "enrollment.update_status",
    "enrollment.cancel_self", "platform.tenant_list", "platform.tenant_read",
    "platform.tenant_create", "platform.tenant_update", "platform.tenant_suspend",
    "platform.tenant_restore", "platform.tenant_archive", "platform.identity_read",
  ];
  assert.deepEqual(Object.values(packageDomain.CAPABILITY_IDS), expectedIds);
  assert.deepEqual(Object.keys(packageDomain.CAPABILITIES), expectedIds);
  assert.equal(new Set(expectedIds).size, 37);
  assert.equal(Object.isFrozen(packageDomain.CAPABILITY_IDS), true);
  assert.equal(Object.isFrozen(packageDomain.CAPABILITIES), true);
  for (const [id, descriptor] of Object.entries(packageDomain.CAPABILITIES)) {
    assert.deepEqual(Object.keys(descriptor), ["id", "scope", "resource", "description"]);
    assert.equal(descriptor.id, id);
    assert.equal(Object.values(packageDomain.CAPABILITY_SCOPES).includes(descriptor.scope), true, id);
    assert.equal(Object.isFrozen(descriptor), true, id);
  }
  assert.strictEqual(CAPABILITY_IDS, packageDomain.CAPABILITY_IDS);
  assert.strictEqual(CAPABILITIES, packageDomain.CAPABILITIES);
});

test("self capabilities and role matrix preserve exact assignments and deep freezing", () => {
  assert.deepEqual(packageDomain.IDENTITY_SELF_CAPABILITIES, [
    "identity.read_self", "identity.update_self", "membership.leave_self",
    "registration_request.create", "registration_request.read_self",
    "registration_request.cancel_self",
  ]);
  assert.deepEqual(
    Object.fromEntries(Object.entries(packageDomain.ROLE_CAPABILITY_MATRIX.membershipRoles).map(([role, ids]) => [role, ids.length])),
    { student: 5, teacher: 8, tenant_admin: 23 },
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(packageDomain.ROLE_CAPABILITY_MATRIX.platformRoles).map(([role, ids]) => [role, ids.length])),
    { platform_admin: 8 },
  );
  assert.equal(Object.isFrozen(packageDomain.IDENTITY_SELF_CAPABILITIES), true);
  assert.equal(Object.isFrozen(packageDomain.ROLE_CAPABILITY_MATRIX), true);
  for (const family of Object.values(packageDomain.ROLE_CAPABILITY_MATRIX)) {
    assert.equal(Object.isFrozen(family), true);
    for (const ids of Object.values(family)) assert.equal(Object.isFrozen(ids), true);
  }
  assert.strictEqual(IDENTITY_SELF_CAPABILITIES, packageDomain.IDENTITY_SELF_CAPABILITIES);
  assert.strictEqual(ROLE_CAPABILITY_MATRIX, packageDomain.ROLE_CAPABILITY_MATRIX);
});

test("all assignments and workflow capability references resolve to the exact catalog", () => {
  const known = new Set(Object.values(packageDomain.CAPABILITY_IDS));
  const sources = [
    packageDomain.IDENTITY_SELF_CAPABILITIES,
    ...Object.values(packageDomain.ROLE_CAPABILITY_MATRIX.membershipRoles),
    ...Object.values(packageDomain.ROLE_CAPABILITY_MATRIX.platformRoles),
  ];
  for (const source of sources) {
    assert.equal(new Set(source).size, source.length);
    for (const id of source) assert.equal(known.has(id), true, id);
  }
  assert.deepEqual(Object.keys(packageDomain.ROLE_CAPABILITY_MATRIX.membershipRoles), ["student", "teacher", "tenant_admin"]);
  assert.deepEqual(Object.keys(packageDomain.ROLE_CAPABILITY_MATRIX.platformRoles), ["platform_admin"]);
  const workflows = [TENANT_WORKFLOW, REGISTRATION_REQUEST_WORKFLOW, MEMBERSHIP_WORKFLOW, COURSE_WORKFLOW, ENROLLMENT_WORKFLOW];
  for (const workflow of workflows) {
    for (const transition of workflow.transitions) {
      if (transition.requiredCapability) assert.equal(known.has(transition.requiredCapability), true, transition.requiredCapability);
      for (const id of Object.values(transition.requiredCapabilities ?? {})) assert.equal(known.has(id), true, id);
    }
  }
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
