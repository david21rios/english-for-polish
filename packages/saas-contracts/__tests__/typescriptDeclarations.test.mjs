import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const packageRoot = path.resolve("packages/saas-contracts");
const tsc = path.resolve("node_modules/typescript/bin/tsc");

const filesBelow = async (root) => {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  }));
  return nested.flat().sort();
};

test("strict NodeNext consumer resolves all public declaration surfaces", () => {
  const result = spawnSync(process.execPath, [tsc, "-p", path.join(packageRoot, "__tests__/types/tsconfig.json")], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test("committed declarations are deterministic derived artifacts without any", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "saas-contract-types-"));
  const result = spawnSync(process.execPath, [
    tsc, "-p", path.join(packageRoot, "tsconfig.types.json"), "--outDir", temporaryRoot,
  ], { cwd: path.resolve("."), encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const committed = await filesBelow(path.join(packageRoot, "types"));
  const generated = await filesBelow(temporaryRoot);
  assert.deepEqual(
    generated.map((file) => path.relative(temporaryRoot, file)),
    committed.map((file) => path.relative(path.join(packageRoot, "types"), file)),
  );
  for (let index = 0; index < committed.length; index += 1) {
    const committedText = await readFile(committed[index], "utf8");
    const generatedText = await readFile(generated[index], "utf8");
    assert.equal(generatedText, committedText);
    assert.doesNotMatch(committedText, /\bany\b/);
  }
});
