import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, root), "utf8"));

test("Firestore configuration explicitly maps exactly the application and Governance databases", async () => {
  const config = await readJson("firebase.json");
  assert.ok(Array.isArray(config.firestore));
  assert.equal(config.firestore.length, 2);
  assert.deepEqual(config.firestore.map(({ database }) => database).sort(), ["(default)", "governance"]);
  assert.equal(new Set(config.firestore.map(({ database }) => database)).size, 2);
  for (const entry of config.firestore) assert.equal(Object.hasOwn(entry, "target"), false);
  assert.deepEqual(config.firestore.find(({ database }) => database === "(default)"), {
    database: "(default)", rules: "firestore.rules", indexes: "firestore.indexes.json",
  });
  assert.deepEqual(config.firestore.find(({ database }) => database === "governance"), {
    database: "governance", rules: "firestore.governance.rules", indexes: "firestore.governance.indexes.json",
  });
});

test("Governance index configuration is intentionally empty", async () => {
  const indexes = await readJson("firestore.governance.indexes.json");
  assert.deepEqual(indexes, { indexes: [], fieldOverrides: [] });
});
