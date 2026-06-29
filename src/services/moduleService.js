// src/services/moduleService.js

import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  writeBatch
} from "firebase/firestore";

const DEFAULT_STATUS = "published";

const normalizeText = (value = "") => String(value || "").trim();

export const slugifyModuleTitle = (title = "") => {
  return normalizeText(title)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const buildModuleId = ({ levelId, title, order = null }) => {
  const safeLevelId = normalizeText(levelId).toUpperCase();
  const slug = slugifyModuleTitle(title);

  if (!safeLevelId || !slug) return "";

  const prefix = order ? `${safeLevelId}_M${String(order).padStart(2, "0")}` : `${safeLevelId}_M`;

  return `${prefix}_${slug}`;
};

const getModulesRef = (levelId) => {
  return collection(db, "levels", levelId, "modules");
};

const getModuleRef = (levelId, moduleId) => {
  return doc(db, "levels", levelId, "modules", moduleId);
};

const getModuleLessonsRef = (levelId, moduleId) => {
  return collection(db, "levels", levelId, "modules", moduleId, "lessons");
};

const getLegacyLessonsRef = (levelId) => {
  return collection(db, "levels", levelId, "lessons");
};

const normalizeModuleSnapshot = (snapshot) => {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    moduleId: data.moduleId || snapshot.id,
    levelId: data.levelId || "",
    title: data.title || "Untitled module",
    description: data.description || "",
    order: Number(data.order) || 0,
    status: data.status || DEFAULT_STATUS,
    icon: data.icon || "📚",
    color: data.color || "primary",
    lessonCount: Number(data.lessonCount) || 0,
    publishedLessonCount: Number(data.publishedLessonCount) || 0,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    ...data
  };
};

const sortModules = (modules = []) => {
  return [...modules].sort((a, b) => {
    const orderA = Number(a.order) || 999;
    const orderB = Number(b.order) || 999;

    if (orderA !== orderB) return orderA - orderB;

    return String(a.title || "").localeCompare(String(b.title || ""));
  });
};

const sortLessons = (lessons = []) => {
  return [...lessons].sort((a, b) => {
    const orderA = Number(a.orderInModule || a.order) || 999;
    const orderB = Number(b.orderInModule || b.order) || 999;

    if (orderA !== orderB) return orderA - orderB;

    return String(a.id || "").localeCompare(String(b.id || ""));
  });
};

export const getModulesByLevel = async (levelId, { includeDrafts = true } = {}) => {
  try {
    if (!levelId) return [];

    const modulesQuery = query(getModulesRef(levelId), orderBy("order", "asc"));
    const snapshot = await getDocs(modulesQuery);

    let modules = snapshot.docs.map(normalizeModuleSnapshot);

    if (!includeDrafts) {
      modules = modules.filter((module) => module.status === "published");
    }

    return sortModules(modules);
  } catch (error) {
    console.error("Error getting modules by level:", error);
    throw error;
  }
};

export const getPublishedModulesByLevel = async (levelId) => {
  return getModulesByLevel(levelId, { includeDrafts: false });
};

export const getModuleById = async (levelId, moduleId) => {
  try {
    if (!levelId || !moduleId) return null;

    const snapshot = await getDoc(getModuleRef(levelId, moduleId));

    if (!snapshot.exists()) return null;

    return normalizeModuleSnapshot(snapshot);
  } catch (error) {
    console.error("Error getting module:", error);
    throw error;
  }
};

export const checkModuleExists = async (levelId, moduleId) => {
  const module = await getModuleById(levelId, moduleId);
  return Boolean(module);
};

export const getNextModuleOrder = async (levelId) => {
  try {
    const modules = await getModulesByLevel(levelId, { includeDrafts: true });

    if (!modules.length) return 1;

    const maxOrder = Math.max(...modules.map((module) => Number(module.order) || 0));

    return maxOrder + 1;
  } catch (error) {
    console.error("Error getting next module order:", error);
    return 1;
  }
};

export const createModule = async ({
  levelId,
  title,
  description = "",
  order = 0,
  status = DEFAULT_STATUS,
  icon = "📚",
  color = "primary"
}) => {
  try {
    const safeLevelId = normalizeText(levelId).toUpperCase();
    const safeTitle = normalizeText(title);

    if (!safeLevelId) {
      throw new Error("Level is required to create a module.");
    }

    if (!safeTitle) {
      throw new Error("Module title is required.");
    }

    const finalOrder = Number(order) || (await getNextModuleOrder(safeLevelId));

    const moduleId = buildModuleId({
      levelId: safeLevelId,
      title: safeTitle,
      order: finalOrder
    });

    const exists = await checkModuleExists(safeLevelId, moduleId);

    if (exists) {
      throw new Error("A module with this title already exists in this level.");
    }

    const moduleData = {
      id: moduleId,
      moduleId,
      levelId: safeLevelId,
      title: safeTitle,
      description: normalizeText(description),
      order: finalOrder,
      status,
      icon,
      color,
      lessonCount: 0,
      publishedLessonCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(getModuleRef(safeLevelId, moduleId), moduleData);

    return moduleData;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const updateModule = async ({
  levelId,
  moduleId,
  title,
  description = "",
  order = 0,
  status = DEFAULT_STATUS,
  icon = "📚",
  color = "primary"
}) => {
  try {
    const safeLevelId = normalizeText(levelId).toUpperCase();
    const safeModuleId = normalizeText(moduleId);
    const safeTitle = normalizeText(title);

    if (!safeLevelId || !safeModuleId) {
      throw new Error("Level and module ID are required.");
    }

    if (!safeTitle) {
      throw new Error("Module title is required.");
    }

    const existing = await getModuleById(safeLevelId, safeModuleId);

    if (!existing) {
      throw new Error("Module not found.");
    }

    const updateData = {
      title: safeTitle,
      description: normalizeText(description),
      order: Number(order) || 1,
      status,
      icon,
      color,
      updatedAt: serverTimestamp()
    };

    await setDoc(getModuleRef(safeLevelId, safeModuleId), updateData, {
      merge: true
    });

    return {
      ...existing,
      ...updateData
    };
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
};

export const getLessonsByModule = async (levelId, moduleId) => {
  try {
    if (!levelId || !moduleId) return [];

    const moduleLessonsSnapshot = await getDocs(getModuleLessonsRef(levelId, moduleId));

    if (!moduleLessonsSnapshot.empty) {
      return sortLessons(
        moduleLessonsSnapshot.docs.map((lessonDoc) => ({
          id: lessonDoc.id,
          ...lessonDoc.data()
        }))
      );
    }

    const legacyQuery = query(getLegacyLessonsRef(levelId), where("moduleId", "==", moduleId));
    const legacySnapshot = await getDocs(legacyQuery);

    return sortLessons(
      legacySnapshot.docs.map((lessonDoc) => ({
        id: lessonDoc.id,
        ...lessonDoc.data()
      }))
    );
  } catch (error) {
    console.error("Error getting lessons by module:", error);
    throw error;
  }
};

export const refreshModuleLessonCount = async (levelId, moduleId) => {
  try {
    const lessons = await getLessonsByModule(levelId, moduleId);

    const lessonCount = lessons.length;
    const publishedLessonCount = lessons.filter(
      (lesson) => lesson.status === "published"
    ).length;

    await setDoc(
      getModuleRef(levelId, moduleId),
      {
        lessonCount,
        publishedLessonCount,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    return lessonCount;
  } catch (error) {
    console.error("Error refreshing module lesson count:", error);
    throw error;
  }
};

export const deleteModule = async (levelId, moduleId, { force = false } = {}) => {
  try {
    if (!levelId || !moduleId) {
      throw new Error("Level and module ID are required.");
    }

    const existing = await getModuleById(levelId, moduleId);

    if (!existing) {
      throw new Error("Module not found.");
    }

    const lessons = await getLessonsByModule(levelId, moduleId);

    if (lessons.length > 0 && !force) {
      throw new Error(
        "This module contains lessons. Move or delete them before deleting the module."
      );
    }

    await deleteDoc(getModuleRef(levelId, moduleId));

    return true;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
};

export const reorderModules = async (levelId, orderedModules = []) => {
  try {
    if (!levelId) {
      throw new Error("Level is required to reorder modules.");
    }

    const batch = writeBatch(db);

    orderedModules.forEach((module, index) => {
      const moduleId = module.moduleId || module.id;

      if (!moduleId) return;

      batch.set(
        getModuleRef(levelId, moduleId),
        {
          order: index + 1,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error reordering modules:", error);
    throw error;
  }
};

export const getModuleOptionsByLevel = async (levelId) => {
  const modules = await getModulesByLevel(levelId);

  return modules.map((module) => ({
    value: module.moduleId,
    label: module.title,
    moduleId: module.moduleId,
    title: module.title,
    order: module.order,
    status: module.status
  }));
};

export default {
  slugifyModuleTitle,
  buildModuleId,
  getModulesByLevel,
  getPublishedModulesByLevel,
  getModuleById,
  checkModuleExists,
  getNextModuleOrder,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  getLessonsByModule,
  refreshModuleLessonCount,
  getModuleOptionsByLevel
};