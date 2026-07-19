// src/services/test/testRepository.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch
} from "firebase/firestore";

import { db } from "../../firebase";

import {
  TEST_SECTION_IDS
} from "./testConstants";

import {
  normalizeSections
} from "./testNormalization";

/**
 * Returns the Firestore document reference
 * for a CEFR test.
 *
 * @param {string} level
 * @returns {import("firebase/firestore").DocumentReference}
 */
export const getTestReference = (
  level
) => {
  return doc(
    db,
    "tests",
    level
  );
};

/**
 * Returns the Firestore collection reference
 * containing all test sections.
 *
 * @param {import("firebase/firestore").DocumentReference} testReference
 * @returns {import("firebase/firestore").CollectionReference}
 */
export const getSectionsCollectionReference = (
  testReference
) => {
  return collection(
    testReference,
    "sections"
  );
};

/**
 * Saves every section belonging to a test.
 *
 * @param {import("firebase/firestore").DocumentReference} testReference
 * @param {object} sections
 * @returns {Promise<object>}
 */
export const saveTestSections =
  async (
    testReference,
    sections = {}
  ) => {

    const normalizedSections =
      normalizeSections(
        sections
      );

    const sectionsReference =
      getSectionsCollectionReference(
        testReference
      );

    const batch =
      writeBatch(db);

    batch.set(
      doc(
        sectionsReference,
        TEST_SECTION_IDS.multipleChoice
      ),
      {
        questions:
          normalizedSections
            .multipleChoice
            .questions,

        updatedAt:
          serverTimestamp()
      }
    );

    batch.set(
      doc(
        sectionsReference,
        TEST_SECTION_IDS.writing
      ),
      {
        questions:
          normalizedSections
            .writing
            .questions,

        updatedAt:
          serverTimestamp()
      }
    );

    batch.set(
      doc(
        sectionsReference,
        TEST_SECTION_IDS.reading
      ),
      {
        texts:
          normalizedSections
            .reading
            .texts,

        updatedAt:
          serverTimestamp()
      }
    );

    await batch.commit();

    return normalizedSections;
  };

/**
 * Reads every section of a test.
 *
 * @param {import("firebase/firestore").DocumentReference} testReference
 * @returns {Promise<object>}
 */
export const readTestSections =
  async (
    testReference
  ) => {

    const sectionsReference =
      getSectionsCollectionReference(
        testReference
      );

    const snapshot =
      await getDocs(
        sectionsReference
      );

    const sections =
      normalizeSections();

    snapshot.forEach(
      (
        sectionDocument
      ) => {

        const sectionData =
          sectionDocument.data();

        switch (
          sectionDocument.id
        ) {

          case TEST_SECTION_IDS.multipleChoice:

            sections.multipleChoice =
              normalizeSections({
                multipleChoice:
                  sectionData
              }).multipleChoice;

            break;

          case TEST_SECTION_IDS.writing:

            sections.writing =
              normalizeSections({
                writing:
                  sectionData
              }).writing;

            break;

          case TEST_SECTION_IDS.reading:

            sections.reading =
              normalizeSections({
                reading:
                  sectionData
              }).reading;

            break;

          default:
            break;
        }
      }
    );

    return sections;
  };

/**
 * Reads a test document.
 *
 * @param {string} level
 * @returns {Promise<import("firebase/firestore").DocumentSnapshot>}
 */
export const getTestDocument =
  async (
    level
  ) => {

    return getDoc(
      getTestReference(level)
    );
  };

/**
 * Reads all test documents.
 *
 * @returns {Promise<import("firebase/firestore").QuerySnapshot>}
 */
export const getAllTestDocuments =
  async () => {

    return getDocs(
      collection(
        db,
        "tests"
      )
    );
  };

/**
 * Saves the metadata of a test.
 *
 * Does not save sections.
 *
 * @param {string} level
 * @param {object} data
 * @returns {Promise<void>}
 */
export const saveTestMetadata =
  async (
    level,
    data
  ) => {

    await setDoc(
      getTestReference(level),
      data,
      {
        merge: true
      }
    );
  };

/**
 * Deletes a test together with all
 * of its section documents.
 *
 * @param {string} level
 * @returns {Promise<void>}
 */
export const deleteTestDocument =
  async (
    level
  ) => {

    const testReference =
      getTestReference(level);

    const sectionsReference =
      getSectionsCollectionReference(
        testReference
      );

    const snapshot =
      await getDocs(
        sectionsReference
      );

    const batch =
      writeBatch(db);

    snapshot.docs.forEach(
      (
        document
      ) => {
        batch.delete(
          document.ref
        );
      }
    );

    batch.delete(
      testReference
    );

    await batch.commit();
  };

export default {

  getTestReference,

  getSectionsCollectionReference,

  getTestDocument,

  getAllTestDocuments,

  saveTestMetadata,

  saveTestSections,

  readTestSections,

  deleteTestDocument

};