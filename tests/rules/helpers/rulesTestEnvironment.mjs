import { readFile } from "node:fs/promises";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

const readProjectFile = (fileName) =>
  readFile(new URL(`../../../${fileName}`, import.meta.url), "utf8");

export const RULES_TEST_PROJECT_ID = "demo-polish-learning";

export const createRulesTestEnvironment = async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readProjectFile("firestore.rules"),
    readProjectFile("storage.rules"),
  ]);

  return initializeTestEnvironment({
    projectId: RULES_TEST_PROJECT_ID,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });
};
