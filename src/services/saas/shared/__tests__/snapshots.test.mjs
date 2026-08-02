import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REPOSITORY_ERROR_CODES,
  serializeSnapshot
} from "../index.js";

const snapshot = (data, { id = "doc-1", exists = true } = {}) => ({
  id,
  exists: () => exists,
  data: () => data,
  ref: { path: "must/not/escape" }
});

test("serializes an existing snapshot without exposing it", () => {
  const input = snapshot({ name: "Ada", optional: null });
  const result = serializeSnapshot(input, {
    allowedFields: ["name", "optional"],
    requiredFields: ["name"],
    resource: "example"
  });

  assert.deepEqual(result, {
    id: "doc-1",
    data: { name: "Ada", optional: null }
  });
  assert.notEqual(result, input);
  assert.equal("ref" in result, false);
});

test("supports the boolean exists shape", () => {
  assert.deepEqual(
    serializeSnapshot({ id: "doc-2", exists: true, data: () => ({ value: 1 }) }, {
      allowedFields: ["value"]
    }),
    { id: "doc-2", data: { value: 1 } }
  );
});

test("rejects a missing document", () => {
  assert.throws(
    () => serializeSnapshot(snapshot({}, { exists: false }), { allowedFields: [] }),
    (error) => error.code === REPOSITORY_ERROR_CODES.NOT_FOUND
  );
});

for (const [label, input] of [
  ["null data", null],
  ["array data", []],
  ["Date data", new Date()]
]) {
  test(`rejects ${label}`, () => {
    assert.throws(
      () => serializeSnapshot(snapshot(input), { allowedFields: [] }),
      (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
    );
  });
}

test("rejects unknown fields and reports only their names", () => {
  assert.throws(
    () => serializeSnapshot(snapshot({ allowed: 1, secret: "not echoed" }), {
      allowedFields: ["allowed"],
      resource: "example"
    }),
    (error) => (
      error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION &&
      JSON.stringify(error.details) === JSON.stringify({ fields: ["secret"] }) &&
      !error.message.includes("not echoed")
    )
  );
});

test("rejects a missing required field", () => {
  assert.throws(
    () => serializeSnapshot(snapshot({ optional: null }), {
      allowedFields: ["required", "optional"],
      requiredFields: ["required"]
    }),
    (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
  );
});

test("rejects an invalid document ID", () => {
  assert.throws(
    () => serializeSnapshot(snapshot({}, { id: " " }), { allowedFields: [] }),
    (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
  );
});
