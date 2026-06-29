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

/* TESTS */

export const logUserTest = async (userId) => {
  if (!userId) throw new Error("Usuario no válido");

  const testRef = collection(db, "userTests");

  await addDoc(testRef, {
    userId,
    testDate: serverTimestamp(),
    completed: false
  });
};

export const saveUserTestResult = async (userId, testResults) => {
  try {
    if (!userId || !testResults) {
      throw new Error("Usuario o resultados no válidos");
    }

    const overallScore = calculateOverallScore(testResults.levelResults);

    const testRef = collection(db, "userTests");

    const testData = {
      userId,
      testDate: Timestamp.now(),
      completed: true,
      results: {
        finalLevel: testResults.finalLevel,
        overallScore,
        levelResults: testResults.levelResults || {},
        timeSpent: testResults.timeSpent || 0
      }
    };

    const result = await addDoc(testRef, testData);

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      currentLevel: testResults.finalLevel,
      lastTestDate: Timestamp.now(),
      updatedAt: serverTimestamp(),
      testHistory: arrayUnion({
        date: Timestamp.now(),
        level: testResults.finalLevel,
        score: overallScore,
        passed: overallScore >= 70
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

    const testRef = collection(db, "userTests");

    const q = query(
      testRef,
      where("userId", "==", userId),
      where("completed", "==", false),
      orderBy("testDate", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error("Error getting incomplete test:", error);
    throw error;
  }
};

export const updateTestProgress = async (testId, progress) => {
  try {
    if (!testId) throw new Error("Test no válido");

    const testRef = doc(db, "userTests", testId);

    await updateDoc(testRef, {
      testProgress: progress,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating test progress:", error);
    throw error;
  }
};

export const getUserTestHistory = async (userId) => {
  try {
    if (!userId) return [];

    const testRef = collection(db, "userTests");
    const q = query(testRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data()
      }))
      .filter((test) => test.completed)
      .sort((a, b) => {
        const dateA = a.testDate?.toDate?.() || new Date(0);
        const dateB = b.testDate?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
  } catch (error) {
    console.error("Error getting test history:", error);
    return [];
  }
};

export const getUserStats = async (userId) => {
  try {
    const tests = await getUserTestHistory(userId);

    return {
      totalTests: tests.length,
      levelProgress: tests.reduce((acc, test) => {
        const level = test.results?.finalLevel || "unknown";
        if (!acc[level]) acc[level] = 0;
        acc[level]++;
        return acc;
      }, {}),
      averageScore:
        tests.length > 0
          ? tests.reduce(
              (acc, test) => acc + (test.results?.overallScore || 0),
              0
            ) / tests.length
          : 0,
      lastTestDate: tests[0]?.testDate || null
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};

export const hasRecentTest = async (userId) => {
  if (!userId) return false;

  const twentyDaysAgo = Timestamp.fromDate(
    new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
  );

  const testRef = collection(db, "userTests");

  const q = query(
    testRef,
    where("userId", "==", userId),
    where("testDate", ">", twentyDaysAgo),
    orderBy("testDate", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  return !snapshot.empty;
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
    if (!presentationId) throw new Error("Presentación no válida");

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
    if (!audioBlob) throw new Error("Audio no válido");

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