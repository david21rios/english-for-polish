import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const readText = (path) => readFile(resolve(root, path), "utf8");
const failures = [];
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message);
};

const canonicalTests = [
  "tests/rules/messagesCreate.test.mjs",
  "tests/rules/forumPostCreate.test.mjs",
  "tests/rules/forumReplyCreate.test.mjs",
  "tests/rules/forumReportCreate.test.mjs",
  "tests/rules/supportTicketCreate.test.mjs",
  "tests/rules/selectiveHardeningRegression.test.mjs",
  "tests/rules/saasRegression.test.mjs",
];

const [rcText, packageText, workflowText, storageRules, firestoreRules] =
  await Promise.all([
    readText(".firebaserc"),
    readText("package.json"),
    readText(".github/workflows/firestore-rules-runtime.yml"),
    readText("storage.rules"),
    readText("firestore.rules"),
  ]);

const rc = JSON.parse(rcText);
const packageJson = JSON.parse(packageText);
const runtimeCommand = packageJson.scripts?.["test:rules:firestore"] ?? "";

requireCondition(
  JSON.stringify(rc) === JSON.stringify({ projects: { default: "demo-polish-learning" } }),
  ".firebaserc must contain only the demo-polish-learning default project",
);
requireCondition(runtimeCommand.length > 0, "missing test:rules:firestore script");
requireCondition(runtimeCommand.includes("firebase emulators:exec"), "runtime must use emulators:exec");
requireCondition(runtimeCommand.includes("--project demo-polish-learning"), "runtime must fix the demo project ID");
requireCondition(runtimeCommand.includes("--only firestore"), "runtime must start Firestore only");

for (const forbidden of [
  "storage", "--only auth", " deploy", " login", "projects:list", "gcloud",
  "FIREBASE_TOKEN", "GOOGLE_APPLICATION_CREDENTIALS", "*.test.mjs",
]) {
  requireCondition(!runtimeCommand.includes(forbidden), `runtime command contains forbidden token: ${forbidden}`);
}

for (const path of canonicalTests) {
  await stat(resolve(root, path));
  requireCondition(runtimeCommand.includes(path), `runtime command omits ${path}`);
}
requireCondition(
  !runtimeCommand.includes("denyAllBaseline.test.mjs"),
  "runtime command must exclude the Storage baseline",
);

const testSources = await Promise.all(canonicalTests.map(readText));
const ids = testSources.flatMap((source) => source.match(/RT-(?:MSG|PST|RPL|RPT|SUP|REG|SEC|SAS)-\d{3}/g) ?? []);
const metadata = testSources.flatMap((source) => [...source.matchAll(/id:\s*"(RT-[A-Z]+-\d{3})",\s*expected:\s*"(ALLOW|DENY)"/g)]);
const uniqueIds = new Set(ids);
const uniqueMetadata = new Map(metadata.map((match) => [match[1], match[2]]));
const allowCount = [...uniqueMetadata.values()].filter((value) => value === "ALLOW").length;
const denyCount = [...uniqueMetadata.values()].filter((value) => value === "DENY").length;
requireCondition(uniqueIds.size === 201, `expected 201 unique Test IDs, found ${uniqueIds.size}`);
requireCondition(uniqueMetadata.size === 201, `expected metadata for 201 Test IDs, found ${uniqueMetadata.size}`);
requireCondition(allowCount === 82, `expected 82 ALLOW cases, found ${allowCount}`);
requireCondition(denyCount === 119, `expected 119 DENY cases, found ${denyCount}`);

const normalizedWorkflow = workflowText.replace(/\r\n/g, "\n");
requireCondition(/^on:\n  workflow_dispatch:\s*$/m.test(normalizedWorkflow), "workflow_dispatch must be the only trigger");
for (const trigger of ["push:", "pull_request:", "schedule:", "repository_dispatch:", "workflow_call:"]) {
  requireCondition(!normalizedWorkflow.includes(trigger), `workflow contains automatic trigger: ${trigger}`);
}
requireCondition(/^permissions:\n  contents: read\s*$/m.test(normalizedWorkflow), "workflow permissions must be contents: read only");
requireCondition(normalizedWorkflow.includes("runs-on: ubuntu-24.04"), "workflow runner must be ubuntu-24.04");
requireCondition(normalizedWorkflow.includes("timeout-minutes: 20"), "workflow timeout must be 20 minutes");
requireCondition(normalizedWorkflow.includes("actions/checkout@v6"), "workflow must use official checkout v6");
requireCondition(normalizedWorkflow.includes("actions/setup-node@v6"), "workflow must use official setup-node v6");
requireCondition(normalizedWorkflow.includes("node-version: 24.15.0"), "workflow must pin Node 24.15.0");
requireCondition(normalizedWorkflow.includes("package-manager-cache: false"), "initial npm cache must be disabled");
requireCondition(normalizedWorkflow.includes("actions/setup-java@v5"), "workflow must use official setup-java v5");
requireCondition(normalizedWorkflow.includes("distribution: temurin"), "workflow must use Temurin");
requireCondition(normalizedWorkflow.includes('java-version: "21"'), "workflow must pin Java 21");
requireCondition(normalizedWorkflow.includes("run: npm ci"), "workflow must install with npm ci");
requireCondition(normalizedWorkflow.includes("run: npm run ci:validate:firestore-rules"), "workflow must run the security preflight");
requireCondition(normalizedWorkflow.includes("run: npm run test:rules:firestore"), "workflow must run the canonical Firestore command");

for (const forbidden of [
  "secrets.", "vars.", "id-token: write", "contents: write", "actions: write",
  "deployments: write", "packages: write", "pull-requests: write",
  "security-events: write", "firebase deploy", "firebase login", "firebase use",
  "firebase target", "firebase projects:list", "firebase hosting",
  "firebase functions", "firebase firestore:indexes", "gcloud",
  "FIREBASE_TOKEN", "GOOGLE_APPLICATION_CREDENTIALS", "GCLOUD_PROJECT",
  "GOOGLE_CLOUD_PROJECT", "FIREBASE_CONFIG", "actions/upload-artifact",
  "emulators:start", "denyAllBaseline.test.mjs",
]) {
  requireCondition(!normalizedWorkflow.includes(forbidden), `workflow contains forbidden token: ${forbidden}`);
}
requireCondition(!/^\s*environment:/m.test(normalizedWorkflow), "workflow must not declare an environment");

requireCondition(
  /allow\s+read,\s*write:\s*if\s+false\s*;/.test(storageRules),
  "storage.rules must remain deny-all",
);
requireCondition(firestoreRules.trim().length > 0, "firestore.rules must exist and be non-empty");

if (failures.length > 0) {
  console.error(`Firestore Rules CI preflight failed (${failures.length} control failures).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Firestore Rules CI preflight passed.");
  console.log("Project: demo-polish-learning; tests: 201; ALLOW: 82; DENY: 119.");
}
