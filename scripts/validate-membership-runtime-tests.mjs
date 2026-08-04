import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = Object.freeze({
  runtime: "tests/integration/saas/membership/membershipRepository.runtime.test.mjs",
  harness: "tests/integration/saas/membership/runtimeHarness.mjs",
  fixtures: "tests/integration/saas/membership/fixtures.mjs"
});
const failures = [];
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const path of Object.values(files)) await stat(resolve(root, path));
const entries = await Promise.all(Object.entries(files).map(async ([name, path]) => [
  name,
  await readFile(resolve(root, path), "utf8")
]));
const sources = Object.fromEntries(entries);

const ids = [...sources.runtime.matchAll(/"(RT-MEM-(?:REP|SEC)-\d{3})"/g)]
  .map((match) => match[1]);
const uniqueIds = new Set(ids);
requireCondition(ids.length === 81, `expected 81 Test ID literals, found ${ids.length}`);
requireCondition(uniqueIds.size === 81, `expected 81 unique Test IDs, found ${uniqueIds.size}`);
requireCondition(
  [...uniqueIds].every((id) => /^RT-MEM-(?:REP|SEC)-\d{3}$/u.test(id)),
  "runtime suite contains a Test ID outside the approved prefixes"
);

const metadata = new Map(
  [...sources.runtime.matchAll(/runtime\(\s*"(RT-MEM-(?:REP|SEC)-\d{3})"\s*,\s*"(ALLOW|DENY)"/g)]
    .map((match) => [match[1], match[2]])
);
const loopAllowIds = [...uniqueIds].filter((id) => !metadata.has(id)).sort();
const expectedLoopAllowIds = [
  "RT-MEM-REP-030", "RT-MEM-REP-031", "RT-MEM-REP-032",
  "RT-MEM-REP-033", "RT-MEM-REP-034", "RT-MEM-REP-035",
  "RT-MEM-REP-050", "RT-MEM-REP-051", "RT-MEM-REP-052",
  "RT-MEM-REP-053", "RT-MEM-REP-054", "RT-MEM-REP-055"
];
requireCondition(
  JSON.stringify(loopAllowIds) === JSON.stringify(expectedLoopAllowIds),
  "loop-generated ALLOW Test IDs do not match the approved set"
);
requireCondition(
  (sources.runtime.match(/runtime\(id, "ALLOW"/g) ?? []).length === 4,
  "expected four explicit ALLOW loop registrations"
);
for (const id of loopAllowIds) metadata.set(id, "ALLOW");

const allowCount = [...metadata.values()].filter((value) => value === "ALLOW").length;
const denyCount = [...metadata.values()].filter((value) => value === "DENY").length;
requireCondition(metadata.size === 81, `expected metadata for 81 Test IDs, found ${metadata.size}`);
requireCondition(allowCount === 44, `expected 44 ALLOW cases, found ${allowCount}`);
requireCondition(denyCount === 37, `expected 37 DENY cases, found ${denyCount}`);

const contractErrors = new Set([
  "RT-MEM-REP-012",
  "RT-MEM-REP-072", "RT-MEM-REP-073", "RT-MEM-REP-074",
  "RT-MEM-REP-075", "RT-MEM-REP-076", "RT-MEM-REP-077",
  "RT-MEM-REP-078", "RT-MEM-REP-079", "RT-MEM-REP-080",
  "RT-MEM-REP-081"
]);
const notFound = new Set();
const allowedOutcomes = new Set(["SUCCESS", "RULES_DENY", "CONTRACT_ERROR", "NOT_FOUND"]);
const explicitOutcomes = [...sources.runtime.matchAll(/\},\s*"([A-Z_]+)"\);/g)]
  .map((match) => match[1]);
requireCondition(
  explicitOutcomes.every((outcome) => allowedOutcomes.has(outcome)),
  "runtime suite contains an unknown outcome"
);
requireCondition(
  [...contractErrors].every((id) => metadata.get(id) === "DENY"),
  "CONTRACT_ERROR must be classified as DENY"
);
const successCount = [...metadata.values()].filter((value) => value === "ALLOW").length;
const rulesDenyCount = [...metadata].filter(([id, value]) => (
  value === "DENY" && !contractErrors.has(id) && !notFound.has(id)
)).length;
requireCondition(successCount === 44, `expected 44 SUCCESS cases, found ${successCount}`);
requireCondition(rulesDenyCount === 26, `expected 26 RULES_DENY cases, found ${rulesDenyCount}`);
requireCondition(contractErrors.size === 11, "expected 11 CONTRACT_ERROR cases");
requireCondition(notFound.size === 0, "expected 0 NOT_FOUND cases");

requireCondition(
  sources.harness.includes("RULES_TEST_PROJECT_ID") &&
    sources.runtime.includes('assert.equal(PROJECT_ID, "demo-polish-learning")'),
  "runtime suite must enforce demo-polish-learning"
);
requireCondition(
  sources.runtime.includes("assert.equal(cases.length, 81)") &&
    sources.runtime.includes("expected === \"ALLOW\").length, 44") &&
    sources.runtime.includes("expected === \"DENY\").length, 37") &&
    sources.runtime.includes("outcome === \"SUCCESS\").length, 44") &&
    sources.runtime.includes("outcome === \"RULES_DENY\").length, 26") &&
    sources.runtime.includes("outcome === \"CONTRACT_ERROR\").length, 11") &&
    sources.runtime.includes("outcome === \"NOT_FOUND\").length, 0"),
  "runtime suite self-checks do not match the approved totals"
);
requireCondition(
  sources.runtime.includes("[${expected}]") &&
    sources.runtime.includes('expected === "ALLOW" ? "SUCCESS" : "RULES_DENY"'),
  "runtime metadata helper must render ALLOW/DENY and derive the default outcome"
);

const combined = Object.values(sources).join("\n");
for (const [pattern, message] of [
  [/firebase\/storage|storage\.rules|storage emulator|--only storage|\bstorage\b/iu, "Storage reference found"],
  [/src\/firebase\.js|src\\firebase\.js/iu, "global src/firebase.js reference found"],
  [/\bBuffer\b/u, "Node Buffer reference found"],
  [/[A-Za-z]:[\\/](?:Users|home|workspace)|\/(?:Users|home|workspace)\//u, "absolute local path found"],
  [/FIREBASE_TOKEN|GOOGLE_APPLICATION_CREDENTIALS|service account|\bsecret(?:s)?\b/iu, "credential, token, or secret reference found"],
  [/firebase\s+(?:deploy|login|use)\b/iu, "forbidden Firebase command found"],
  [/\*\.test\.mjs|tests\/integration\/saas\/membership\/\*/u, "runtime glob found"]
]) {
  requireCondition(!pattern.test(combined), message);
}
requireCondition(
  sources.harness.includes('from "firebase/firestore"') &&
    !sources.harness.includes("firebase/app"),
  "harness must use the modular Firestore SDK only"
);
requireCondition(
  files.runtime === "tests/integration/saas/membership/membershipRepository.runtime.test.mjs",
  "runtime precheck must target the explicit Membership test file"
);

if (failures.length > 0) {
  console.error(`Membership runtime precheck failed (${failures.length} failures).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Membership runtime tests: 81");
  console.log("ALLOW: 44");
  console.log("DENY: 37");
  console.log("SUCCESS: 44");
  console.log("RULES_DENY: 26");
  console.log("CONTRACT_ERROR: 11");
  console.log("NOT_FOUND: 0");
}
