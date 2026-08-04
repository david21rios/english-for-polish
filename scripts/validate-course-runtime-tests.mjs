import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = Object.freeze({
  runtime: "tests/integration/saas/course/courseRepository.runtime.test.mjs",
  harness: "tests/integration/saas/course/runtimeHarness.mjs",
  fixtures: "tests/integration/saas/course/fixtures.mjs",
  rulesHelper: "tests/rules/helpers/rulesTestEnvironment.mjs"
});
const failures = [];
const requireCondition = (condition, message) => { if (!condition) failures.push(message); };

for (const path of Object.values(files)) await stat(resolve(root, path));
const sources = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name, path]) => [
  name, await readFile(resolve(root, path), "utf8")
])));

const metadata = new Map();
const register = (id, expected) => {
  requireCondition(!metadata.has(id), `duplicate Test ID ${id}`);
  metadata.set(id, expected);
};
for (const match of sources.runtime.matchAll(/runtime\(\s*"(RT-CRS-(?:REP|SEC)-\d{3})"\s*,\s*"(ALLOW|DENY)"/gu)) {
  register(match[1], match[2]);
}
const dynamicPointLoop = sources.runtime.match(/for\s*\(const\s*\[id, uid, courseId, allowed\]\s*of\s*\[([\s\S]*?)\]\)\s*runtime\(`RT-CRS-REP-\$\{id\}`\s*,\s*allowed\s*\?\s*"ALLOW"\s*:\s*"DENY"/u);
requireCondition(Boolean(dynamicPointLoop), "dynamic point-get registration loop is missing");
if (dynamicPointLoop) {
  for (const match of dynamicPointLoop[1].matchAll(/\["(\d{3})"[^\]]*,\s*(true|false)\]/gu)) {
    register(`RT-CRS-REP-${match[1]}`, match[2] === "true" ? "ALLOW" : "DENY");
  }
}
const loopSource = dynamicPointLoop ? sources.runtime.replace(dynamicPointLoop[0], "") : sources.runtime;
const loopPattern = /for\s*\(const\s*\[\s*id[^\]]*\]\s*of\s*\[([\s\S]*?)\]\)\s*runtime\(`RT-CRS-(REP|SEC)-\$\{id\}`\s*,\s*"(ALLOW|DENY)"/gu;
for (const match of loopSource.matchAll(loopPattern)) {
  const ids = [...match[1].matchAll(/\["(\d{3})"/gu)].map((item) => item[1]);
  requireCondition(ids.length > 0, `loop for RT-CRS-${match[2]} contains no IDs`);
  for (const id of ids) register(`RT-CRS-${match[2]}-${id}`, match[3]);
}

const ids = [...metadata.keys()];
const uniqueIds = new Set(ids);
const allowCount = [...metadata.values()].filter((value) => value === "ALLOW").length;
const denyCount = [...metadata.values()].filter((value) => value === "DENY").length;
requireCondition(ids.length === 114, `expected 114 Test IDs, found ${ids.length}`);
requireCondition(uniqueIds.size === 114, `expected 114 unique Test IDs, found ${uniqueIds.size}`);
requireCondition([...uniqueIds].every((id) => /^RT-CRS-(?:REP|SEC)-\d{3}$/u.test(id)), "invalid Course Test ID prefix");
requireCondition(allowCount === 32, `expected 32 ALLOW cases, found ${allowCount}`);
requireCondition(denyCount === 82, `expected 82 DENY cases, found ${denyCount}`);

const contractErrors = new Set([
  "RT-CRS-REP-018",
  ...["063", "064", "065", "066", "067", "068", "069", "070"].map((id) => `RT-CRS-REP-${id}`),
  ...Array.from({ length: 21 }, (_, index) => String(110 + index).padStart(3, "0"))
    .filter((id) => !["124", "125", "126", "127"].includes(id))
    .map((id) => `RT-CRS-REP-${id}`)
]);
const notFound = new Set();
requireCondition(contractErrors.size === 26, `expected 26 CONTRACT_ERROR IDs, found ${contractErrors.size}`);
requireCondition([...contractErrors].every((id) => metadata.get(id) === "DENY"), "CONTRACT_ERROR IDs must be DENY");
const successCount = allowCount;
const rulesDenyCount = [...metadata].filter(([id, expected]) => expected === "DENY" && !contractErrors.has(id)).length;
requireCondition(successCount === 32, `expected 32 SUCCESS cases, found ${successCount}`);
requireCondition(rulesDenyCount === 56, `expected 56 RULES_DENY cases, found ${rulesDenyCount}`);
requireCondition(notFound.size === 0, "expected 0 NOT_FOUND cases");
requireCondition(allowCount === successCount, "ALLOW must equal SUCCESS");
requireCondition(denyCount === rulesDenyCount + contractErrors.size + notFound.size, "DENY outcome invariant failed");
requireCondition(ids.length === allowCount + denyCount, "TOTAL metadata invariant failed");

for (const fragment of [
  "assert.equal(cases.length, 114)",
  'count("expected", "ALLOW"), 32', 'count("expected", "DENY"), 82',
  'count("outcome", "SUCCESS"), 32', 'count("outcome", "RULES_DENY"), 56',
  'count("outcome", "CONTRACT_ERROR"), 26', 'count("outcome", "NOT_FOUND"), 0',
  "new Set(idsSeen).size"
]) requireCondition(sources.runtime.includes(fragment), `missing runtime self-control: ${fragment}`);
requireCondition(sources.runtime.includes("[${expected}]"), "runtime titles must render ALLOW/DENY metadata");

requireCondition(sources.harness.includes("RULES_TEST_PROJECT_ID") &&
  sources.runtime.includes('assert.equal(PROJECT_ID, "demo-polish-learning")'), "demo project assertion is missing");
requireCondition(sources.rulesHelper.includes('readProjectFile("firestore.rules")') &&
  sources.rulesHelper.includes("firestore: { rules: firestoreRules }") && !sources.rulesHelper.includes("storage:"),
  "Rules helper must load firestore.rules only");
const injectedSdk = sources.harness.match(/createCourseRepository\(\{ db, sdk: \{([\s\S]*?)\}\s*\}\)/u)?.[1] ?? "";
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
  [/\*\.mjs|course\/\*/u, "runtime glob found"],
  [/\b(?:3000|4000|5000|8080|9099|9199):?\b/u, "hardcoded port found"]
]) requireCondition(!pattern.test(combined), message);
requireCondition(sources.harness.includes('from "firebase/firestore"') && !sources.harness.includes("firebase/app"),
  "harness must use the modular Firestore SDK only");
requireCondition(files.runtime === "tests/integration/saas/course/courseRepository.runtime.test.mjs",
  "precheck must target the explicit Course runtime file");

if (failures.length > 0) {
  console.error(`Course runtime precheck failed (${failures.length} failures).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Course runtime tests: 114");
  console.log("ALLOW: 32");
  console.log("DENY: 82");
  console.log("SUCCESS: 32");
  console.log("RULES_DENY: 56");
  console.log("CONTRACT_ERROR: 26");
  console.log("NOT_FOUND: 0");
}
