// src/services/firestoreService.js

import { db, storage } from "../../firebase";
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
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import testService from "../test/testService.js";

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

const VALID_USER_ROLES = new Set([
  "admin",
  "user"
]);

const VALID_ACCOUNT_TYPES = new Set([
  "independent",
  "organization"
]);

const VALID_ORGANIZATION_MEMBERSHIP_STATUSES = new Set([
  "not_applicable",
  "pending",
  "active",
  "suspended",
  "removed"
]);

const normalizeUserText = (value = "") => {
  return String(value)
    .normalize("NFKC")
    .trim();
};

const normalizeCountryCode = (country = "") => {
  return normalizeUserText(country)
    .toUpperCase()
    .slice(0, 2);
};

const normalizeUserAge = (age) => {
  const numericAge = Number(age);

  if (
    !Number.isInteger(numericAge) ||
    numericAge < 1 ||
    numericAge > 120
  ) {
    return null;
  }

  return numericAge;
};

const normalizeAccountType = (accountType) => {
  const normalizedType = normalizeUserText(
    accountType
  ).toLowerCase();

  return VALID_ACCOUNT_TYPES.has(normalizedType)
    ? normalizedType
    : "independent";
};

const normalizeOrganizationMembershipStatus = (
  status,
  accountType
) => {
  if (accountType === "independent") {
    return "not_applicable";
  }

  const normalizedStatus = normalizeUserText(
    status
  ).toLowerCase();

  return VALID_ORGANIZATION_MEMBERSHIP_STATUSES.has(
    normalizedStatus
  )
    ? normalizedStatus
    : "pending";
};

/**
 * Creates the application profile associated with a Firebase Auth user.
 *
 * Existing administrative values are preserved when the document
 * already exists.
 *
 * @param {import("firebase/auth").User} user
 * @param {object} extraData
 * @returns {Promise<object|null>}
 */
export const createUserDocument = async (
  user,
  extraData = {}
) => {
  try {
    if (!user?.uid) {
      throw new Error(
        "A valid authenticated user is required."
      );
    }

    const normalizedEmail = normalizeEmail(
      extraData.email || user.email
    );

    if (!normalizedEmail) {
      throw new Error(
        "A valid email address is required."
      );
    }

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const existingSnapshot = await getDoc(
      userRef
    );

    const existingData = existingSnapshot.exists()
      ? existingSnapshot.data()
      : null;

    const defaultRole = DEFAULT_ADMINS.includes(
      normalizedEmail
    )
      ? "admin"
      : "user";

    /*
     * Preserve an existing valid role. This prevents a later profile
     * synchronization from accidentally downgrading or promoting users.
     */
    const role =
      existingData &&
      VALID_USER_ROLES.has(existingData.role)
        ? existingData.role
        : defaultRole;

    const accountType = normalizeAccountType(
      extraData.accountType
    );

    const organizationId =
      accountType === "organization"
        ? normalizeUserText(
            extraData.organizationId
          ) || null
        : null;

    const organizationMembershipStatus =
      normalizeOrganizationMembershipStatus(
        extraData.organizationMembershipStatus,
        accountType
      );

    const userDocumentData = {
      uid: user.uid,

      name: normalizeUserText(
        extraData.name
      ),

      lastName: normalizeUserText(
        extraData.lastName
      ),

      email: normalizedEmail,

      age: normalizeUserAge(
        extraData.age
      ),

      ageGroup:
        normalizeUserText(
          extraData.ageGroup
        ) || "all",

      /*
       * Stored as an ISO 3166-1 alpha-2 code:
       * PL, CO, ES, DE, etc.
       */
      country: normalizeCountryCode(
        extraData.country
      ),

      role,

      isActive:
        existingData?.isActive ??
        true,

      emailVerified: Boolean(
        user.emailVerified
      ),

      /*
       * Initial SaaS and multi-tenant fields.
       */
      accountType,
      organizationId,
      organizationMembershipStatus,

      /*
       * Administrative and forum state.
       * Existing values are preserved when the document already exists.
       */
      forumBlocked:
        existingData?.forumBlocked ??
        false,

      forumBlockedReason:
        existingData?.forumBlockedReason ??
        null,

      forumBlockedAt:
        existingData?.forumBlockedAt ??
        null,

      updatedAt: serverTimestamp(),

      lastLogin:
        existingData?.lastLogin ??
        null
    };

    /*
     * createdAt must only be assigned when the document is first created.
     */
    if (!existingSnapshot.exists()) {
      userDocumentData.createdAt =
        serverTimestamp();
    }

    await setDoc(
      userRef,
      userDocumentData,
      {
        merge: true
      }
    );

    return {
      id: user.uid,
      ...userDocumentData
    };
  } catch (error) {
    console.error(
      "Error creating user document:",
      error
    );

    throw error;
  }
};

/**
 * Checks whether a Firestore user has the admin role.
 *
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const isUserAdmin = async (
  userId
) => {
  try {
    if (!userId) {
      return false;
    }

    const userRef = doc(
      db,
      "users",
      userId
    );

    const userSnapshot = await getDoc(
      userRef
    );

    return (
      userSnapshot.exists() &&
      userSnapshot.data().role ===
        "admin"
    );
  } catch (error) {
    console.error(
      "Error checking admin status:",
      error
    );

    return false;
  }
};

/**
 * Updates a user's application role.
 *
 * Authorization must also be enforced through Firestore Security Rules.
 *
 * @param {string} userId
 * @param {"admin"|"user"} newRole
 * @returns {Promise<boolean>}
 */
export const updateUserRole = async (
  userId,
  newRole
) => {
  try {
    if (!userId) {
      throw new Error(
        "A valid user ID is required."
      );
    }

    if (
      !VALID_USER_ROLES.has(newRole)
    ) {
      throw new Error(
        "The supplied user role is invalid."
      );
    }

    const userRef = doc(
      db,
      "users",
      userId
    );

    const userSnapshot = await getDoc(
      userRef
    );

    if (!userSnapshot.exists()) {
      throw new Error(
        "The user document was not found."
      );
    }

    await updateDoc(
      userRef,
      {
        role: newRole,
        updatedAt: serverTimestamp()
      }
    );

    return true;
  } catch (error) {
    console.error(
      "Error updating user role:",
      error
    );

    throw error;
  }
};

/**
 * Blocks or unblocks a user from participating in the forum.
 *
 * @param {object} options
 * @param {string} options.userId
 * @param {boolean} options.blocked
 * @param {string|null} options.reason
 * @returns {Promise<boolean>}
 */
export const toggleUserForumBlock = async ({
  userId,
  blocked,
  reason = null
}) => {
  try {
    if (!userId) {
      throw new Error(
        "A valid user ID is required."
      );
    }

    const userRef = doc(
      db,
      "users",
      userId
    );

    const userSnapshot = await getDoc(
      userRef
    );

    if (!userSnapshot.exists()) {
      throw new Error(
        "The user document was not found."
      );
    }

    const normalizedReason =
      normalizeUserText(reason);

    await updateDoc(
      userRef,
      {
        forumBlocked:
          Boolean(blocked),

        forumBlockedReason:
          blocked
            ? normalizedReason ||
              "Blocked from the administration panel."
            : null,

        forumBlockedAt:
          blocked
            ? serverTimestamp()
            : null,

        updatedAt:
          serverTimestamp()
      }
    );

    return true;
  } catch (error) {
    console.error(
      "Error updating forum block status:",
      error
    );

    throw error;
  }
};

/**
 * Retrieves all application user profiles.
 *
 * @returns {Promise<Array<object>>}
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(
      db,
      "users"
    );

    const snapshot = await getDocs(
      usersRef
    );

    return snapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data()
      })
    );
  } catch (error) {
    console.error(
      "Error getting users:",
      error
    );

    throw error;
  }
};

/**
 * Deletes only the Firestore profile document.
 *
 * Important:
 * This function does not delete the Firebase Authentication account.
 * Deleting another user's Auth account securely requires a trusted
 * backend using the Firebase Admin SDK.
 *
 * The existing function name is preserved to avoid breaking imports.
 *
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const deleteUserAccount = async (
  userId
) => {
  try {
    if (!userId) {
      throw new Error(
        "A valid user ID is required."
      );
    }

    const userRef = doc(
      db,
      "users",
      userId
    );

    const userSnapshot = await getDoc(
      userRef
    );

    if (!userSnapshot.exists()) {
      return true;
    }

    await deleteDoc(userRef);

    return true;
  } catch (error) {
    console.error(
      "Error deleting user document:",
      error
    );

    throw error;
  }
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

const MISSION_LIMITS = {
  title: {
    min: 5,
    max: 100
  },

  aiRole: {
    min: 3,
    max: 100
  },

  description: {
    min: 20,
    max: 300
  },

  scenario: {
    min: 50,
    max: 2000
  },

  aiInstructions: {
    min: 30,
    max: 2000
  },

  objective: {
    min: 5,
    max: 200
  },

  objectives: {
    min: 1,
    max: 10
  },

  tags: {
    maxItems: 15,
    maxLength: 40
  },

  xpReward: {
    min: 1,
    max: 1000
  },

  estimatedMinutes: {
    min: 1,
    max: 120
  },

  order: {
    min: 1,
    max: 9999
  }
};

const VALID_MISSION_LEVELS = new Set([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
]);

const VALID_MISSION_DIFFICULTIES = new Set([
  "easy",
  "medium",
  "hard",
  "adaptive"
]);

const VALID_MISSION_AGE_GROUPS = new Set([
  "all",
  "children",
  "teen",
  "adult",
  "senior"
]);

const VALID_MISSION_STATUSES = new Set([
  "draft",
  "published",
  "archived"
]);

const normalizeMissionSingleLine = (
  value = ""
) => {
  return String(value)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
};

const normalizeMissionMultiline = (
  value = ""
) => {
  return String(value)
    .normalize("NFKC")
    .trim()
    .replace(/\r\n/g, "\n");
};

const normalizeMissionComparableText = (
  value = ""
) => {
  return normalizeMissionSingleLine(
    value
  ).toLocaleLowerCase("en-US");
};

const createMissionObjectiveId = () => {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    typeof globalThis.crypto
      .randomUUID === "function"
  ) {
    return `objective_${globalThis.crypto.randomUUID()}`;
  }

  return `objective_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const normalizeMissionTags = (
  tags
) => {
  const sourceTags = Array.isArray(
    tags
  )
    ? tags
    : String(tags || "").split(",");

  const uniqueTags = new Set();

  sourceTags.forEach((tag) => {
    const normalizedTag =
      normalizeMissionSingleLine(
        tag
      )
        .toLocaleLowerCase(
          "en-US"
        )
        .slice(
          0,
          MISSION_LIMITS.tags
            .maxLength
        );

    if (normalizedTag) {
      uniqueTags.add(
        normalizedTag
      );
    }
  });

  return Array.from(
    uniqueTags
  ).slice(
    0,
    MISSION_LIMITS.tags.maxItems
  );
};

const normalizeMissionObjectives = (
  objectives
) => {
  if (!Array.isArray(objectives)) {
    return [];
  }

  return objectives
    .map((objective) => ({
      id:
        String(
          objective?.id || ""
        ).trim() ||
        createMissionObjectiveId(),

      text:
        normalizeMissionSingleLine(
          objective?.text
        ),

      required:
        objective?.required !==
        false
    }))
    .filter(
      (objective) =>
        objective.text
    );
};

const normalizeMissionInput = (
  missionData = {}
) => {
  return {
    title:
      normalizeMissionSingleLine(
        missionData.title
      ),

    description:
      normalizeMissionMultiline(
        missionData.description
      ),

    scenario:
      normalizeMissionMultiline(
        missionData.scenario
      ),

    aiRole:
      normalizeMissionSingleLine(
        missionData.aiRole
      ),

    aiInstructions:
      normalizeMissionMultiline(
        missionData.aiInstructions
      ),

    difficulty:
      VALID_MISSION_DIFFICULTIES.has(
        missionData.difficulty
      )
        ? missionData.difficulty
        : "easy",

    level:
      VALID_MISSION_LEVELS.has(
        missionData.level
      )
        ? missionData.level
        : "A1",

    ageGroup:
      VALID_MISSION_AGE_GROUPS.has(
        missionData.ageGroup
      )
        ? missionData.ageGroup
        : "all",

    estimatedMinutes:
      Number(
        missionData.estimatedMinutes
      ),

    xpReward:
      Number(
        missionData.xpReward
      ),

    order:
      Number(
        missionData.order
      ),

    status:
      VALID_MISSION_STATUSES.has(
        missionData.status
      )
        ? missionData.status
        : "draft",

    missionType:
      "conversation",

    feedbackMode:
      "after_mission",

    correctionMode:
      "delayed",

    objectives:
      normalizeMissionObjectives(
        missionData.objectives
      ),

    tags:
      normalizeMissionTags(
        missionData.tags
      )
  };
};

const validateMissionTextLength = ({
  value,
  label,
  minimum,
  maximum,
  required = true
}) => {
  const length =
    String(value || "").trim()
      .length;

  if (
    required &&
    length === 0
  ) {
    throw new Error(
      `${label} jest wymagany.`
    );
  }

  if (
    length > 0 &&
    length < minimum
  ) {
    throw new Error(
      `${label} musi zawierać co najmniej ${minimum} znaków.`
    );
  }

  if (length > maximum) {
    throw new Error(
      `${label} może zawierać maksymalnie ${maximum} znaków.`
    );
  }
};

const validateMissionInteger = ({
  value,
  label,
  minimum,
  maximum
}) => {
  if (!Number.isInteger(value)) {
    throw new Error(
      `${label} musi być liczbą całkowitą.`
    );
  }

  if (
    value < minimum ||
    value > maximum
  ) {
    throw new Error(
      `${label} musi mieścić się w zakresie od ${minimum} do ${maximum}.`
    );
  }
};

const validateMissionData = (
  missionData = {}
) => {
  const mission =
    normalizeMissionInput(
      missionData
    );

  validateMissionTextLength({
    value: mission.title,
    label: "Tytuł misji",
    minimum:
      MISSION_LIMITS.title.min,
    maximum:
      MISSION_LIMITS.title.max
  });

  validateMissionTextLength({
    value: mission.aiRole,
    label: "Rola AI",
    minimum:
      MISSION_LIMITS.aiRole.min,
    maximum:
      MISSION_LIMITS.aiRole.max
  });

  validateMissionTextLength({
    value: mission.description,
    label: "Opis misji",
    minimum:
      MISSION_LIMITS
        .description.min,
    maximum:
      MISSION_LIMITS
        .description.max
  });

  validateMissionTextLength({
    value: mission.scenario,
    label: "Scenariusz misji",
    minimum:
      MISSION_LIMITS.scenario.min,
    maximum:
      MISSION_LIMITS.scenario.max
  });

  validateMissionTextLength({
    value:
      mission.aiInstructions,

    label:
      "Instrukcje dla AI",

    minimum:
      MISSION_LIMITS
        .aiInstructions.min,

    maximum:
      MISSION_LIMITS
        .aiInstructions.max,

    required:
      mission.status ===
      "published"
  });

  if (
    mission.objectives.length <
    MISSION_LIMITS.objectives.min
  ) {
    throw new Error(
      "Dodaj co najmniej jeden cel misji."
    );
  }

  if (
    mission.objectives.length >
    MISSION_LIMITS.objectives.max
  ) {
    throw new Error(
      `Misja może zawierać maksymalnie ${MISSION_LIMITS.objectives.max} celów.`
    );
  }

  const objectiveTexts =
    new Set();

  mission.objectives.forEach(
    (objective, index) => {
      validateMissionTextLength({
        value: objective.text,

        label:
          `Cel ${index + 1}`,

        minimum:
          MISSION_LIMITS
            .objective.min,

        maximum:
          MISSION_LIMITS
            .objective.max
      });

      const comparableText =
        normalizeMissionComparableText(
          objective.text
        );

      if (
        objectiveTexts.has(
          comparableText
        )
      ) {
        throw new Error(
          `Cel ${index + 1} jest duplikatem innego celu.`
        );
      }

      objectiveTexts.add(
        comparableText
      );
    }
  );

  if (
    mission.status ===
      "published" &&
    !mission.objectives.some(
      (objective) =>
        objective.required === true
    )
  ) {
    throw new Error(
      "Opublikowana misja musi zawierać co najmniej jeden wymagany cel."
    );
  }

  validateMissionInteger({
    value: mission.xpReward,
    label: "Nagroda XP",
    minimum:
      MISSION_LIMITS.xpReward.min,
    maximum:
      MISSION_LIMITS.xpReward.max
  });

  validateMissionInteger({
    value:
      mission.estimatedMinutes,

    label:
      "Szacowany czas",

    minimum:
      MISSION_LIMITS
        .estimatedMinutes.min,

    maximum:
      MISSION_LIMITS
        .estimatedMinutes.max
  });

  validateMissionInteger({
    value: mission.order,
    label: "Kolejność",
    minimum:
      MISSION_LIMITS.order.min,
    maximum:
      MISSION_LIMITS.order.max
  });

  return mission;
};

const isMissionArchived = (
  mission = {}
) => {
  return (
    mission.isDeleted === true ||
    mission.status === "archived"
  );
};

const getAllMissionDocuments =
  async (themeId) => {
    if (!themeId) {
      return [];
    }

    const missionsSnapshot =
      await getDocs(
        collection(
          db,
          "temas",
          themeId,
          "missions"
        )
      );

    return missionsSnapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data()
      })
    );
  };

const assertMissionUniqueness =
  async ({
    themeId,
    title,
    order,
    excludedMissionId = null
  }) => {
    const missions =
      await getAllMissionDocuments(
        themeId
      );

    const normalizedTitle =
      normalizeMissionComparableText(
        title
      );

    const duplicatedTitle =
      missions.find((mission) => {
        if (
          mission.id ===
          excludedMissionId
        ) {
          return false;
        }

        return (
          normalizeMissionComparableText(
            mission.title
          ) === normalizedTitle
        );
      });

    if (duplicatedTitle) {
      throw new Error(
        `Misja o tytule „${duplicatedTitle.title || title}” już istnieje w tym temacie.`
      );
    }

    const duplicatedOrder =
      missions.find(
        (mission) =>
          mission.id !==
            excludedMissionId &&
          Number(mission.order) ===
            Number(order)
      );

    if (duplicatedOrder) {
      throw new Error(
        `Kolejność ${order} jest już używana przez misję „${duplicatedOrder.title || "bez tytułu"}”.`
      );
    }
  };

const assertThemeAvailableForMission =
  async (themeId) => {
    const themeRef =
      doc(
        db,
        "temas",
        themeId
      );

    const themeSnapshot =
      await getDoc(themeRef);

    if (!themeSnapshot.exists()) {
      throw new Error(
        "Nie znaleziono tematu."
      );
    }

    const themeData =
      themeSnapshot.data();

    if (
      themeData.isDeleted === true ||
      themeData.status ===
        "archived"
    ) {
      throw new Error(
        "Nie można zarządzać misjami zarchiwizowanego tematu."
      );
    }

    return themeData;
  };

export const createMission =
  async (
    themeId,
    missionData
  ) => {
    try {
      if (!themeId) {
        throw new Error(
          "Nieprawidłowy temat."
        );
      }

      await assertThemeAvailableForMission(
        themeId
      );

      const normalizedMission =
        validateMissionData(
          missionData
        );

      await assertMissionUniqueness({
        themeId,

        title:
          normalizedMission.title,

        order:
          normalizedMission.order
      });

      const missionsRef =
        collection(
          db,
          "temas",
          themeId,
          "missions"
        );

      const dataToSave = {
        ...buildMissionData({
          missionData:
            normalizedMission,

          themeId
        }),

        normalizedTitle:
          normalizeMissionComparableText(
            normalizedMission.title
          ),

        status:
          normalizedMission.status,

        isDeleted:
          normalizedMission.status ===
          "archived",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        deletedAt:
          normalizedMission.status ===
          "archived"
            ? serverTimestamp()
            : null,

        restoredAt: null
      };

      if (missionData.id) {
        const missionRef =
          doc(
            missionsRef,
            missionData.id
          );

        const existingSnapshot =
          await getDoc(
            missionRef
          );

        if (
          existingSnapshot.exists()
        ) {
          throw new Error(
            "Misja o podanym identyfikatorze już istnieje."
          );
        }

        await setDoc(
          missionRef,
          {
            ...dataToSave,
            id: missionData.id
          }
        );

        return {
          id: missionData.id,
          ...dataToSave
        };
      }

      const createdRef =
        await addDoc(
          missionsRef,
          dataToSave
        );

      await updateDoc(
        createdRef,
        {
          id: createdRef.id
        }
      );

      return {
        id: createdRef.id,
        ...dataToSave
      };
    } catch (error) {
      console.error(
        "Error creating mission:",
        error
      );

      throw error;
    }
  };

export const getMissionById =
  async (
    themeId,
    missionId
  ) => {
    try {
      if (
        !themeId ||
        !missionId
      ) {
        return null;
      }

      const missionRef =
        doc(
          db,
          "temas",
          themeId,
          "missions",
          missionId
        );

      const missionSnapshot =
        await getDoc(
          missionRef
        );

      if (
        !missionSnapshot.exists()
      ) {
        return null;
      }

      return {
        id:
          missionSnapshot.id,

        ...missionSnapshot.data()
      };
    } catch (error) {
      console.error(
        "Error getting mission:",
        error
      );

      throw error;
    }
  };

export const getMissionsByTheme =
  async (
    themeId,
    {
      userAgeGroup = null,
      includeDrafts = false,
      includeArchived = false
    } = {}
  ) => {
    try {
      if (!themeId) {
        return [];
      }

      const missions =
        await getAllMissionDocuments(
          themeId
        );

      return missions
        .filter((mission) => {
          const missionStatus =
            mission.status ||
            "draft";

          const missionAgeGroup =
            mission.ageGroup ||
            "all";

          const archived =
            isMissionArchived(
              mission
            );

          if (
            archived &&
            !includeArchived
          ) {
            return false;
          }

          const statusAllowed =
            includeArchived
              ? true
              : includeDrafts
                ? missionStatus !==
                  "archived"
                : missionStatus ===
                  "published";

          const ageAllowed =
            !userAgeGroup ||
            missionAgeGroup ===
              "all" ||
            missionAgeGroup ===
              userAgeGroup;

          return (
            statusAllowed &&
            ageAllowed
          );
        })
        .sort((a, b) => {
          const orderA =
            Number(a.order) ||
            9999;

          const orderB =
            Number(b.order) ||
            9999;

          if (
            orderA !== orderB
          ) {
            return (
              orderA - orderB
            );
          }

          return String(
            a.title || ""
          ).localeCompare(
            String(
              b.title || ""
            ),
            "en",
            {
              sensitivity: "base"
            }
          );
        });
    } catch (error) {
      console.error(
        "Error getting theme missions:",
        error
      );

      throw error;
    }
  };

export const updateMission =
  async (
    themeId,
    missionId,
    updateData
  ) => {
    try {
      if (
        !themeId ||
        !missionId
      ) {
        throw new Error(
          "Nieprawidłowy temat lub misja."
        );
      }

      await assertThemeAvailableForMission(
        themeId
      );

      const missionRef =
        doc(
          db,
          "temas",
          themeId,
          "missions",
          missionId
        );

      const missionSnapshot =
        await getDoc(
          missionRef
        );

      if (
        !missionSnapshot.exists()
      ) {
        throw new Error(
          "Nie znaleziono misji."
        );
      }

      const currentMission =
        missionSnapshot.data();

      if (
        isMissionArchived(
          currentMission
        )
      ) {
        throw new Error(
          "Przed edycją należy przywrócić zarchiwizowaną misję."
        );
      }

      const normalizedMission =
        validateMissionData(
          updateData
        );

      await assertMissionUniqueness({
        themeId,

        title:
          normalizedMission.title,

        order:
          normalizedMission.order,

        excludedMissionId:
          missionId
      });

      const dataToUpdate = {
        ...buildMissionData({
          missionData: {
            ...normalizedMission,
            id: missionId
          },

          themeId
        }),

        normalizedTitle:
          normalizeMissionComparableText(
            normalizedMission.title
          ),

        status:
          normalizedMission.status,

        isDeleted:
          normalizedMission.status ===
          "archived",

        deletedAt:
          normalizedMission.status ===
          "archived"
            ? serverTimestamp()
            : null,

        updatedAt:
          serverTimestamp()
      };

      await updateDoc(
        missionRef,
        dataToUpdate
      );

      return {
        id: missionId,
        ...dataToUpdate
      };
    } catch (error) {
      console.error(
        "Error updating mission:",
        error
      );

      throw error;
    }
  };

/*
 * SOFT DELETE
 *
 * Se conserva el nombre deleteMission para no romper
 * las importaciones existentes. La función ya no elimina
 * físicamente el documento.
 */
export const deleteMission =
  async (
    themeId,
    missionId
  ) => {
    try {
      if (
        !themeId ||
        !missionId
      ) {
        throw new Error(
          "Nieprawidłowy temat lub misja."
        );
      }

      const missionRef =
        doc(
          db,
          "temas",
          themeId,
          "missions",
          missionId
        );

      const missionSnapshot =
        await getDoc(
          missionRef
        );

      if (
        !missionSnapshot.exists()
      ) {
        throw new Error(
          "Nie znaleziono misji."
        );
      }

      const currentMission =
        missionSnapshot.data();

      if (
        isMissionArchived(
          currentMission
        )
      ) {
        return {
          id: missionId,
          archived: true,
          alreadyArchived: true
        };
      }

      await updateDoc(
        missionRef,
        {
          previousStatus:
            currentMission.status ||
            "draft",

          status: "archived",
          isDeleted: true,

          deletedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

      return {
        id: missionId,
        archived: true,
        alreadyArchived: false
      };
    } catch (error) {
      console.error(
        "Error archiving mission:",
        error
      );

      throw error;
    }
  };

export const restoreMission =
  async (
    themeId,
    missionId
  ) => {
    try {
      if (
        !themeId ||
        !missionId
      ) {
        throw new Error(
          "Nieprawidłowy temat lub misja."
        );
      }

      await assertThemeAvailableForMission(
        themeId
      );

      const missionRef =
        doc(
          db,
          "temas",
          themeId,
          "missions",
          missionId
        );

      const missionSnapshot =
        await getDoc(
          missionRef
        );

      if (
        !missionSnapshot.exists()
      ) {
        throw new Error(
          "Nie znaleziono misji."
        );
      }

      const currentMission = {
        id:
          missionSnapshot.id,

        ...missionSnapshot.data()
      };

      if (
        !isMissionArchived(
          currentMission
        )
      ) {
        return {
          id: missionId,
          restored: true,
          alreadyActive: true
        };
      }

      const restoredStatus =
        currentMission.previousStatus ===
          "published"
          ? "published"
          : "draft";

      const normalizedMission =
        validateMissionData({
          ...currentMission,
          status: restoredStatus
        });

      await assertMissionUniqueness({
        themeId,

        title:
          normalizedMission.title,

        order:
          normalizedMission.order,

        excludedMissionId:
          missionId
      });

      await updateDoc(
        missionRef,
        {
          normalizedTitle:
            normalizeMissionComparableText(
              normalizedMission.title
            ),

          status:
            restoredStatus,

          previousStatus: null,
          isDeleted: false,
          deletedAt: null,

          restoredAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

      return {
        id: missionId,
        restored: true,
        alreadyActive: false
      };
    } catch (error) {
      console.error(
        "Error restoring mission:",
        error
      );

      throw error;
    }
  };

const getNextMissionOrder =
  async (themeId) => {
    const missions =
      await getAllMissionDocuments(
        themeId
      );

    const highestOrder =
      missions.reduce(
        (maximum, mission) =>
          Math.max(
            maximum,
            Number(
              mission.order
            ) || 0
          ),
        0
      );

    return highestOrder + 1;
  };

const buildUniqueMissionCopyTitle =
  async (
    themeId,
    originalTitle
  ) => {
    const missions =
      await getAllMissionDocuments(
        themeId
      );

    const existingTitles =
      new Set(
        missions.map((mission) =>
          normalizeMissionComparableText(
            mission.title
          )
        )
      );

    const baseTitle =
      normalizeMissionSingleLine(
        originalTitle ||
          "Mission"
      );

    let candidateTitle =
      `${baseTitle} (Copy)`;

    let copyNumber = 2;

    while (
      existingTitles.has(
        normalizeMissionComparableText(
          candidateTitle
        )
      )
    ) {
      candidateTitle =
        `${baseTitle} (Copy ${copyNumber})`;

      copyNumber += 1;
    }

    return candidateTitle;
  };

export const duplicateMission =
  async (
    themeId,
    missionId
  ) => {
    try {
      if (
        !themeId ||
        !missionId
      ) {
        throw new Error(
          "Nieprawidłowy temat lub misja."
        );
      }

      await assertThemeAvailableForMission(
        themeId
      );

      const originalMission =
        await getMissionById(
          themeId,
          missionId
        );

      if (!originalMission) {
        throw new Error(
          "Nie znaleziono oryginalnej misji."
        );
      }

      if (
        isMissionArchived(
          originalMission
        )
      ) {
        throw new Error(
          "Nie można kopiować zarchiwizowanej misji."
        );
      }

      const [
        duplicatedTitle,
        duplicatedOrder
      ] = await Promise.all([
        buildUniqueMissionCopyTitle(
          themeId,
          originalMission.title
        ),

        getNextMissionOrder(
          themeId
        )
      ]);

      const duplicatedMission = {
        title:
          duplicatedTitle,

        description:
          originalMission.description,

        scenario:
          originalMission.scenario,

        aiRole:
          originalMission.aiRole,

        aiInstructions:
          originalMission.aiInstructions,

        difficulty:
          originalMission.difficulty,

        level:
          originalMission.level,

        ageGroup:
          originalMission.ageGroup,

        estimatedMinutes:
          originalMission.estimatedMinutes,

        xpReward:
          originalMission.xpReward,

        order:
          duplicatedOrder,

        status:
          "draft",

        missionType:
          "conversation",

        feedbackMode:
          "after_mission",

        correctionMode:
          "delayed",

        objectives:
          normalizeMissionObjectives(
            originalMission.objectives
          ).map((objective) => ({
            ...objective,
            id:
              createMissionObjectiveId()
          })),

        tags:
          normalizeMissionTags(
            originalMission.tags
          )
      };

      return await createMission(
        themeId,
        duplicatedMission
      );
    } catch (error) {
      console.error(
        "Error duplicating mission:",
        error
      );

      throw error;
    }
  };

/* THEMES */

const THEME_TITLE_MIN_LENGTH = 3;
const THEME_TITLE_MAX_LENGTH = 60;

const THEME_DESCRIPTION_MIN_LENGTH = 20;
const THEME_DESCRIPTION_MAX_LENGTH = 300;

const normalizeThemeTitleKey = (
  value = ""
) => {
  return String(value)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
};

const normalizeThemeData = (
  themeData = {}
) => {
  const title = String(
    themeData.title || ""
  )
    .trim()
    .replace(/\s+/g, " ");

  const description = String(
    themeData.description || ""
  ).trim();

  return {
    icon: String(
      themeData.icon || ""
    ).trim(),

    title,

    normalizedTitle:
      normalizeThemeTitleKey(title),

    description,

    numero:
      Number(themeData.numero) || 0
  };
};

const validateThemeData = (
  themeData = {}
) => {
  const normalizedTheme =
    normalizeThemeData(themeData);

  if (!normalizedTheme.icon) {
    throw new Error(
      "Wybierz ikonę tematu."
    );
  }

  if (!normalizedTheme.title) {
    throw new Error(
      "Tytuł tematu jest wymagany."
    );
  }

  if (
    normalizedTheme.title.length <
    THEME_TITLE_MIN_LENGTH
  ) {
    throw new Error(
      `Tytuł tematu musi zawierać co najmniej ${THEME_TITLE_MIN_LENGTH} znaki.`
    );
  }

  if (
    normalizedTheme.title.length >
    THEME_TITLE_MAX_LENGTH
  ) {
    throw new Error(
      `Tytuł tematu może zawierać maksymalnie ${THEME_TITLE_MAX_LENGTH} znaków.`
    );
  }

  if (!normalizedTheme.description) {
    throw new Error(
      "Opis tematu jest wymagany."
    );
  }

  if (
    normalizedTheme.description.length <
    THEME_DESCRIPTION_MIN_LENGTH
  ) {
    throw new Error(
      `Opis tematu musi zawierać co najmniej ${THEME_DESCRIPTION_MIN_LENGTH} znaków.`
    );
  }

  if (
    normalizedTheme.description.length >
    THEME_DESCRIPTION_MAX_LENGTH
  ) {
    throw new Error(
      `Opis tematu może zawierać maksymalnie ${THEME_DESCRIPTION_MAX_LENGTH} znaków.`
    );
  }

  if (
    !Number.isInteger(
      normalizedTheme.numero
    ) ||
    normalizedTheme.numero <= 0
  ) {
    throw new Error(
      "Numer tematu musi być dodatnią liczbą całkowitą."
    );
  }

  return normalizedTheme;
};

const getAllThemeDocuments =
  async () => {
    const themesSnapshot =
      await getDocs(
        collection(db, "temas")
      );

    return themesSnapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data()
      })
    );
  };

const assertThemeUniqueness =
  async ({
    numero,
    normalizedTitle,
    excludedThemeId = null
  }) => {
    const existingThemes =
      await getAllThemeDocuments();

    const duplicatedNumber =
      existingThemes.find(
        (theme) =>
          theme.id !==
            excludedThemeId &&
          Number(theme.numero) ===
            Number(numero)
      );

    if (duplicatedNumber) {
      throw new Error(
        `Numer tematu ${numero} jest już używany przez temat „${duplicatedNumber.title || "bez nazwy"}”.`
      );
    }

    const duplicatedTitle =
      existingThemes.find(
        (theme) => {
          if (
            theme.id ===
            excludedThemeId
          ) {
            return false;
          }

          const existingTitleKey =
            theme.normalizedTitle ||
            normalizeThemeTitleKey(
              theme.title
            );

          return (
            existingTitleKey ===
            normalizedTitle
          );
        }
      );

    if (duplicatedTitle) {
      throw new Error(
        `Temat o tytule „${duplicatedTitle.title || "bez nazwy"}” już istnieje.`
      );
    }
  };

const isThemeArchived = (
  theme = {}
) => {
  return (
    theme.isDeleted === true ||
    theme.status === "archived"
  );
};

export const getAllThemes =
  async ({
    includeArchived = false
  } = {}) => {
    try {
      const themes =
        await getAllThemeDocuments();

      return themes
        .filter(
          (theme) =>
            includeArchived ||
            !isThemeArchived(theme)
        )
        .sort((a, b) => {
          const numberA =
            Number(a.numero) || 0;

          const numberB =
            Number(b.numero) || 0;

          if (numberA !== numberB) {
            return numberA - numberB;
          }

          return String(
            a.title || ""
          ).localeCompare(
            String(b.title || ""),
            "en",
            {
              sensitivity: "base"
            }
          );
        });
    } catch (error) {
      console.error(
        "Error getting themes:",
        error
      );

      throw error;
    }
  };

export const createTheme =
  async (themeData) => {
    try {
      const normalizedTheme =
        validateThemeData(
          themeData
        );

      await assertThemeUniqueness({
        numero:
          normalizedTheme.numero,

        normalizedTitle:
          normalizedTheme.normalizedTitle
      });

      const themeRef =
        await addDoc(
          collection(db, "temas"),
          {
            ...normalizedTheme,

            status: "active",
            isDeleted: false,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            deletedAt: null,
            restoredAt: null
          }
        );

      return {
        id: themeRef.id,
        ...normalizedTheme,
        status: "active",
        isDeleted: false
      };
    } catch (error) {
      console.error(
        "Error creating theme:",
        error
      );

      throw error;
    }
  };

export const updateTheme =
  async (
    themeId,
    themeData
  ) => {
    try {
      if (!themeId) {
        throw new Error(
          "Nieprawidłowy temat."
        );
      }

      const themeRef =
        doc(
          db,
          "temas",
          themeId
        );

      const themeSnapshot =
        await getDoc(themeRef);

      if (!themeSnapshot.exists()) {
        throw new Error(
          "Nie znaleziono tematu."
        );
      }

      const normalizedTheme =
        validateThemeData(
          themeData
        );

      await assertThemeUniqueness({
        numero:
          normalizedTheme.numero,

        normalizedTitle:
          normalizedTheme.normalizedTitle,

        excludedThemeId:
          themeId
      });

      await updateDoc(
        themeRef,
        {
          ...normalizedTheme,

          updatedAt:
            serverTimestamp()
        }
      );

      return {
        id: themeId,
        ...normalizedTheme
      };
    } catch (error) {
      console.error(
        "Error updating theme:",
        error
      );

      throw error;
    }
  };

/*
 * SOFT DELETE
 *
 * Esta función conserva el nombre deleteTheme para no romper
 * los componentes que ya la importan, pero ya no elimina
 * físicamente el documento ni sus subcolecciones.
 */
export const deleteTheme =
  async (themeId) => {
    try {
      if (!themeId) {
        throw new Error(
          "Nieprawidłowy temat."
        );
      }

      const themeRef =
        doc(
          db,
          "temas",
          themeId
        );

      const themeSnapshot =
        await getDoc(themeRef);

      if (!themeSnapshot.exists()) {
        throw new Error(
          "Nie znaleziono tematu."
        );
      }

      const themeData =
        themeSnapshot.data();

      if (
        isThemeArchived(
          themeData
        )
      ) {
        return {
          id: themeId,
          archived: true,
          alreadyArchived: true
        };
      }

      await updateDoc(
        themeRef,
        {
          status: "archived",
          isDeleted: true,

          deletedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

      return {
        id: themeId,
        archived: true,
        alreadyArchived: false
      };
    } catch (error) {
      console.error(
        "Error archiving theme:",
        error
      );

      throw error;
    }
  };

export const restoreTheme =
  async (themeId) => {
    try {
      if (!themeId) {
        throw new Error(
          "Nieprawidłowy temat."
        );
      }

      const themeRef =
        doc(
          db,
          "temas",
          themeId
        );

      const themeSnapshot =
        await getDoc(themeRef);

      if (!themeSnapshot.exists()) {
        throw new Error(
          "Nie znaleziono tematu."
        );
      }

      const currentTheme = {
        id:
          themeSnapshot.id,

        ...themeSnapshot.data()
      };

      const normalizedTheme =
        validateThemeData(
          currentTheme
        );

      await assertThemeUniqueness({
        numero:
          normalizedTheme.numero,

        normalizedTitle:
          normalizedTheme.normalizedTitle,

        excludedThemeId:
          themeId
      });

      await updateDoc(
        themeRef,
        {
          normalizedTitle:
            normalizedTheme.normalizedTitle,

          status: "active",
          isDeleted: false,

          deletedAt: null,

          restoredAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

      return {
        id: themeId,
        restored: true
      };
    } catch (error) {
      console.error(
        "Error restoring theme:",
        error
      );

      throw error;
    }
  };

/* TESTS */

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const RECENT_TEST_DAYS = Number.parseInt(
  import.meta.env.VITE_TEST_RETAKE_DAYS || "20",
  10
);

const MIN_PASSING_SCORE = Number.parseInt(
  import.meta.env.VITE_TEST_PASSING_SCORE || "70",
  10
);

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const VALID_TEST_RESULT_STATUSES = new Set([
  "estimated",
  "final",
  "manualReview"
]);

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

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const normalizeObject = (value) => {
  return isPlainObject(value) ? value : {};
};

const normalizeTestResultStatus = (
  status,
  requiresReview = false
) => {
  if (VALID_TEST_RESULT_STATUSES.has(status)) {
    return status;
  }

  return requiresReview ? "estimated" : "final";
};

const getTestReferenceDateMillis = (test = {}) => {
  return (
    getTimestampMillis(test.completedAt) ||
    getTimestampMillis(test.testDate) ||
    getTimestampMillis(test.updatedAt) ||
    getTimestampMillis(test.createdAt)
  );
};

const sortTestsByNewest = (tests = []) => {
  return [...tests].sort(
    (a, b) =>
      getTestReferenceDateMillis(b) -
      getTestReferenceDateMillis(a)
  );
};

const sanitizeLevelResults = (levelResults = {}) => {
  return Object.fromEntries(
    Object.entries(normalizeObject(levelResults))
      .filter(([level]) => CEFR_LEVELS.includes(level))
      .map(([level, score]) => [
        level,
        Math.max(0, Math.min(100, Number(score) || 0))
      ])
  );
};

const buildRetakeStatus = (latestTest = null) => {
  if (!latestTest) {
    return {
      blocked: false,
      canRetake: true,
      retakeDays: RECENT_TEST_DAYS,
      latestTest: null,
      lastTestAt: null,
      nextAttemptAt: null,
      remainingMilliseconds: 0,
      remainingDays: 0
    };
  }

  const lastTestMillis =
    getTestReferenceDateMillis(latestTest);

  if (!lastTestMillis) {
    return {
      blocked: false,
      canRetake: true,
      retakeDays: RECENT_TEST_DAYS,
      latestTest,
      lastTestAt: null,
      nextAttemptAt: null,
      remainingMilliseconds: 0,
      remainingDays: 0
    };
  }

  const nextAttemptMillis =
    lastTestMillis +
    RECENT_TEST_DAYS * MILLISECONDS_PER_DAY;

  const remainingMilliseconds = Math.max(
    nextAttemptMillis - Date.now(),
    0
  );

  return {
    blocked: remainingMilliseconds > 0,
    canRetake: remainingMilliseconds <= 0,
    retakeDays: RECENT_TEST_DAYS,
    latestTest,
    lastTestAt: new Date(lastTestMillis).toISOString(),
    nextAttemptAt: new Date(nextAttemptMillis).toISOString(),
    remainingMilliseconds,
    remainingDays: Math.ceil(
      remainingMilliseconds / MILLISECONDS_PER_DAY
    )
  };
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

export const saveUserTestResult = async (
  userId,
  testResults
) => {
  try {
    if (!userId || !isPlainObject(testResults)) {
      throw new Error("Invalid user or test results.");
    }

    const placementLevel = normalizeCefrLevel(
      testResults.placementLevel ||
        testResults.finalLevel
    );

    const finalLevel = normalizeCefrLevel(
      testResults.finalLevel ||
        placementLevel
    );

    const currentLevel = placementLevel;

    const unlockedLevels =
      getUnlockedLevels(placementLevel);

    const levelResults = sanitizeLevelResults(
      testResults.levelResults
    );

    const levelDetails = normalizeObject(
      testResults.levelDetails
    );

    const skillResults = normalizeObject(
      testResults.skillResults
    );

    const sectionWeights = normalizeObject(
      testResults.sectionWeights
    );

    const requiresReview =
      testResults.requiresReview === true;

    const resultStatus =
      normalizeTestResultStatus(
        testResults.resultStatus,
        requiresReview
      );

    const passingScore =
      Number(testResults.passingScore) ||
      MIN_PASSING_SCORE;

    const overallScore =
      Number.isFinite(
        Number(testResults.overallScore)
      )
        ? Math.max(
            0,
            Math.min(
              100,
              Number(testResults.overallScore)
            )
          )
        : calculateOverallScore(
            levelResults
          );

    const timeSpent = Math.max(
      Number(testResults.timeSpent) || 0,
      0
    );

    const timeLimit = Math.max(
      Number(testResults.timeLimit) || 0,
      0
    );

    const now = Timestamp.now();

    const resultsPayload = {
      placementLevel,
      finalLevel,
      overallScore,
      levelResults,
      levelDetails,
      skillResults,
      sectionWeights,
      passingScore,
      resultStatus,
      requiresReview,
      timeSpent,
      timeLimit,
      evaluatedAt:
        testResults.evaluatedAt ||
        new Date().toISOString()
    };

    const testData = {
      userId,
      testDate: now,
      completedAt: now,
      completed: true,

      resultStatus,
      requiresReview,

      results: resultsPayload,

      createdAt: now,
      updatedAt: now
    };

    const testRef =
      collection(db, "userTests");

    const result = await addDoc(
      testRef,
      testData
    );

    const userRef =
      doc(db, "users", userId);

    await setDoc(
      userRef,
      {
        placementLevel,
        currentLevel,
        unlockedLevels,
        lastTestDate: now,
        lastTestId: result.id,
        lastTestStatus: resultStatus,
        lastTestRequiresReview:
          requiresReview,
        updatedAt: serverTimestamp(),

        testHistory: arrayUnion({
          testId: result.id,
          date: now,
          placementLevel,
          finalLevel,
          level: placementLevel,
          score: overallScore,
          passed:
            overallScore >= passingScore,
          resultStatus,
          requiresReview
        })
      },
      { merge: true }
    );

    return {
      id: result.id,
      ...testData,
      results: resultsPayload
    };
  } catch (error) {
    console.error(
      "Error saving test results:",
      error
    );

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
          getTestReferenceDateMillis(b) -
          getTestReferenceDateMillis(a)
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

export const getLatestCompletedTest = async (
  userId
) => {
  try {
    if (!userId) return null;

    const testHistory =
      await getUserTestHistory(userId);

    return testHistory[0] || null;
  } catch (error) {
    console.error(
      "Error getting latest completed test:",
      error
    );

    throw error;
  }
};

export const getTestRetakeStatus = async (
  userId
) => {
  try {
    if (!userId) {
      return buildRetakeStatus(null);
    }

    const latestTest =
      await getLatestCompletedTest(userId);

    return buildRetakeStatus(
      latestTest
    );
  } catch (error) {
    console.error(
      "Error getting test retake status:",
      error
    );

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

export const hasRecentTest = async (
  userId
) => {
  try {
    const retakeStatus =
      await getTestRetakeStatus(userId);

    return retakeStatus.blocked;
  } catch (error) {
    console.error(
      "Error checking recent test:",
      error
    );

    throw error;
  }
};

export const updateUserTestEvaluation = async ({
  testId,
  level,
  writingEvaluation,
  levelScore = null,
  overallScore = null,
  resultStatus = null,
  requiresReview = null
}) => {
  try {
    if (!testId) {
      throw new Error("Invalid test.");
    }

    const normalizedLevel =
      normalizeCefrLevel(level);

    const testRef =
      doc(db, "userTests", testId);

    const testSnapshot =
      await getDoc(testRef);

    if (!testSnapshot.exists()) {
      throw new Error(
        "Test result not found."
      );
    }

    const currentData =
      testSnapshot.data();

    const currentResults =
      normalizeObject(
        currentData.results
      );

    const currentLevelResults =
      sanitizeLevelResults(
        currentResults.levelResults
      );

    const currentLevelDetails =
      normalizeObject(
        currentResults.levelDetails
      );

    const previousLevelDetail =
      normalizeObject(
        currentLevelDetails[
          normalizedLevel
        ]
      );

    const nextLevelResults = {
      ...currentLevelResults
    };

    if (
      levelScore !== null &&
      Number.isFinite(
        Number(levelScore)
      )
    ) {
      nextLevelResults[
        normalizedLevel
      ] = Math.max(
        0,
        Math.min(
          100,
          Number(levelScore)
        )
      );
    }

    const nextLevelDetails = {
      ...currentLevelDetails,

      [normalizedLevel]: {
        ...previousLevelDetail,
        writingEvaluation,
        updatedAt:
          new Date().toISOString()
      }
    };

    const nextRequiresReview =
      requiresReview !== null
        ? Boolean(requiresReview)
        : writingEvaluation
            ?.requiresReview === true;

    const nextResultStatus =
      normalizeTestResultStatus(
        resultStatus,
        nextRequiresReview
      );

    const calculatedOverallScore =
      overallScore !== null &&
      Number.isFinite(
        Number(overallScore)
      )
        ? Math.max(
            0,
            Math.min(
              100,
              Number(overallScore)
            )
          )
        : calculateOverallScore(
            nextLevelResults
          );

    await updateDoc(testRef, {
      resultStatus:
        nextResultStatus,

      requiresReview:
        nextRequiresReview,

      "results.levelResults":
        nextLevelResults,

      "results.levelDetails":
        nextLevelDetails,

      "results.overallScore":
        calculatedOverallScore,

      "results.resultStatus":
        nextResultStatus,

      "results.requiresReview":
        nextRequiresReview,

      "results.evaluatedAt":
        new Date().toISOString(),

      updatedAt:
        serverTimestamp()
    });

    return {
      testId,
      level:
        normalizedLevel,
      resultStatus:
        nextResultStatus,
      requiresReview:
        nextRequiresReview,
      overallScore:
        calculatedOverallScore
    };
  } catch (error) {
    console.error(
      "Error updating test evaluation:",
      error
    );

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
  restoreMission,
  duplicateMission,

  getAllThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  restoreTheme,

  logUserTest,
  saveUserTestResult,
  getIncompleteTest,
  updateTestProgress,
  getUserTestHistory,
  getLatestCompletedTest,
  getTestRetakeStatus,
  getUserStats,
  hasRecentTest,
  updateUserTestEvaluation,

  getPresentations,
  addPresentation,
  addComment,
  uploadAudio,

  tests: testService
};