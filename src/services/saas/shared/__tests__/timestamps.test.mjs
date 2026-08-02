import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REPOSITORY_ERROR_CODES,
  timestampToIsoString
} from "../index.js";

const ISO = "2026-08-02T12:34:56.000Z";

test("converts a Firestore-like timestamp through toDate", () => {
  assert.equal(timestampToIsoString({ toDate: () => new Date(ISO) }), ISO);
});

test("converts a Date to ISO-8601", () => {
  assert.equal(timestampToIsoString(new Date(ISO)), ISO);
});

test("preserves allowed null", () => {
  assert.equal(timestampToIsoString(null, { allowNull: true }), null);
});

for (const [label, value, options] of [
  ["disallowed null", null, undefined],
  ["arbitrary number", 123, undefined],
  ["timestamp string", ISO, undefined],
  ["unknown object", { seconds: 1 }, undefined],
  ["invalid Date", new Date("invalid"), undefined],
  ["invalid toDate result", { toDate: () => ISO }, undefined],
  ["throwing toDate", { toDate: () => { throw new Error("failure"); } }, undefined]
]) {
  test(`rejects ${label}`, () => {
    assert.throws(
      () => timestampToIsoString(value, options),
      (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
    );
  });
}
