import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = {
  runtime: "tests/integration/saas/registrationRequest/registrationRequestRepository.runtime.test.mjs",
  harness: "tests/integration/saas/registrationRequest/runtimeHarness.mjs",
  fixtures: "tests/integration/saas/registrationRequest/fixtures.mjs"
};
const entries = await Promise.all(Object.entries(files).map(async ([name, path]) => [
  name,
  await readFile(resolve(root, path), "utf8")
]));
const sources = Object.fromEntries(entries);
const failures = [];
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message);
};

const idMatches = [...sources.runtime.matchAll(/"(RT-RRQ-(?:REP|SEC)-\d{3})"/g)];
const ids = idMatches.map((match) => match[1]);
const uniqueIds = new Set(ids);
requireCondition(ids.length === 52, `expected 52 Test ID literals, found ${ids.length}`);
requireCondition(uniqueIds.size === 52, `expected 52 unique Test IDs, found ${uniqueIds.size}`);

const metadata = new Map(
  [...sources.runtime.matchAll(/runtime\(\s*"(RT-RRQ-(?:REP|SEC)-\d{3})"\s*,\s*"(ALLOW|DENY)"/g)]
    .map((match) => [match[1], match[2]])
);
const loopAllowIds = [...uniqueIds].filter((id) => !metadata.has(id));
const expectedLoopAllowIds = [
  "RT-RRQ-REP-020", "RT-RRQ-REP-021", "RT-RRQ-REP-022", "RT-RRQ-REP-023",
  "RT-RRQ-REP-024", "RT-RRQ-REP-040", "RT-RRQ-REP-041", "RT-RRQ-REP-042"
];
requireCondition(
  JSON.stringify(loopAllowIds.sort()) === JSON.stringify(expectedLoopAllowIds.sort()),
  "loop-generated ALLOW Test IDs do not match the approved set"
);
requireCondition(
  (sources.runtime.match(/runtime\(id, "ALLOW"/g) ?? []).length === 2,
  "expected two explicit ALLOW loop registrations"
);
for (const id of loopAllowIds) metadata.set(id, "ALLOW");

const allowCount = [...metadata.values()].filter((value) => value === "ALLOW").length;
const denyCount = [...metadata.values()].filter((value) => value === "DENY").length;
requireCondition(metadata.size === 52, `expected metadata for 52 Test IDs, found ${metadata.size}`);
requireCondition(allowCount === 34, `expected 34 ALLOW cases, found ${allowCount}`);
requireCondition(denyCount === 18, `expected 18 DENY cases, found ${denyCount}`);

const contractErrors = new Set([
  "RT-RRQ-REP-062", "RT-RRQ-REP-063", "RT-RRQ-REP-064", "RT-RRQ-REP-065"
]);
const notFound = new Set(["RT-RRQ-REP-006"]);
const successCount = [...metadata.values()].filter((value) => value === "ALLOW").length;
const rulesDenyCount = [...metadata].filter(([id, value]) => (
  value === "DENY" && !contractErrors.has(id) && !notFound.has(id)
)).length;
requireCondition(successCount === 34, `expected 34 SUCCESS cases, found ${successCount}`);
requireCondition(rulesDenyCount === 13, `expected 13 RULES_DENY cases, found ${rulesDenyCount}`);
requireCondition(contractErrors.size === 4, "expected 4 CONTRACT_ERROR cases");
requireCondition(notFound.size === 1, "expected 1 NOT_FOUND case");

requireCondition(
  sources.harness.includes('RULES_TEST_PROJECT_ID') &&
    sources.runtime.includes('assert.equal(PROJECT_ID, "demo-polish-learning")'),
  "runtime suite must enforce demo-polish-learning"
);
requireCondition(
  sources.runtime.includes("assert.equal(cases.length, 52)") &&
    sources.runtime.includes("expected === \"ALLOW\").length, 34") &&
    sources.runtime.includes("expected === \"DENY\").length, 18") &&
    sources.runtime.includes("outcome === \"SUCCESS\").length, 34") &&
    sources.runtime.includes("outcome === \"RULES_DENY\").length, 13") &&
    sources.runtime.includes("outcome === \"CONTRACT_ERROR\").length, 4") &&
    sources.runtime.includes("outcome === \"NOT_FOUND\").length, 1"),
  "runtime suite self-checks do not match the approved totals"
);

const combined = Object.values(sources).join("\n");
for (const [pattern, message] of [
  [/firebase\/storage|storage emulator|\bstorage\b/i, "Storage reference found"],
  [/src\/firebase\.js|src\\firebase\.js/i, "global src/firebase.js reference found"],
  [/[A-Za-z]:[\\/](?:Users|home|workspace)|\/(?:Users|home|workspace)\//, "absolute local path found"]
]) {
  requireCondition(!pattern.test(combined), message);
}

if (failures.length > 0) {
  console.error(`RegistrationRequest runtime precheck failed (${failures.length} failures).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("RegistrationRequest runtime tests: 52");
  console.log("ALLOW: 34");
  console.log("DENY: 18");
  console.log("SUCCESS: 34");
  console.log("RULES_DENY: 13");
  console.log("CONTRACT_ERROR: 4");
  console.log("NOT_FOUND: 1");
}
