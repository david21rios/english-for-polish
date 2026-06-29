// src/utils/testService.js

import { db } from "../firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const SECTION_TYPES = ["multipleChoice", "writing", "reading"];

const DEFAULT_SECTIONS = {
  multipleChoice: { questions: [] },
  writing: { questions: [] },
  reading: { texts: [] }
};

const validateLevel = (level) => {
  if (!level) {
    throw new Error("El test debe tener un nivel.");
  }

  if (!VALID_LEVELS.includes(level)) {
    throw new Error(
      `Nivel inválido: ${level}. Usa A1, A2, B1, B2, C1 o C2.`
    );
  }
};

const normalizeSections = (sections = {}) => {
  return {
    multipleChoice: {
      questions: Array.isArray(sections.multipleChoice?.questions)
        ? sections.multipleChoice.questions
        : []
    },
    writing: {
      questions: Array.isArray(sections.writing?.questions)
        ? sections.writing.questions
        : []
    },
    reading: {
      texts: Array.isArray(sections.reading?.texts)
        ? sections.reading.texts
        : []
    }
  };
};

const getTestRefByLevel = (level) => {
  validateLevel(level);
  return doc(db, "tests", level);
};

const saveTestSections = async (testRef, sections = {}) => {
  const normalizedSections = normalizeSections(sections);
  const sectionsRef = collection(testRef, "sections");

  await setDoc(doc(sectionsRef, "multipleChoice"), {
    questions: normalizedSections.multipleChoice.questions
  });

  await setDoc(doc(sectionsRef, "writing"), {
    questions: normalizedSections.writing.questions
  });

  await setDoc(doc(sectionsRef, "reading"), {
    texts: normalizedSections.reading.texts
  });
};

const readTestSections = async (testRef) => {
  const sectionsRef = collection(testRef, "sections");
  const sectionsSnapshot = await getDocs(sectionsRef);

  const sections = {
    ...DEFAULT_SECTIONS,
    multipleChoice: { questions: [] },
    writing: { questions: [] },
    reading: { texts: [] }
  };

  sectionsSnapshot.forEach((sectionDoc) => {
    const sectionData = sectionDoc.data();

    if (sectionDoc.id === "multipleChoice") {
      sections.multipleChoice = {
        questions: Array.isArray(sectionData.questions)
          ? sectionData.questions
          : []
      };
    }

    if (sectionDoc.id === "writing") {
      sections.writing = {
        questions: Array.isArray(sectionData.questions)
          ? sectionData.questions
          : []
      };
    }

    if (sectionDoc.id === "reading") {
      sections.reading = {
        texts: Array.isArray(sectionData.texts)
          ? sectionData.texts
          : []
      };
    }
  });

  return sections;
};

export const createTest = async (testData) => {
  try {
    const level = testData?.level;

    validateLevel(level);

    const testRef = getTestRefByLevel(level);
    const existingTest = await getDoc(testRef);

    if (existingTest.exists()) {
      throw new Error(
        `Ya existe un test para el nivel ${level}. Edita el test existente.`
      );
    }

    await setDoc(testRef, {
      level,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await saveTestSections(testRef, testData.sections);

    return level;
  } catch (error) {
    console.error("Error creating test:", error);
    throw new Error(`No se pudo crear el test: ${error.message}`);
  }
};

export const getTest = async (testId) => {
  try {
    const testRef = getTestRefByLevel(testId);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
      throw new Error(`Test ${testId} not found`);
    }

    const sections = await readTestSections(testRef);

    return {
      id: testDoc.id,
      ...testDoc.data(),
      sections
    };
  } catch (error) {
    console.error("Error getting test:", error);
    throw new Error(`No se pudo obtener el test: ${error.message}`);
  }
};

export const updateTest = async (testId, testData) => {
  try {
    validateLevel(testId);

    const testRef = getTestRefByLevel(testId);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
      throw new Error(`Test ${testId} not found`);
    }

    await setDoc(
      testRef,
      {
        level: testId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    await saveTestSections(testRef, testData.sections);

    return testId;
  } catch (error) {
    console.error("Error updating test:", error);
    throw new Error(`No se pudo actualizar el test: ${error.message}`);
  }
};

export const getAllTests = async () => {
  try {
    const snapshot = await getDocs(collection(db, "tests"));

    const tests = await Promise.all(
      snapshot.docs.map(async (testDoc) => {
        const testData = testDoc.data();
        const sections = await readTestSections(testDoc.ref);

        return {
          id: testDoc.id,
          level: testData.level || testDoc.id,
          ...testData,
          sections
        };
      })
    );

    const levelOrder = VALID_LEVELS.reduce((acc, level, index) => {
      acc[level] = index;
      return acc;
    }, {});

    return tests.sort((a, b) => {
      const orderA = levelOrder[a.level] ?? 999;
      const orderB = levelOrder[b.level] ?? 999;

      return orderA - orderB;
    });
  } catch (error) {
    console.error("Error getting all tests:", error);
    throw new Error(`No se pudieron obtener los tests: ${error.message}`);
  }
};

export const checkTestExists = async (testId) => {
  try {
    const testRef = getTestRefByLevel(testId);
    const testDoc = await getDoc(testRef);

    return testDoc.exists();
  } catch (error) {
    console.error("Error checking test existence:", error);
    throw new Error(
      `No se pudo verificar la existencia del test: ${error.message}`
    );
  }
};

export const deleteTest = async (testId) => {
  try {
    const testRef = getTestRefByLevel(testId);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
      throw new Error(`Test ${testId} not found`);
    }

    const batch = writeBatch(db);
    const sectionsRef = collection(testRef, "sections");
    const sectionsSnapshot = await getDocs(sectionsRef);

    sectionsSnapshot.docs.forEach((sectionDoc) => {
      batch.delete(sectionDoc.ref);
    });

    batch.delete(testRef);

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting test:", error);
    throw new Error(`No se pudo eliminar el test: ${error.message}`);
  }
};

export const getTestsByLevel = async (level) => {
  try {
    validateLevel(level);

    const test = await getTest(level);

    return [test];
  } catch (error) {
    console.error("Error getting tests by level:", error);
    throw new Error(
      `No se pudieron obtener los tests del nivel ${level}: ${error.message}`
    );
  }
};

export default {
  createTest,
  getTest,
  updateTest,
  getAllTests,
  checkTestExists,
  deleteTest,
  getTestsByLevel
};