import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const filesBelow = async (root: string): Promise<readonly string[]> => {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  }));
  return files.flat();
};

test("Functions import boundaries isolate SDKs and reject client dependencies", async () => {
  const sourceRoot = path.resolve("src");
  const files = (await filesBelow(sourceRoot)).filter((file) => file.endsWith(".ts") && !file.includes(`${path.sep}__tests__${path.sep}`));
  const violations: string[] = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(sourceRoot, file).replaceAll("\\", "/");
    if (/from ["'](?:react|vite|firebase\/|src\/firebase|\.\.\/\.\.\/\.\.\/src\/|.*services\/saas)/.test(source)) violations.push(`${relative}:client`);
    if (/from ["']firebase-admin/.test(source) && !relative.startsWith("persistence/adapters/")) violations.push(`${relative}:admin`);
    if (/from ["']firebase-functions/.test(source) && !relative.startsWith("transport/")) violations.push(`${relative}:functions`);
  }
  assert.deepEqual(violations, []);
});

test("backend entrypoint exports no callable handler or unauthorized workflow", async () => {
  const entrypoint = await readFile(path.resolve("src/index.ts"), "utf8");
  assert.doesNotMatch(entrypoint, /onCall|onRequest|BootstrapPlatformAdmin|ApproveRegistrationRequest|\bUpdateTenant\b|executeUpdateTenant\b|SuspendTenant|RestoreTenant|ArchiveTenant/);
});

test("static module graph is acyclic", async () => {
  const sourceRoot = path.resolve("src");
  const files = (await filesBelow(sourceRoot)).filter((file) => file.endsWith(".ts") && !file.includes(`${path.sep}__tests__${path.sep}`));
  const modules = new Set(files.map((file) => path.relative(sourceRoot, file).replaceAll("\\", "/").replace(/\.ts$/, "")));
  const graph = new Map<string, string[]>();
  for (const file of files) {
    const module = path.relative(sourceRoot, file).replaceAll("\\", "/").replace(/\.ts$/, "");
    const source = await readFile(file, "utf8");
    const imports = [...source.matchAll(/from ["'](\.{1,2}\/[^"']+)\.js["']/g)].map((match) => path.posix.normalize(path.posix.join(path.posix.dirname(module), match[1] ?? ""))).filter((target) => modules.has(target));
    graph.set(module, imports);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (module: string): void => {
    if (visiting.has(module)) assert.fail(`cycle at ${module}`);
    if (visited.has(module)) return;
    visiting.add(module);
    for (const dependency of graph.get(module) ?? []) visit(dependency);
    visiting.delete(module);
    visited.add(module);
  };
  for (const module of modules) visit(module);
});
