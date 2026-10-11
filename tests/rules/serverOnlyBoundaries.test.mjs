import test, { after, before, beforeEach } from "node:test";
import { assertFails } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { seedDocuments, clearRulesTestData, stableTimestamp } from "./helpers/seedData.mjs";

let environment;

const tenantId = "tenant-server-only-r3-01";
const membershipId = "membership-server-only-r3-01";
const courseId = "course-server-only-r3-01";
const commandId = "command-server-only-r3-01";
const claimPath = ["tenants", tenantId, "enrollmentClaims", membershipId, "courses", courseId];

const student = () => environment.authenticatedContext("server-only-student-r3-01", {
  email: "server-only-student-r3-01@example.test",
});

const tenantAdmin = () => environment.authenticatedContext("server-only-admin-r3-01", {
  email: "server-only-admin-r3-01@example.test",
  role: "tenant_admin",
});

const anonymous = () => environment.unauthenticatedContext();

const commandData = () => ({
  commandId,
  commandType: "CREATE_ENROLLMENT",
  status: "succeeded",
  stage: "completed",
  createdAt: stableTimestamp(),
});

const claimData = () => ({
  tenantId,
  membershipId,
  courseId,
  enrollmentId: "enrollment-server-only-r3-01",
  status: "pending",
  createdAt: stableTimestamp(),
  updatedAt: stableTimestamp(),
});

before(async () => {
  environment = await createRulesTestEnvironment();
});

beforeEach(async () => {
  await clearRulesTestData(environment);
  await seedDocuments(environment, [
    [`privilegedCommands/${commandId}`, commandData()],
    [claimPath.join("/"), claimData()],
    [`tenants/${tenantId}`, { tenantId, status: "active" }],
    [`tenants/${tenantId}/memberships/${membershipId}`, {
      membershipId,
      tenantId,
      uid: "server-only-student-r3-01",
      role: "student",
      status: "approved",
    }],
  ]);
});

after(async () => {
  await environment?.cleanup();
});

test("PC-01 [DENY] unauthenticated client cannot read privileged command", async () => {
  await assertFails(getDoc(doc(anonymous().firestore(), "privilegedCommands", commandId)));
});

test("PC-02 [DENY] authenticated member cannot read privileged command", async () => {
  await assertFails(getDoc(doc(student().firestore(), "privilegedCommands", commandId)));
});

test("PC-03 [DENY] tenant_admin cannot read privileged command", async () => {
  await assertFails(getDoc(doc(tenantAdmin().firestore(), "privilegedCommands", commandId)));
});

test("PC-04 [DENY] tenant_admin cannot list privileged commands", async () => {
  await assertFails(getDocs(collection(tenantAdmin().firestore(), "privilegedCommands")));
});

test("PC-05 [DENY] tenant_admin cannot create privileged command", async () => {
  await assertFails(setDoc(doc(tenantAdmin().firestore(), "privilegedCommands", `${commandId}-create`), commandData()));
});

test("PC-06 [DENY] tenant_admin cannot update privileged command", async () => {
  await assertFails(updateDoc(doc(tenantAdmin().firestore(), "privilegedCommands", commandId), { stage: "failed" }));
});

test("PC-07 [DENY] tenant_admin cannot delete privileged command", async () => {
  await assertFails(deleteDoc(doc(tenantAdmin().firestore(), "privilegedCommands", commandId)));
});

test("EC-01 [DENY] unauthenticated client cannot read enrollment claim", async () => {
  await assertFails(getDoc(doc(anonymous().firestore(), ...claimPath)));
});

test("EC-02 [DENY] authenticated member cannot read enrollment claim", async () => {
  await assertFails(getDoc(doc(student().firestore(), ...claimPath)));
});

test("EC-03 [DENY] tenant_admin cannot read enrollment claim", async () => {
  await assertFails(getDoc(doc(tenantAdmin().firestore(), ...claimPath)));
});

test("EC-04 [DENY] tenant_admin cannot list enrollment claim courses", async () => {
  await assertFails(getDocs(collection(
    tenantAdmin().firestore(),
    "tenants",
    tenantId,
    "enrollmentClaims",
    membershipId,
    "courses",
  )));
});

test("EC-05 [DENY] tenant_admin cannot create enrollment claim", async () => {
  await assertFails(setDoc(doc(tenantAdmin().firestore(), ...claimPath), claimData()));
});

test("EC-06 [DENY] tenant_admin cannot update enrollment claim", async () => {
  await assertFails(updateDoc(doc(tenantAdmin().firestore(), ...claimPath), { status: "completed" }));
});

test("EC-07 [DENY] tenant_admin cannot delete enrollment claim", async () => {
  await assertFails(deleteDoc(doc(tenantAdmin().firestore(), ...claimPath)));
});
