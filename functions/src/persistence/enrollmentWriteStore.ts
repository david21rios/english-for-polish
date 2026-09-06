import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { enrollmentDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import { BackendError } from "../errors/backendError.js";
import { runAuthoritativeTransaction } from "./transactionBoundary.js";
import { serverOwnedTimestamp, type TransactionRunnerPort } from "./ports.js";

export interface EnrollmentWriteInput {
  readonly tenantId: string;
  readonly membershipId: string;
  readonly courseId: string;
  readonly enrollmentId: string;
}

export interface EnrollmentWriteStore {
  createPending(input: EnrollmentWriteInput): Promise<void>;
}

const claimPath = ({ tenantId, membershipId, courseId }: EnrollmentWriteInput): string =>
  `tenants/${tenantId}/enrollmentClaims/${membershipId}/courses/${courseId}`;

const fail = (code: keyof typeof BACKEND_ERROR_CODES, message: string): never => {
  throw new BackendError(BACKEND_ERROR_CODES[code], message);
};
const identifier = (value: unknown, field: string): string => {
  const result = validateDocumentIdentifier(value, field);
  if (!result.ok) return fail("INVALID_ARGUMENT", `${field} is invalid.`);
  return result.value;
};
const validClaim = (data: Readonly<Record<string, unknown>> | null, input: EnrollmentWriteInput): boolean => {
  if (!data) return false;
  try {
    return identifier(data.tenantId, "tenantId") === input.tenantId
  && identifier(data.membershipId, "membershipId") === input.membershipId
  && identifier(data.courseId, "courseId") === input.courseId
  && identifier(data.enrollmentId, "enrollmentId") === data.enrollmentId
  && ["pending", "active"].includes(String(data.status))
  && data.createdAt !== undefined && data.updatedAt !== undefined;
  } catch { return false; }
};

export const enrollmentClaimDocumentPath = claimPath;

export const createEnrollmentWriteStore = (runner: TransactionRunnerPort): EnrollmentWriteStore =>
  Object.freeze({
    createPending: async (input: EnrollmentWriteInput): Promise<void> => {
      const normalized = Object.freeze({ tenantId: identifier(input.tenantId, "tenantId"), membershipId: identifier(input.membershipId, "membershipId"), courseId: identifier(input.courseId, "courseId"), enrollmentId: identifier(input.enrollmentId, "enrollmentId") });
      return runAuthoritativeTransaction(
      runner,
      async ({ transaction }) => {
        const claim = await transaction.get(claimPath(normalized));
        if (claim.exists) {
          const data = claim.data;
          if (!validClaim(data, normalized)) {
            return fail("FAILED_PRECONDITION", "Enrollment logical claim is malformed or inconsistent.");
          }
          const claimData = data as Readonly<Record<string, unknown>>;
          const holder = await transaction.get(enrollmentDocumentPath(normalized.tenantId, String(claimData.enrollmentId)));
          if (!holder.exists || !holder.data || holder.data.tenantId !== normalized.tenantId
            || holder.data.membershipId !== normalized.membershipId || holder.data.courseId !== normalized.courseId
            || holder.data.enrollmentId !== claimData.enrollmentId || !["pending", "active"].includes(String(holder.data.status))) {
            return fail("FAILED_PRECONDITION", "Enrollment logical claim holder is malformed or inconsistent.");
          }
          return fail("CONFLICT", "Enrollment logical claim is already owned.");
        }
        const now = serverOwnedTimestamp();
        transaction.create(enrollmentDocumentPath(normalized.tenantId, normalized.enrollmentId), {
          enrollmentId: normalized.enrollmentId, tenantId: normalized.tenantId,
          membershipId: normalized.membershipId, courseId: normalized.courseId,
          status: "pending", enrolledAt: now, updatedAt: now,
          completedAt: null, cancelledAt: null,
        });
        transaction.create(claimPath(normalized), {
          tenantId: normalized.tenantId, membershipId: normalized.membershipId,
          courseId: normalized.courseId, enrollmentId: normalized.enrollmentId,
          status: "pending", createdAt: now, updatedAt: now,
        });
      },
      );
    },
  });
