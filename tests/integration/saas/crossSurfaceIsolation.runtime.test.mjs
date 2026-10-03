import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { createRequire } from "node:module";
import { randomUUID, generateKeyPairSync } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const functionsPackage = path.join(repositoryRoot, "functions", "package.json");
const functionsRequire = createRequire(pathToFileURL(functionsPackage));
const { cert, deleteApp, initializeApp } = functionsRequire("firebase-admin/app");
const { getFirestore } = functionsRequire("firebase-admin/firestore");
const { createEnrollment } = await import(pathToFileURL(
  path.join(repositoryRoot, "functions", "lib", "commands", "createEnrollment.js")
).href);
const firestoreAdapter = await import(pathToFileURL(
  path.join(repositoryRoot, "functions", "lib", "persistence", "adapters", "firestore.js")
).href);

const PROJECT_ID = "demo-polish-learning";
const runId = randomUUID().replaceAll("-", "").slice(0, 16);
const tenantA = `tenant-cross-a-${runId}`;
const tenantB = `tenant-cross-b-${runId}`;
const actorA = `actor-cross-a-${runId}`;
const actorB = `actor-cross-b-${runId}`;
const sharedMembershipId = `membership-shared-${runId}`;
const sharedCourseId = `course-shared-${runId}`;
const sharedEnrollmentId = `enrollment-shared-${runId}`;
const sharedRequestId = `request-shared-${runId}`;
const foreignMembershipId = `membership-foreign-${runId}`;
const foreignCourseId = `course-foreign-${runId}`;
const commandMembershipId = `membership-command-${runId}`;
const commandCourseId = `course-command-${runId}`;
const timestamp = "2026-08-04T12:00:00.000Z";

const tenantPath = (tenantId) => `tenants/${tenantId}`;
const identityPath = (uid) => `identities/${uid}`;
const membershipPath = (tenantId, membershipId) => `${tenantPath(tenantId)}/memberships/${membershipId}`;
const coursePath = (tenantId, courseId) => `${tenantPath(tenantId)}/courses/${courseId}`;
const requestPath = (tenantId, requestId) => `${tenantPath(tenantId)}/registrationRequests/${requestId}`;
const enrollmentPath = (tenantId, enrollmentId) => `${tenantPath(tenantId)}/enrollments/${enrollmentId}`;
const claimPath = (tenantId, membershipId, courseId) => `${tenantPath(tenantId)}/enrollmentClaims/${membershipId}/courses/${courseId}`;
const commandPath = (commandId) => `privilegedCommands/${commandId}`;

const tenant = (tenantId, shortName) => ({
  tenantId, tenantType: "university", displayName: `Tenant ${shortName}`, shortName,
  country: "PL", locale: "pl-PL", timezone: "Europe/Warsaw", status: "active",
  createdAt: timestamp, updatedAt: timestamp, suspendedAt: null, archivedAt: null,
});

const membership = (tenantId, membershipId, uid) => ({
  membershipId, tenantId, uid, role: "tenant_admin", status: "approved",
  originRequestId: null, createdAt: timestamp, approvedAt: timestamp, approvedBy: uid,
  updatedAt: timestamp, suspendedAt: null, removedAt: null,
});

const course = (tenantId, courseId, displayName) => ({
  courseId, tenantId, displayName, description: `Course ${displayName}`,
  learningLanguage: { languageCode: "pl-PL", displayName: "Polish" },
  supportLanguageCode: "en-US", interfaceLanguages: [{ locale: "en-US", displayName: "English" }],
  cefrLevel: "A1", version: 1, status: "active",
  createdAt: timestamp, updatedAt: timestamp, archivedAt: null,
});

const enrollment = (tenantId, enrollmentId, membershipId, courseId) => ({
  enrollmentId, tenantId, membershipId, courseId, status: "pending",
  enrolledAt: timestamp, updatedAt: timestamp, completedAt: null, cancelledAt: null,
});

const claim = (tenantId, membershipId, courseId, enrollmentId) => ({
  tenantId, membershipId, courseId, enrollmentId, status: "pending",
  createdAt: timestamp, updatedAt: timestamp,
});

const approvedRequest = (tenantId, requestId, membershipId, uid) => ({
  requestId, tenantId, uid, requestedRole: "tenant_admin", status: "approved",
  requestedAt: timestamp, reviewedAt: timestamp, reviewedBy: uid,
  approvedMembershipId: membershipId, cancelledAt: null, expiredAt: null,
});

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const app = initializeApp({
  credential: cert({
    projectId: PROJECT_ID,
    clientEmail: `cross-surface-${runId}@example.invalid`,
    privateKey: privateKey.export({ format: "pem", type: "pkcs8" }),
  }),
}, `cross-surface-${runId}`);
const firestore = getFirestore(app);
const pathsOwnedByRun = new Set();

const set = async (pathName, value) => {
  pathsOwnedByRun.add(pathName);
  await firestore.doc(pathName).set(value);
};
const get = async (pathName) => (await firestore.doc(pathName).get()).data();
const remove = async (pathName) => {
  await firestore.doc(pathName).delete();
  pathsOwnedByRun.delete(pathName);
};
const assertCode = async (operation, code) => {
  await assert.rejects(operation, (error) => error?.code === code);
};

before(() => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
  assert.equal(process.env.GCLOUD_PROJECT, PROJECT_ID);
});

test("CROSS-001 path namespaces and claim state coexist for same IDs", async () => {
  await Promise.all([
    set(tenantPath(tenantA), tenant(tenantA, "A")),
    set(tenantPath(tenantB), tenant(tenantB, "B")),
    set(membershipPath(tenantA, sharedMembershipId), membership(tenantA, sharedMembershipId, actorA)),
    set(membershipPath(tenantB, sharedMembershipId), membership(tenantB, sharedMembershipId, actorB)),
    set(coursePath(tenantA, sharedCourseId), course(tenantA, sharedCourseId, "A")),
    set(coursePath(tenantB, sharedCourseId), course(tenantB, sharedCourseId, "B")),
    set(requestPath(tenantA, sharedRequestId), approvedRequest(tenantA, sharedRequestId, sharedMembershipId, actorA)),
    set(requestPath(tenantB, sharedRequestId), approvedRequest(tenantB, sharedRequestId, sharedMembershipId, actorB)),
    set(enrollmentPath(tenantA, sharedEnrollmentId), enrollment(tenantA, sharedEnrollmentId, sharedMembershipId, sharedCourseId)),
    set(enrollmentPath(tenantB, sharedEnrollmentId), enrollment(tenantB, sharedEnrollmentId, sharedMembershipId, sharedCourseId)),
    set(claimPath(tenantA, sharedMembershipId, sharedCourseId), claim(tenantA, sharedMembershipId, sharedCourseId, sharedEnrollmentId)),
    set(claimPath(tenantB, sharedMembershipId, sharedCourseId), claim(tenantB, sharedMembershipId, sharedCourseId, sharedEnrollmentId)),
  ]);

  assert.equal((await get(membershipPath(tenantA, sharedMembershipId))).tenantId, tenantA);
  assert.equal((await get(membershipPath(tenantB, sharedMembershipId))).tenantId, tenantB);
  assert.equal((await get(coursePath(tenantA, sharedCourseId))).tenantId, tenantA);
  assert.equal((await get(coursePath(tenantB, sharedCourseId))).tenantId, tenantB);
  assert.equal((await get(requestPath(tenantA, sharedRequestId))).tenantId, tenantA);
  assert.equal((await get(requestPath(tenantB, sharedRequestId))).tenantId, tenantB);
  assert.equal((await get(enrollmentPath(tenantA, sharedEnrollmentId))).tenantId, tenantA);
  assert.equal((await get(enrollmentPath(tenantB, sharedEnrollmentId))).tenantId, tenantB);
  assert.equal((await get(claimPath(tenantA, sharedMembershipId, sharedCourseId))).tenantId, tenantA);
  assert.equal((await get(claimPath(tenantB, sharedMembershipId, sharedCourseId))).tenantId, tenantB);

  await Promise.all([
    remove(membershipPath(tenantA, sharedMembershipId)),
    remove(coursePath(tenantA, sharedCourseId)),
    remove(requestPath(tenantA, sharedRequestId)),
    remove(enrollmentPath(tenantA, sharedEnrollmentId)),
    remove(claimPath(tenantA, sharedMembershipId, sharedCourseId)),
  ]);
  assert.equal((await get(membershipPath(tenantB, sharedMembershipId))).tenantId, tenantB);
  assert.equal((await get(coursePath(tenantB, sharedCourseId))).tenantId, tenantB);
  assert.equal((await get(requestPath(tenantB, sharedRequestId))).tenantId, tenantB);
  assert.equal((await get(enrollmentPath(tenantB, sharedEnrollmentId))).tenantId, tenantB);
  assert.equal((await get(claimPath(tenantB, sharedMembershipId, sharedCourseId))).tenantId, tenantB);
});

test("CROSS-002 a foreign Membership cannot satisfy tenant-A authority", async () => {
  await Promise.all([
    set(identityPath(actorA), { uid: actorA }),
    set(tenantPath(tenantA), tenant(tenantA, "A")),
    set(tenantPath(tenantB), tenant(tenantB, "B")),
    set(membershipPath(tenantB, foreignMembershipId), membership(tenantB, foreignMembershipId, actorA)),
    set(coursePath(tenantB, foreignCourseId), course(tenantB, foreignCourseId, "B")),
  ]);
  const input = {
    commandId: `cmd-cross-membership-${runId}`,
    correlationId: `corr-cross-membership-${runId}`,
    tenantId: tenantA,
    membershipId: foreignMembershipId,
    courseId: foreignCourseId,
  };
  await assertCode(
    () => createEnrollment(input, {
      auth: { uid: actorA, token: { email_verified: true } },
      reader: new firestoreAdapter.FirestoreAdminReader(firestore),
      transactionRunner: new firestoreAdapter.FirestoreAdminTransactionRunner(firestore),
    }),
    "FORBIDDEN",
  );
  assert.equal(await firestore.doc(commandPath(input.commandId)).get().then((snapshot) => snapshot.exists), false);
  assert.equal((await get(membershipPath(tenantB, foreignMembershipId))).tenantId, tenantB);
  assert.equal((await get(coursePath(tenantB, foreignCourseId))).tenantId, tenantB);
  assert.equal((await firestore.collection(`${tenantPath(tenantA)}/enrollments`).get()).empty, true);
  assert.equal((await get(claimPath(tenantA, foreignMembershipId, foreignCourseId))), undefined);
});

test("CROSS-003 a foreign Course cannot satisfy the tenant-A transaction", async () => {
  await Promise.all([
    set(identityPath(actorA), { uid: actorA }),
    set(tenantPath(tenantA), tenant(tenantA, "A")),
    set(tenantPath(tenantB), tenant(tenantB, "B")),
    set(membershipPath(tenantA, commandMembershipId), membership(tenantA, commandMembershipId, actorA)),
    set(membershipPath(tenantB, commandMembershipId), membership(tenantB, commandMembershipId, actorB)),
    set(coursePath(tenantB, commandCourseId), course(tenantB, commandCourseId, "B")),
  ]);
  const input = {
    commandId: `cmd-cross-course-${runId}`,
    correlationId: `corr-cross-course-${runId}`,
    tenantId: tenantA,
    membershipId: commandMembershipId,
    courseId: commandCourseId,
  };
  await assertCode(
    () => createEnrollment(input, {
      auth: { uid: actorA, token: { email_verified: true } },
      reader: new firestoreAdapter.FirestoreAdminReader(firestore),
      transactionRunner: new firestoreAdapter.FirestoreAdminTransactionRunner(firestore),
    }),
    "NOT_FOUND",
  );
  const command = await firestore.doc(commandPath(input.commandId)).get();
  assert.equal(command.exists, true);
  assert.equal(command.data().status, "pending");
  assert.equal(command.data().stage, "not_started");
  pathsOwnedByRun.add(commandPath(input.commandId));
  assert.equal((await firestore.collection(`${tenantPath(tenantA)}/enrollments`).get()).empty, true);
  assert.equal((await get(claimPath(tenantA, commandMembershipId, commandCourseId))), undefined);
  assert.equal((await get(coursePath(tenantB, commandCourseId))).tenantId, tenantB);
  assert.equal((await get(membershipPath(tenantB, commandMembershipId))).tenantId, tenantB);
});

after(async () => {
  for (const pathName of [...pathsOwnedByRun]) await remove(pathName);
  await deleteApp(app);
});
