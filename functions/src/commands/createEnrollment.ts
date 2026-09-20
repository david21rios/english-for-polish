import { COMMAND_TYPES, COURSE_STATUSES, MEMBERSHIP_STATUSES } from "@mipymetic/saas-contracts";
import { CREATE_ENROLLMENT_REQUIRED_CAPABILITY, createEnrollmentBehavioralPayload, validateCreateEnrollmentInput, validateCreateEnrollmentResult } from "@mipymetic/saas-contracts/commands";
import type { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { validatePersistedCourse, validatePersistedMembership, courseDocumentPath, membershipDocumentPath, privilegedCommandDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { randomUUID } from "node:crypto";
import { requireAuthenticatedActor, type VerifiedAuthenticationContext } from "../authorization/authenticatedActor.js";
import { resolveTenantAuthority } from "../authorization/authorityResolver.js";
import { requireCapability } from "../authorization/capabilities.js";
import type { CommandEnvelope } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { prepareCommandExecution } from "./executor.js";
import { completeCommandRecordInTransaction, validatePersistedCommandRecord } from "./commandRecord.js";
import { createPendingInTransaction } from "../persistence/enrollmentWriteStore.js";
import { runAuthoritativeTransaction } from "../persistence/transactionBoundary.js";
import type { AuthoritativeReaderPort, TransactionRunnerPort } from "../persistence/ports.js";

export interface CreateEnrollmentInput { readonly commandId: string; readonly correlationId: string; readonly tenantId: string; readonly membershipId: string; readonly courseId: string; }
export interface CreateEnrollmentDependencies { readonly auth: VerifiedAuthenticationContext | null; readonly reader: AuthoritativeReaderPort; readonly transactionRunner: TransactionRunnerPort; }
const fail = (code: keyof typeof BACKEND_ERROR_CODES, message: string): never => { throw new BackendError(code, message); };

export const createEnrollment = async (input: CreateEnrollmentInput, dependencies: CreateEnrollmentDependencies): Promise<Readonly<{ enrollmentId: string }>> => {
  if (!validateCreateEnrollmentInput(input).ok) return fail("INVALID_ARGUMENT", "CreateEnrollment input is invalid.");
  const actor = requireAuthenticatedActor(dependencies.auth);
  const authority = await resolveTenantAuthority(dependencies.reader, actor, input.tenantId, input.membershipId);
  requireCapability(authority.capabilities, CREATE_ENROLLMENT_REQUIRED_CAPABILITY);
  const payload = createEnrollmentBehavioralPayload(input as unknown as Record<string, unknown>) as Readonly<{ tenantId: string; membershipId: string; courseId: string }>;
  const envelope: CommandEnvelope = Object.freeze({ commandId: input.commandId, commandType: COMMAND_TYPES.CREATE_ENROLLMENT, correlationId: input.correlationId, tenantId: input.tenantId, payload });
  const prepared = await prepareCommandExecution({ auth: dependencies.auth, envelope, dependencies: { transactionRunner: dependencies.transactionRunner, resolveAuthority: async () => authority } });
  if (prepared.decision === "replay") {
    const replay = validateCreateEnrollmentResult(prepared.record.result);
    if (!replay.ok) return fail("CONTRACT_VIOLATION", "The replayed result is invalid.");
    return replay.value as Readonly<{ enrollmentId: string }>;
  }
  const result = Object.freeze({ enrollmentId: randomUUID() });
  await runAuthoritativeTransaction(dependencies.transactionRunner, async ({ transaction }) => {
        const command = await transaction.get(privilegedCommandDocumentPath(input.commandId), "privileged_command");
    if (!command.exists || !command.data) return fail("CONTRACT_VIOLATION", "The command record is missing.");
    const record = validatePersistedCommandRecord(command.data);
    const course = await transaction.get(courseDocumentPath(input.tenantId, input.courseId));
    if (!course.exists || !course.data) return fail("NOT_FOUND", "Course not found.");
    if (!validatePersistedCourse(course.data).ok) return fail("CONTRACT_VIOLATION", "Course is malformed.");
    if (course.data.status !== COURSE_STATUSES.ACTIVE) return fail("FAILED_PRECONDITION", "Course is not active.");
    const membership = await transaction.get(membershipDocumentPath(input.tenantId, input.membershipId));
    if (!membership.exists || !membership.data) return fail("NOT_FOUND", "Membership not found.");
    if (!validatePersistedMembership(membership.data).ok) return fail("CONTRACT_VIOLATION", "Membership is malformed.");
    if (membership.data.status !== MEMBERSHIP_STATUSES.APPROVED) return fail("FAILED_PRECONDITION", "Membership is not approved.");
    await createPendingInTransaction(transaction, { tenantId: input.tenantId, membershipId: input.membershipId, courseId: input.courseId, enrollmentId: result.enrollmentId });
    completeCommandRecordInTransaction(transaction, record, result);
  });
  return result;
};
