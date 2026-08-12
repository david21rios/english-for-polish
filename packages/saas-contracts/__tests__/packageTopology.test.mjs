import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const packageRoot = path.resolve("packages/saas-contracts");
const manifest = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));

test("package manifest freezes identity, safety and public subpaths", () => {
  assert.equal(manifest.name, "@mipymetic/saas-contracts");
  assert.equal(manifest.version, "0.9.0");
  assert.equal(manifest.private, true);
  assert.equal(manifest.type, "module");
  assert.equal(manifest.sideEffects, false);
  assert.deepEqual(Object.keys(manifest.exports), [
    ".",
    "./domain",
    "./persistence",
    "./validation",
    "./commands",
    "./authority",
    "./audit",
    "./errors",
  ]);
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.types, "./types/index.d.ts");
  assert.deepEqual(manifest.files, ["src", "types", "README.md"]);
  assert.equal(manifest.devDependencies.typescript, "5.9.3");
  for (const value of Object.values(manifest.exports)) {
    assert.deepEqual(Object.keys(value), ["types", "default"]);
  }
});

test("workspace resolution points to the authoritative local package", async () => {
  const resolved = await import.meta.resolve("@mipymetic/saas-contracts");
  assert.match(resolved, /packages\/saas-contracts\/src\/index\.js$/);
});

test("functions dependency is a contained exact vendor artifact", async () => {
  const functionsManifest = JSON.parse(await readFile("functions/package.json", "utf8"));
  assert.equal(
    functionsManifest.dependencies["@mipymetic/saas-contracts"],
    "file:vendor/mipymetic-saas-contracts-0.9.0.tgz",
  );
  assert.equal(functionsManifest.private, true);
});

test("current vendor artifact checksum and inventory are explicit", async () => {
  const artifact = JSON.parse(await readFile("functions/vendor/saas-contracts-artifact.json", "utf8"));
  const tarball = await readFile(`functions/vendor/${artifact.filename}`);
  assert.equal(createHash("sha256").update(tarball).digest("hex"), artifact.sha256);
  assert.equal(artifact.packageName, manifest.name);
  assert.equal(artifact.version, manifest.version);
  assert.equal(artifact.entryCount, artifact.files.length);
  assert.deepEqual(artifact.files, [...artifact.files].sort());
  assert.equal(artifact.files.includes("package.json"), true);
  assert.equal(artifact.files.some((file) => file.includes("__tests__")), false);
  assert.equal(artifact.files.some((file) => file.includes("node_modules")), false);
});

test("packaged source uses repository-canonical LF bytes", async () => {
  const artifact = JSON.parse(await readFile("functions/vendor/saas-contracts-artifact.json", "utf8"));

  for (const file of artifact.files) {
    const contents = await readFile(path.join(packageRoot, file));
    const hasCrLf = contents.some(
      (byte, index) => byte === 13 && contents[index + 1] === 10,
    );
    assert.equal(
      hasCrLf,
      false,
      `${file} must not contain CRLF bytes`,
    );
  }
});
