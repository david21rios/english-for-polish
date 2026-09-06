import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";

const rules = await readFile(new URL("../firestore.governance.rules", import.meta.url), "utf8");

test("Governance Rules are a deny-all ruleset (not a database-isolation claim)", () => {
  assert.match(rules, /rules_version\s*=\s*['"]2['"]\s*;/);
  assert.match(rules, /match\s+\/databases\/\{database\}\/documents/);
  assert.match(rules, /match\s+\/\{document=\*\*\}/);
  assert.match(rules, /allow\s+read\s*,\s*write\s*:\s*if\s+false\s*;/);
  assert.doesNotMatch(rules, /if\s+true|request\.auth|allow\s+(?!read\s*,\s*write)/);
});

test("Governance Rules deny unauthenticated reads and writes", { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async () => {
  const environment = await initializeTestEnvironment({ projectId: "demo-governance-named-db-probe", firestore: { rules } });
  try {
    const database = environment.unauthenticatedContext().firestore();
    const reference = doc(database, "governanceProbe", "semantic");
    await assertFails(getDoc(reference));
    await assertFails(setDoc(reference, { probe: true }));
  } finally {
    await environment.cleanup();
  }
});
