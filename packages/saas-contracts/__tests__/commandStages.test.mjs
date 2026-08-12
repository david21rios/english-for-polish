import assert from "node:assert/strict";
import test from "node:test";
import { COMMAND_RECORD_FIELDS, COMMAND_SCHEMA_VERSION, COMMAND_STATUSES, COMMAND_TYPES, PLATFORM_COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES, isCommandStatusStageAllowed, isPrivilegedCommandStageAllowed } from "@mipymetic/saas-contracts/commands";

test("privileged command stages and schema v2 are canonical", () => {
  assert.deepEqual(Object.keys(PRIVILEGED_COMMAND_STAGES), ["NOT_STARTED", "PREPARED", "COMPLETED"]);
  assert.deepEqual(Object.values(PRIVILEGED_COMMAND_STAGES), ["not_started", "prepared", "completed"]);
  assert.ok(Object.isFrozen(PRIVILEGED_COMMAND_STAGES));
  assert.equal(COMMAND_SCHEMA_VERSION, 2);
  assert.equal(COMMAND_RECORD_FIELDS.length, 19);
  assert.equal(COMMAND_RECORD_FIELDS.includes("stage"), true);
});

test("only approved platform commands use the stage catalog", () => {
  assert.deepEqual(PLATFORM_COMMAND_TYPES, [COMMAND_TYPES.BOOTSTRAP_PLATFORM_ADMINS, COMMAND_TYPES.RECOVER_PLATFORM_ADMIN, COMMAND_TYPES.REVOKE_PLATFORM_ADMIN]);
  for (const type of PLATFORM_COMMAND_TYPES) for (const stage of Object.values(PRIVILEGED_COMMAND_STAGES)) assert.equal(isPrivilegedCommandStageAllowed(type, stage), true);
  for (const type of Object.values(COMMAND_TYPES).filter((type) => !PLATFORM_COMMAND_TYPES.includes(type))) assert.equal(isPrivilegedCommandStageAllowed(type, PRIVILEGED_COMMAND_STAGES.NOT_STARTED), false);
  assert.equal(isPrivilegedCommandStageAllowed(COMMAND_TYPES.REVOKE_PLATFORM_ADMIN, "unknown"), false);
});

test("status-stage matrix is exact and fail-closed", () => {
  const allowed = new Map([
    [COMMAND_STATUSES.PENDING, ["not_started"]], [COMMAND_STATUSES.RUNNING, ["not_started", "prepared"]],
    [COMMAND_STATUSES.SUCCEEDED, ["completed"]], [COMMAND_STATUSES.FAILED_RETRYABLE, ["not_started"]],
    [COMMAND_STATUSES.FAILED_TERMINAL, ["not_started"]], [COMMAND_STATUSES.RECOVERY_REQUIRED, ["prepared"]],
  ]);
  for (const status of Object.values(COMMAND_STATUSES)) for (const stage of Object.values(PRIVILEGED_COMMAND_STAGES)) assert.equal(isCommandStatusStageAllowed(status, stage), allowed.get(status).includes(stage), `${status}/${stage}`);
  assert.equal(isCommandStatusStageAllowed("unknown", "not_started"), false);
});
