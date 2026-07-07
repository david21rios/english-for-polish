// src/services/firestoreService.js

import { db, storage } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import testService from "../utils/testService.js";

const DEFAULT_ADMINS = [
  "david.rios0627@gmail.com",
  "wilsonriosv@gmail.com"
];

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const calculateOverallScore = (levelResults = {}) => {
  const scores = Object.values(levelResults)
    .map(Number)
    .filter((n) => !Number.isNaN(n));

  if (scores.length === 0) return 0;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const buildFullLessonData = ({ lessonData, levelId = null, themeId = null }) => {
  const lessonId = lessonData.id || lessonData.lessonId;

  return {
    lessonId,
    id: lessonId,
    titulo: lessonData.titulo || "",
    descripcion: lessonData.descripcion || "",
    nivel: levelId || "",
    level: levelId || "",
    tema: themeId || "",
    ageGroup: lessonData.ageGroup || "all",
    status: lessonData.status || "published",
    objetivos: lessonData.objetivos || [],
    contenidos: {
      vocabulario: lessonData.contenidos?.vocabulario || {},
      gramatica: lessonData.contenidos?.gramatica || {}
    },
    content: lessonData.contenidos || {},
    actividades: lessonData.actividades || [],
    activities: lessonData.actividades || [],
    lectura: {
      titulo: lessonData.lectura?.titulo || "",
      autor: lessonData.lectura?.autor || "",
      contenido: lessonData.lectura?.contenido || ""
    },
    practica_interactiva: {
      titulo: lessonData.practica_interactiva?.titulo || "",
      descripcion: lessonData.practica_interactiva?.descripcion || "",
      ejercicios: lessonData.practica_interactiva?.ejercicios || []
    },
    produccion_escrita: {
      titulo: lessonData.produccion_escrita?.titulo || "",
      descripcion: lessonData.produccion_escrita?.descripcion || "",
      ejercicios: lessonData.produccion_escrita?.ejercicios || []
    },
    produccion_oral: {
      titulo: lessonData.produccion_oral?.titulo || "",
      descripcion: lessonData.produccion_oral?.descripcion || "",
      ejercicios: lessonData.produccion_oral?.ejercicios || []
    },
    ejercicios_interactivos: {
      titulo: lessonData.ejercicios_interactivos?.titulo || "",
      descripcion: lessonData.ejercicios_interactivos?.descripcion || "",
      ejercicios: lessonData.ejercicios_interactivos?.ejercicios || []
    },
    evaluacion: {
      autoevaluacion: lessonData.evaluacion?.autoevaluacion || "",
      cuestionario: lessonData.evaluacion?.cuestionario || []
    },
    recursos_adicionales: lessonData.recursos_adicionales || [],
    reflexion_final: lessonData.reflexion_final || ""
  };
};

const normalizeObjectives = (objectives = []) => {
  if (!Array.isArray(objectives)) return [];

  return objectives
    .map((objective, index) => {
      if (typeof objective === "string") {
        return {
          id: `objective_${index + 1}`,
          text: objective.trim(),
          required: true
        };
      }

      return {
        id: objective.id || `objective_${index + 1}`,
        text: objective.text || objective.title || "",
        required: objective.required !== false
      };
    })
    .filter((objective) => objective.text.trim());
};

const buildMissionData = ({ missionData, themeId }) => {
  const objectives = normalizeObjectives(missionData.objectives || []);

  return {
    id: missionData.id || "",
    themeId,
    title: missionData.title?.trim() || "",
    description: missionData.description?.trim() || "",
    scenario: missionData.scenario?.trim() || "",
    aiRole: missionData.aiRole?.trim() || "",
    aiInstructions: missionData.aiInstructions?.trim() || "",
    objectives,
    difficulty: missionData.difficulty || "easy",
    level: missionData.level || "A1",
    ageGroup: missionData.ageGroup || "all",
    estimatedMinutes: Number(missionData.estimatedMinutes) || 5,
    xpReward: Number(missionData.xpReward) || 10,
    order: Number(missionData.order) || 1,
    status: missionData.status || "draft",
    tags: Array.isArray(missionData.tags) ? missionData.tags : [],
    feedbackMode: missionData.feedbackMode || "after_mission",
    correctionMode: missionData.correctionMode || "delayed",
    missionType: missionData.missionType || "conversation",
    debriefTemplate: missionData.debriefTemplate || {
      showStrengths: true,
      showCorrections: true,
      showVocabulary: true,
      showGrammar: true,
      showNextSteps: true
    },
    updatedAt: serverTimestamp()
  };
};

/* USERS */

export const createUserDocument = async (user, extraData = {}) => {
  if (!user?.uid) return;

  const normalizedEmail = normalizeEmail(extraData.email || user.email);
  const userRef = doc(db, "users", user.uid);

  const role = DEFAULT_ADMINS.includes(normalizedEmail) ? "admin" : "user";

  await setDoc(
    userRef,
    {
      uid: user.uid,
      name: extraData.name || "",
      lastName: extraData.lastName || "",
      email: normalizedEmail,
      age: Number(extraData.age) || null,
      ageGroup: extraData.ageGroup || "all",
      country: extraData.country || "",
      role,
      isActive: true,
      emailVerified: Boolean(user.emailVerified),
      forumBlocked: false,
      forumBlockedReason: null,
      forumBlockedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null
    },
    { merge: true }
  );
};

export const isUserAdmin = async (userId) => {
  try {
    if (!userId) return false;

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    return userSnap.exists() && userSnap.data().role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    if (!userId) throw new Error("Usuario no válido");

    if (!["admin", "user"].includes(newRole)) {
      throw new Error("Rol no válido");
    }

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const toggleUserForumBlock = async ({
  userId,
  blocked,
  reason = null
}) => {
  try {
    if (!userId) {
      throw new Error("Usuario no válido");
    }

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      forumBlocked: blocked,
      forumBlockedReason: blocked
        ? reason || "Bloqueado desde el panel de administración"
        : null,
      forumBlockedAt: blocked ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error updating forum block status:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

export const deleteUserAccount = async (userId) => {
  if (!userId) {
    throw new Error("Usuario no válido");
  }

  const userRef = doc(db, "users", userId);

  await deleteDoc(userRef);

  return true;
};

/* LEVEL LESSONS */

export const createNewLesson = async (levelId, lessonData) => {
  try {
    const lessonId = lessonData.id || lessonData.lessonId;

    if (!levelId || !lessonId) {
      throw new Error("La lección debe tener nivel e id válidos.");
    }

    const levelRef = doc(db, "levels", levelId);
    const lessonRef = doc(collection(levelRef, "lessons"), lessonId);

    const fullLessonData = {
      ...buildFullLessonData({ lessonData, levelId }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(lessonRef, fullLessonData, { merge: true });

    return {
      id: lessonId,
      ...fullLessonData
    };
  } catch (error) {
    console.error("Error creating lesson:", error);
    throw error;
  }
};

export const getLessonById = async (levelId, lessonId) => {
  try {
    if (!levelId || !lessonId) return null;

    const lessonRef = doc(db, "levels", levelId, "lessons", lessonId);
    const lessonSnap = await getDoc(lessonRef);

    if (!lessonSnap.exists()) return null;

    return {
      id: lessonSnap.id,
      ...lessonSnap.data()
    };
  } catch (error) {
    console.error("Error getting lesson:", error);
    throw error;
  }
};

export const updateLesson = async (levelId, lessonId, updateData) => {
  try {
    if (!levelId || !lessonId) {
      throw new Error("Nivel o lección no válidos.");
    }

    const lessonRef = doc(db, "levels", levelId, "lessons", lessonId);

    await updateDoc(lessonRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });

    return {
      id: lessonId,
      ...updateData
    };
  } catch (error) {
    console.error("Error updating lesson:", error);
    throw error;
  }
};

export const deleteLesson = async (levelId, lessonId) => {
  try {
    if (!levelId || !lessonId) {
      throw new Error("Nivel o lección no válidos.");
    }

    const lessonRef = doc(db, "levels", levelId, "lessons", lessonId);
    await deleteDoc(lessonRef);

    return true;
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
};

export const getLessonsByLevel = async (levelId, userAgeGroup = null) => {
  try {
    if (!levelId) return [];

    const lessonsRef = collection(db, "levels", levelId, "lessons");
    const querySnapshot = await getDocs(lessonsRef);

    const lessons = querySnapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data()
      }))
      .filter((lesson) => {
        const lessonStatus = lesson.status || "published";
        const lessonAgeGroup = lesson.ageGroup || "all";

        return (
          lessonStatus === "published" &&
          (!userAgeGroup ||
            lessonAgeGroup === "all" ||
            lessonAgeGroup === userAgeGroup)
        );
      });

    return lessons.sort((a, b) => {
      const numA = parseInt((a.id || "").split("_").pop()) || 0;
      const numB = parseInt((b.id || "").split("_").pop()) || 0;
      return numA - numB;
    });
  } catch (error) {
    console.error("Error al obtener las lecciones:", error);
    throw error;
  }
};

/* THEME LESSONS */

export const createNewThemeLesson = async (themeId, lessonData) => {
  try {
    const lessonId = lessonData.id || lessonData.lessonId;

    if (!themeId || !lessonId) {
      throw new Error("La lección del tema debe tener tema e id válidos.");
    }

    const themeRef = doc(db, "temas", themeId);
    const lessonRef = doc(collection(themeRef, "Lessons"), lessonId);

    const fullLessonData = {
      ...buildFullLessonData({ lessonData, themeId }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(lessonRef, fullLessonData, { merge: true });

    return {
      id: lessonId,
      ...fullLessonData
    };
  } catch (error) {
    console.error("Error creating theme lesson:", error);
    throw error;
  }
};

export const getThemeLessonById = async (themeId, lessonId) => {
  try {
    if (!themeId || !lessonId) return null;

    const lessonRef = doc(db, "temas", themeId, "Lessons", lessonId);
    const lessonSnap = await getDoc(lessonRef);

    if (!lessonSnap.exists()) return null;

    return {
      id: lessonSnap.id,
      ...lessonSnap.data()
    };
  } catch (error) {
    console.error("Error getting theme lesson:", error);
    throw error;
  }
};

export const updateThemeLesson = async (themeId, lessonId, updateData) => {
  try {
    if (!themeId || !lessonId) {
      throw new Error("Tema o lección no válidos.");
    }

    const lessonRef = doc(db, "temas", themeId, "Lessons", lessonId);

    await updateDoc(lessonRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });

    return {
      id: lessonId,
      ...updateData
    };
  } catch (error) {
    console.error("Error updating theme lesson:", error);
    throw error;
  }
};

export const deleteThemeLesson = async (themeId, lessonId) => {
  try {
    if (!themeId || !lessonId) {
      throw new Error("Tema o lección no válidos.");
    }

    const lessonRef = doc(db, "temas", themeId, "Lessons", lessonId);
    await deleteDoc(lessonRef);

    return true;
  } catch (error) {
    console.error("Error deleting theme lesson:", error);
    throw error;
  }
};

export const getLessonsByTheme = async (themeId, userAgeGroup = null) => {
  try {
    if (!themeId) return [];

    const lessonsRef = collection(db, "temas", themeId, "Lessons");
    const lessonsSnapshot = await getDocs(lessonsRef);

    const lessons = lessonsSnapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data()
      }))
      .filter((lesson) => {
        const lessonStatus = lesson.status || "published";
        const lessonAgeGroup = lesson.ageGroup || "all";

        return (
          lessonStatus === "published" &&
          (!userAgeGroup ||
            lessonAgeGroup === "all" ||
            lessonAgeGroup === userAgeGroup)
        );
      });

    return lessons.sort((a, b) => {
      const numA = parseInt((a.id || "").split("_").pop()) || 0;
      const numB = parseInt((b.id || "").split("_").pop()) || 0;
      return numA - numB;
    });
  } catch (error) {
    console.error("Error al obtener las lecciones del tema:", error);
    throw error;
  }
};

/* THEME MISSIONS */

export const createMission = async (themeId, missionData) => {
  try {
    if (!themeId) {
      throw new Error("Tema no válido.");
    }

    if (!missionData?.title?.trim()) {
      throw new Error("La misión debe tener un título.");
    }

    if (!missionData?.scenario?.trim()) {
      throw new Error("La misión debe tener un escenario.");
    }

    const missionsRef = collection(db, "temas", themeId, "missions");

    const dataToSave = {
      ...buildMissionData({ missionData, themeId }),
      createdAt: serverTimestamp()
    };

    if (missionData.id) {
      const missionRef = doc(missionsRef, missionData.id);

      await setDoc(
        missionRef,
        {
          ...dataToSave,
          id: missionData.id
        },
        { merge: true }
      );

      return {
        id: missionData.id,
        ...dataToSave
      };
    }

    const createdRef = await addDoc(missionsRef, dataToSave);

    await updateDoc(createdRef, {
      id: createdRef.id
    });

    return {
      id: createdRef.id,
      ...dataToSave
    };
  } catch (error) {
    console.error("Error creating mission:", error);
    throw error;
  }
};

export const getMissionById = async (themeId, missionId) => {
  try {
    if (!themeId || !missionId) return null;

    const missionRef = doc(db, "temas", themeId, "missions", missionId);
    const missionSnap = await getDoc(missionRef);

    if (!missionSnap.exists()) return null;

    return {
      id: missionSnap.id,
      ...missionSnap.data()
    };
  } catch (error) {
    console.error("Error getting mission:", error);
    throw error;
  }
};

export const getMissionsByTheme = async (
  themeId,
  {
    userAgeGroup = null,
    includeDrafts = false
  } = {}
) => {
  try {
    if (!themeId) return [];

    const missionsRef = collection(db, "temas", themeId, "missions");
    const missionsSnapshot = await getDocs(missionsRef);

    const missions = missionsSnapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data()
      }))
      .filter((mission) => {
        const missionStatus = mission.status || "draft";
        const missionAgeGroup = mission.ageGroup || "all";

        const statusAllowed = includeDrafts || missionStatus === "published";
        const ageAllowed =
          !userAgeGroup ||
          missionAgeGroup === "all" ||
          missionAgeGroup === userAgeGroup;

        return statusAllowed && ageAllowed;
      });

    return missions.sort((a, b) => {
      const orderA = Number(a.order) || 999;
      const orderB = Number(b.order) || 999;

      if (orderA !== orderB) return orderA - orderB;

      return (a.title || "").localeCompare(b.title || "");
    });
  } catch (error) {
    console.error("Error getting theme missions:", error);
    throw error;
  }
};

export const updateMission = async (themeId, missionId, updateData) => {
  try {
    if (!themeId || !missionId) {
      throw new Error("Tema o misión no válidos.");
    }

    const missionRef = doc(db, "temas", themeId, "missions", missionId);

    const dataToUpdate = buildMissionData({
      missionData: {
        ...updateData,
        id: missionId
      },
      themeId
    });

    await updateDoc(missionRef, dataToUpdate);

    return {
      id: missionId,
      ...dataToUpdate
    };
  } catch (error) {
    console.error("Error updating mission:", error);
    throw error;
  }
};

export const deleteMission = async (themeId, missionId) => {
  try {
    if (!themeId || !missionId) {
      throw new Error("Tema o misión no válidos.");
    }

    const missionRef = doc(db, "temas", themeId, "missions", missionId);

    await deleteDoc(missionRef);

    return true;
  } catch (error) {
    console.error("Error deleting mission:", error);
    throw error;
  }
};

export const duplicateMission = async (themeId, missionId) => {
  try {
    if (!themeId || !missionId) {
      throw new Error("Tema o misión no válidos.");
    }

    const originalMission = await getMissionById(themeId, missionId);

    if (!originalMission) {
      throw new Error("No se encontró la misión original.");
    }

    const duplicatedMission = {
      ...originalMission,
      id: "",
      title: `${originalMission.title || "Mission"} (Copy)`,
      status: "draft",
      order: Number(originalMission.order || 0) + 1
    };

    delete duplicatedMission.createdAt;
    delete duplicatedMission.updatedAt;

    return await createMission(themeId, duplicatedMission);
  } catch (error) {
    console.error("Error duplicating mission:", error);
    throw error;
  }
};

/* THEMES */

const normalizeThemeData = (themeData = {}) => ({
  icon: String(themeData.icon || "").trim(),
  title: String(themeData.title || "").trim(),
  description: String(themeData.description || "").trim(),
  numero: Number(themeData.numero) || 0
});

const validateThemeData = (themeData = {}) => {
  const normalizedTheme = normalizeThemeData(themeData);

  if (!normalizedTheme.title) {
    throw new Error("Theme title is required.");
  }

  if (!normalizedTheme.icon) {
    throw new Error("Theme icon is required.");
  }

  if (!normalizedTheme.description) {
    throw new Error("Theme description is required.");
  }

  if (
    !Number.isInteger(normalizedTheme.numero) ||
    normalizedTheme.numero <= 0
  ) {
    throw new Error("Theme number must be a positive integer.");
  }

  return normalizedTheme;
};

export const getAllThemes = async () => {
  try {
    const themesSnapshot = await getDocs(collection(db, "temas"));

    return themesSnapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data()
      }))
      .sort(
        (a, b) =>
          (Number(a.numero) || 0) -
          (Number(b.numero) || 0)
      );
  } catch (error) {
    console.error("Error getting themes:", error);
    throw error;
  }
};

export const createTheme = async (themeData) => {
  try {
    const normalizedTheme = validateThemeData(themeData);

    const themeRef = await addDoc(collection(db, "temas"), {
      ...normalizedTheme,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: themeRef.id,
      ...normalizedTheme
    };
  } catch (error) {
    console.error("Error creating theme:", error);
    throw error;
  }
};

export const updateTheme = async (themeId, themeData) => {
  try {
    if (!themeId) {
      throw new Error("Invalid theme.");
    }

    const normalizedTheme = validateThemeData(themeData);
    const themeRef = doc(db, "temas", themeId);

    await updateDoc(themeRef, {
      ...normalizedTheme,
      updatedAt: serverTimestamp()
    });

    return {
      id: themeId,
      ...normalizedTheme
    };
  } catch (error) {
    console.error("Error updating theme:", error);
    throw error;
  }
};

export const deleteTheme = async (themeId) => {
  try {
    if (!themeId) {
      throw new Error("Invalid theme.");
    }

    const themeRef = doc(db, "temas", themeId);

    await deleteDoc(themeRef);

    return true;
  } catch (error) {
    console.error("Error deleting theme:", error);
    throw error;
  }
};

/* TESTS */

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const RECENT_TEST_DAYS = 20;
const MIN_PASSING_SCORE = 70;

const normalizeCefrLevel = (level, fallback = "A1") => {
  const normalizedLevel = String(level || "").trim().toUpperCase();

  return CEFR_LEVELS.includes(normalizedLevel)
    ? normalizedLevel
    : fallback;
};

const getUnlockedLevels = (placementLevel) => {
  const normalizedLevel = normalizeCefrLevel(placementLevel);
  const levelIndex = CEFR_LEVELS.indexOf(normalizedLevel);

  return CEFR_LEVELS.slice(0, levelIndex + 1);
};

const getTimestampMillis = (value) => {
  if (!value) return 0;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsedDate = new Date(value).getTime();

  return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

const getUserTests = async (userId) => {
  if (!userId) return [];

  const testsRef = collection(db, "userTests");

  const userTestsQuery = query(
    testsRef,
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(userTestsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data()
  }));
};

export const logUserTest = async (userId) => {
  try {
    if (!userId) {
      throw new Error("Invalid user.");
    }

    const testRef = collection(db, "userTests");

    const result = await addDoc(testRef, {
      userId,
      testDate: serverTimestamp(),
      completed: false,
      testProgress: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return result.id;
  } catch (error) {
    console.error("Error logging user test:", error);
    throw error;
  }
};

export const saveUserTestResult = async (userId, testResults) => {
  try {
    if (!userId || !testResults) {
      throw new Error("Invalid user or test results.");
    }

    const placementLevel = normalizeCefrLevel(
      testResults.placementLevel || testResults.finalLevel
    );

    const finalLevel = normalizeCefrLevel(
      testResults.finalLevel || placementLevel
    );

    const currentLevel = placementLevel;
    const unlockedLevels = getUnlockedLevels(placementLevel);

    const levelResults =
      testResults.levelResults &&
      typeof testResults.levelResults === "object" &&
      !Array.isArray(testResults.levelResults)
        ? testResults.levelResults
        : {};

    const skillResults =
      testResults.skillResults &&
      typeof testResults.skillResults === "object" &&
      !Array.isArray(testResults.skillResults)
        ? testResults.skillResults
        : {};

    const overallScore = calculateOverallScore(levelResults);
    const now = Timestamp.now();

    const testRef = collection(db, "userTests");

    const testData = {
      userId,
      testDate: now,
      completed: true,
      results: {
        placementLevel,
        finalLevel,
        overallScore,
        levelResults,
        skillResults,
        timeSpent: Math.max(Number(testResults.timeSpent) || 0, 0)
      },
      createdAt: now,
      updatedAt: now
    };

    const result = await addDoc(testRef, testData);

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      placementLevel,
      currentLevel,
      unlockedLevels,
      lastTestDate: now,
      updatedAt: serverTimestamp(),
      testHistory: arrayUnion({
        testId: result.id,
        date: now,
        placementLevel,
        finalLevel,
        level: placementLevel,
        score: overallScore,
        passed: overallScore >= MIN_PASSING_SCORE
      })
    });

    return result.id;
  } catch (error) {
    console.error("Error saving test results:", error);
    throw error;
  }
};

export const getIncompleteTest = async (userId) => {
  try {
    if (!userId) return null;

    const tests = await getUserTests(userId);

    const incompleteTests = tests
      .filter((test) => test.completed === false)
      .sort(
        (a, b) =>
          getTimestampMillis(b.testDate) -
          getTimestampMillis(a.testDate)
      );

    return incompleteTests[0] || null;
  } catch (error) {
    console.error("Error getting incomplete test:", error);
    throw error;
  }
};

export const updateTestProgress = async (testId, progress) => {
  try {
    if (!testId) {
      throw new Error("Invalid test.");
    }

    const testRef = doc(db, "userTests", testId);

    await updateDoc(testRef, {
      testProgress: progress || null,
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error updating test progress:", error);
    throw error;
  }
};

export const getUserTestHistory = async (userId) => {
  try {
    if (!userId) return [];

    const tests = await getUserTests(userId);

    return tests
      .filter((test) => test.completed === true)
      .sort(
        (a, b) =>
          getTimestampMillis(b.testDate) -
          getTimestampMillis(a.testDate)
      );
  } catch (error) {
    console.error("Error getting test history:", error);
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    const tests = await getUserTestHistory(userId);

    const levelProgress = tests.reduce((acc, test) => {
      const level =
        test.results?.placementLevel ||
        test.results?.finalLevel ||
        "unknown";

      acc[level] = (acc[level] || 0) + 1;

      return acc;
    }, {});

    const averageScore =
      tests.length > 0
        ? tests.reduce(
            (sum, test) =>
              sum + Number(test.results?.overallScore || 0),
            0
          ) / tests.length
        : 0;

    return {
      totalTests: tests.length,
      levelProgress,
      averageScore,
      lastTestDate: tests[0]?.testDate || null
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};

export const hasRecentTest = async (userId) => {
  try {
    if (!userId) return false;

    const tests = await getUserTests(userId);

    const recentTestLimit = Date.now() -
      RECENT_TEST_DAYS * 24 * 60 * 60 * 1000;

    return tests.some(
      (test) =>
        test.completed === true &&
        getTimestampMillis(test.testDate) > recentTestLimit
    );
  } catch (error) {
    console.error("Error checking recent test:", error);
    throw error;
  }
};

/* PRESENTATIONS */

export const getPresentations = async (levelId, lessonId) => {
  try {
    if (!levelId || !lessonId) return [];

    const q = query(
      collection(db, "presentations"),
      where("levelId", "==", levelId),
      where("lessonId", "==", lessonId)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));
  } catch (error) {
    console.error("Error getting presentations:", error);
    throw error;
  }
};

export const addPresentation = async (presentationData) => {
  try {
    const docRef = await addDoc(collection(db, "presentations"), {
      ...presentationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      comments: []
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding presentation:", error);
    throw error;
  }
};

export const addComment = async (presentationId, commentData) => {
  try {
    if (!presentationId) throw new Error("Invalid presentation.");

    const presentationRef = doc(db, "presentations", presentationId);

    const comment = {
      ...commentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    await updateDoc(presentationRef, {
      comments: arrayUnion(comment),
      updatedAt: serverTimestamp()
    });

    return comment;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const uploadAudio = async (audioBlob) => {
  try {
    if (!audioBlob) throw new Error("Invalid audio.");

    const audioRef = ref(storage, `presentations/${Date.now()}_audio.wav`);

    await uploadBytes(audioRef, audioBlob);

    return await getDownloadURL(audioRef);
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};

export const {
  createTest,
  getTest,
  updateTest,
  getAllTests,
  checkTestExists,
  deleteTest,
  getTestsByLevel
} = testService;

export default {
  createUserDocument,
  isUserAdmin,
  updateUserRole,
  toggleUserForumBlock,
  getAllUsers,
  deleteUserAccount,

  createNewLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  getLessonsByLevel,

  createNewThemeLesson,
  getThemeLessonById,
  updateThemeLesson,
  deleteThemeLesson,
  getLessonsByTheme,

  createMission,
  getMissionById,
  getMissionsByTheme,
  updateMission,
  deleteMission,
  duplicateMission,
  
  getAllThemes,
  createTheme,
  updateTheme,
  deleteTheme,

  logUserTest,
  saveUserTestResult,
  getIncompleteTest,
  updateTestProgress,
  getUserTestHistory,
  getUserStats,
  hasRecentTest,

  getPresentations,
  addPresentation,
  addComment,
  uploadAudio,

  tests: testService
};