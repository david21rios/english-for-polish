import assert from "node:assert/strict";
import test from "node:test";
import { serializeEnrollment } from "../enrollmentSerializer.js";
import { enrollmentData, snapshot, timestamp } from "./testDoubles.mjs";

test("[positive] serializes every canonical lifecycle state", () => {
  const cases = [
    ["pending", null, null], ["active", null, null],
    ["completed", timestamp(), null], ["cancelled", null, timestamp()]
  ];
  for (const [status, completedAt, cancelledAt] of cases) {
    const result = serializeEnrollment(snapshot(enrollmentData({ status, completedAt, cancelledAt })));
    assert.equal(result.status, status);
    assert.equal(result.completedAt, completedAt === null ? null : iso());
    assert.equal(result.cancelledAt, cancelledAt === null ? null : iso());
  }
});
const iso = () => "2026-08-03T12:00:00.000Z";
test("[positive] preserves exactly nine fields and converts timestamps", () => {
  const result = serializeEnrollment(snapshot());
  assert.deepEqual(Object.keys(result), ["enrollmentId", "tenantId", "membershipId", "courseId", "status",
    "enrolledAt", "updatedAt", "completedAt", "cancelledAt"]);
  assert.equal(result.enrolledAt, iso()); assert.equal(result.updatedAt, iso());
});
test("[positive] returns a new frozen object without mutating source", () => {
  const source = enrollmentData(); const result = serializeEnrollment(snapshot(source));
  assert.notEqual(result, source); assert(Object.isFrozen(result)); assert.equal(typeof source.enrolledAt.toDate, "function");
});
test("[negative] rejects each missing physical field", () => {
  for (const field of Object.keys(enrollmentData())) {
    const data = enrollmentData(); delete data[field];
    assert.throws(() => serializeEnrollment(snapshot(data)), (error) => error.code === "CONTRACT_VIOLATION");
  }
});
test("[negative] rejects unknown fields and non-plain data", () => {
  assert.throws(() => serializeEnrollment(snapshot(enrollmentData({ uid: "uid-1" }))));
  assert.throws(() => serializeEnrollment({ id: "enrollment-1", ref: { path: "tenants/tenant-1/enrollments/enrollment-1" }, exists: () => true, data: () => [] }));
});
test("[negative] rejects nonexistent snapshot", () => {
  assert.throws(() => serializeEnrollment({ exists: () => false }), (error) => error.code === "NOT_FOUND");
});
test("[negative] rejects invalid identifiers", () => {
  for (const [field, value] of [["enrollmentId", ""], ["tenantId", " "], ["membershipId", 4], ["courseId", null]]) {
    assert.throws(() => serializeEnrollment(snapshot(enrollmentData({ [field]: value }))));
  }
});
test("[negative] rejects snapshot, path and physical ID mismatches", () => {
  assert.throws(() => serializeEnrollment(snapshot(enrollmentData({ enrollmentId: "enrollment-2" }))));
  assert.throws(() => serializeEnrollment(snapshot(enrollmentData(), "tenants/tenant-2/enrollments/enrollment-1")));
  assert.throws(() => serializeEnrollment(snapshot(enrollmentData(), "tenants/tenant-1/enrollments/enrollment-2")));
});
test("[negative] rejects noncanonical path topology", () => {
  for (const path of ["organizations/tenant-1/enrollments/enrollment-1", "tenants/tenant-1/Enrollments/enrollment-1",
    "tenants/tenant-1/nested/enrollments/enrollment-1", "/tenants/tenant-1/enrollments/enrollment-1"]) {
    assert.throws(() => serializeEnrollment(snapshot(enrollmentData(), path)));
  }
});
test("[negative] enforces expected Tenant, Enrollment and Membership", () => {
  assert.throws(() => serializeEnrollment(snapshot(), { expectedTenantId: "tenant-2" }));
  assert.throws(() => serializeEnrollment(snapshot(), { expectedEnrollmentId: "enrollment-2" }));
  assert.throws(() => serializeEnrollment(snapshot(), { expectedMembershipId: "membership-2" }));
});
test("[negative] rejects unknown status and all invalid lifecycle combinations", () => {
  const invalid = [
    { status: "suspended" }, { status: "pending", completedAt: timestamp() },
    { status: "active", cancelledAt: timestamp() }, { status: "completed", completedAt: null },
    { status: "completed", completedAt: timestamp(), cancelledAt: timestamp() },
    { status: "cancelled", cancelledAt: null }, { status: "cancelled", completedAt: timestamp(), cancelledAt: timestamp() }
  ];
  for (const values of invalid) assert.throws(() => serializeEnrollment(snapshot(enrollmentData(values))));
});
test("[negative] rejects invalid required and terminal timestamps", () => {
  for (const field of ["enrolledAt", "updatedAt"]) assert.throws(() => serializeEnrollment(snapshot(enrollmentData({ [field]: "bad" }))));
  assert.throws(() => serializeEnrollment(snapshot(enrollmentData({ status: "completed", completedAt: "bad" }))));
  assert.throws(() => serializeEnrollment(snapshot(enrollmentData({ status: "cancelled", cancelledAt: "bad" }))));
});
