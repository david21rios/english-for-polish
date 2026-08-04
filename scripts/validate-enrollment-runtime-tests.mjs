import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = Object.freeze({
  runtime: "tests/integration/saas/enrollment/enrollmentRepository.runtime.test.mjs",
  harness: "tests/integration/saas/enrollment/runtimeHarness.mjs",
  fixtures: "tests/integration/saas/enrollment/fixtures.mjs",
  rulesHelper: "tests/rules/helpers/rulesTestEnvironment.mjs"
});
const failures = [];
const requireCondition = (condition, message) => { if (!condition) failures.push(message); };

for (const path of Object.values(files)) await stat(resolve(root, path));
const sources = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name, path]) => [
  name, await readFile(resolve(root, path), "utf8")
])));

const metadata = new Map();
const register = (id, access) => {
  requireCondition(!metadata.has(id), `duplicate Test ID ${id}`);
  metadata.set(id, access);
};
for (const match of sources.runtime.matchAll(/runtime\(\s*"(RT-ENR-(?:REP|SEC)-\d{3})"\s*,\s*"(ALLOW|DENY)"/gu)) {
  register(match[1], match[2]);
}
const dynamicPointLoop = sources.runtime.match(/for\s*\(const\s*\[number, uid, tenantId, enrollmentId, allowed\]\s*of\s*\[([\s\S]*?)\]\)\s*runtime\(`RT-ENR-REP-\$\{number\}`\s*,\s*allowed\s*\?\s*"ALLOW"\s*:\s*"DENY"/u);
requireCondition(Boolean(dynamicPointLoop), "dynamic point-get registration loop is missing");
if (dynamicPointLoop) {
  for (const match of dynamicPointLoop[1].matchAll(/\["(\d{3})"[^\]]*,\s*(true|false)\]/gu)) {
    register(`RT-ENR-REP-${match[1]}`, match[2] === "true" ? "ALLOW" : "DENY");
  }
}
const loopSource = dynamicPointLoop ? sources.runtime.replace(dynamicPointLoop[0], "") : sources.runtime;
const loopPattern = /for\s*\(const\s*\[\s*number[^\]]*\]\s*of\s*\[([\s\S]*?)\]\)\s*runtime\(`RT-ENR-(REP|SEC)-\$\{number\}`\s*,\s*"(ALLOW|DENY)"/gu;
for (const match of loopSource.matchAll(loopPattern)) {
  const numbers = [...match[1].matchAll(/\["(\d{3})"/gu)].map((item) => item[1]);
  requireCondition(numbers.length > 0, `loop for RT-ENR-${match[2]} contains no IDs`);
  for (const number of numbers) register(`RT-ENR-${match[2]}-${number}`, match[3]);
}

const ids = [...metadata.keys()];
const allowCount = [...metadata.values()].filter((value) => value === "ALLOW").length;
const denyCount = [...metadata.values()].filter((value) => value === "DENY").length;
requireCondition(ids.length === 111, `expected 111 Test IDs, found ${ids.length}`);
requireCondition(new Set(ids).size === 111, `expected 111 unique Test IDs, found ${new Set(ids).size}`);
requireCondition(ids.every((id) => /^RT-ENR-(?:REP|SEC)-\d{3}$/u.test(id)), "invalid Enrollment Test ID prefix");
requireCondition(allowCount === 42, `expected 42 ALLOW cases, found ${allowCount}`);
requireCondition(denyCount === 69, `expected 69 DENY cases, found ${denyCount}`);

const contractErrors = new Set([
  "RT-ENR-REP-021", "RT-ENR-REP-113",
  ...Array.from({ length: 26 }, (_, index) => `RT-ENR-REP-${String(82 + index).padStart(3, "0")}`)
]);
const notFound = new Set();
requireCondition(contractErrors.size === 28, `expected 28 CONTRACT_ERROR IDs, found ${contractErrors.size}`);
requireCondition([...contractErrors].every((id) => metadata.get(id) === "DENY"), "CONTRACT_ERROR IDs must be DENY");
const successCount = allowCount;
const rulesDenyCount = [...metadata].filter(([id, access]) => access === "DENY" && !contractErrors.has(id)).length;
requireCondition(successCount === 42, `expected 42 SUCCESS cases, found ${successCount}`);
requireCondition(rulesDenyCount === 41, `expected 41 RULES_DENY cases, found ${rulesDenyCount}`);
requireCondition(notFound.size === 0, "expected 0 NOT_FOUND cases");
requireCondition(allowCount === successCount, "ALLOW must equal SUCCESS");
requireCondition(denyCount === rulesDenyCount + contractErrors.size + notFound.size, "DENY outcome invariant failed");
requireCondition(ids.length === allowCount + denyCount, "TOTAL access invariant failed");
requireCondition(ids.length === successCount + rulesDenyCount + contractErrors.size + notFound.size, "TOTAL outcome invariant failed");

for (const fragment of [
  "assert.equal(cases.length, 111)",
  'count("access", "ALLOW"), 42', 'count("access", "DENY"), 69',
  'count("outcome", "SUCCESS"), 42', 'count("outcome", "RULES_DENY"), 41',
  'count("outcome", "CONTRACT_ERROR"), 28', 'count("outcome", "NOT_FOUND"), 0',
  "new Set(allIds).size", "new Set(titles).size", "const uniqueTitle", "test(`${id} [${access}]"
]) requireCondition(sources.runtime.includes(fragment), `missing runtime self-control: ${fragment}`);
requireCondition(!/runtime\([^,]+,[^,]+,[^,]+,\s*(?:undefined|null)\s*[,)]/u.test(sources.runtime), "runtime case without executable assertion found");

requireCondition(sources.harness.includes("RULES_TEST_PROJECT_ID") &&
  sources.runtime.includes('assert.equal(PROJECT_ID, "demo-polish-learning")'), "demo project assertion is missing");
requireCondition(sources.rulesHelper.includes('readProjectFile("firestore.rules")') &&
  sources.rulesHelper.includes("firestore: { rules: firestoreRules }") && !sources.rulesHelper.includes("storage:"),
"Rules helper must load firestore.rules only");
const injectedSdk = sources.harness.match(/createEnrollmentRepository\(\{ db, sdk: \{([\s\S]*?)\}\s*\}\)/u)?.[1] ?? "";
for (const name of ["doc", "getDoc", "collection", "query", "where", "orderBy", "documentId", "limit", "startAfter", "getDocs"]) {
  requireCondition(new RegExp(`\\b${name}\\b`, "u").test(injectedSdk), `missing injected SDK dependency ${name}`);
}
for (const name of ["setDoc", "updateDoc", "deleteDoc", "collectionGroup"]) {
  requireCondition(!new RegExp(`\\b${name}\\b`, "u").test(injectedSdk), `forbidden injected SDK dependency ${name}`);
}

const combined = Object.values(sources).join("\n");
for (const [pattern, message] of [
  [/firebase\/storage|storage\.rules|--only storage|storage emulator/iu, "Storage reference found"],
  [/auth emulator|--only auth/iu, "Auth Emulator reference found"],
  [/src\/firebase\.js|src\\firebase\.js/iu, "global src/firebase.js reference found"],
  [/\bBuffer\b/u, "Node Buffer reference found"],
  [/[A-Za-z]:[\\/](?:Users|home|workspace)|\/(?:Users|home|workspace)\//u, "absolute local path found"],
  [/FIREBASE_TOKEN|GOOGLE_APPLICATION_CREDENTIALS|service account|\bsecret(?:s)?\b/iu, "credential, token, or secret reference found"],
  [/firebase\s+(?:deploy|login|use)\b/iu, "forbidden Firebase command found"],
  [/https?:\/\//iu, "network reference found"],
  [/\*\.mjs|enrollment\/\*/u, "runtime glob found"],
  [/\b(?:3000|4000|5000|8080|9099|9199):?\b/u, "hardcoded port found"]
]) requireCondition(!pattern.test(combined), message);
requireCondition(sources.harness.includes('from "firebase/firestore"') && !sources.harness.includes("firebase/app"),
  "harness must use the modular Firestore SDK only");
requireCondition(files.runtime === "tests/integration/saas/enrollment/enrollmentRepository.runtime.test.mjs",
  "precheck must target the explicit Enrollment runtime file");

if (failures.length > 0) {
  console.error(`Enrollment runtime precheck failed (${failures.length} failures).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Enrollment runtime tests: 111");
  console.log("ALLOW: 42");
  console.log("DENY: 69");
  console.log("SUCCESS: 42");
  console.log("RULES_DENY: 41");
  console.log("CONTRACT_ERROR: 28");
  console.log("NOT_FOUND: 0");
}
