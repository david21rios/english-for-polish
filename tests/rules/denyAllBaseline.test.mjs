import { after, before, test } from "node:test";
import { assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";

let testEnvironment;

before(async () => {
  testEnvironment = await createRulesTestEnvironment();
});

after(async () => {
  await testEnvironment?.cleanup();
});

const firestoreContexts = [
  ["unauthenticated", () => testEnvironment.unauthenticatedContext()],
  ["authenticated", () => testEnvironment.authenticatedContext("synthetic-user-01")],
];

for (const [label, getContext] of firestoreContexts) {
  test(`Firestore denies ${label} reads`, async () => {
    const target = doc(getContext().firestore(), "baseline", "restricted");
    await assertFails(getDoc(target));
  });

  test(`Firestore denies ${label} writes`, async () => {
    const target = doc(getContext().firestore(), "baseline", "restricted");
    await assertFails(setDoc(target, { synthetic: true }));
  });
}

const storageContexts = [
  ["unauthenticated", () => testEnvironment.unauthenticatedContext()],
  ["authenticated", () => testEnvironment.authenticatedContext("synthetic-user-01")],
];

for (const [label, getContext] of storageContexts) {
  test(`Storage denies ${label} reads`, async () => {
    const target = ref(getContext().storage(), "baseline/restricted.txt");
    await assertFails(getBytes(target));
  });

  test(`Storage denies ${label} writes`, async () => {
    const target = ref(getContext().storage(), "baseline/restricted.txt");
    await assertFails(uploadBytes(target, new Uint8Array([1])));
  });
}
