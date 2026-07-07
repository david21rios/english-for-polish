// src/utils/lessonStructure.js

export const levelStructure = {
  A1: {
    title: "A1 Course",
    level: "A1",
    description: "Beginner English course for Polish learners.",
    content: "Core A1 content: greetings, basic verbs and simple sentences."
  },
  A2: {
    title: "A2 Course",
    level: "A2",
    description: "Elementary English course for everyday communication.",
    content: "Core A2 content for daily situations."
  },
  B1: {
    title: "B1 Course",
    level: "B1",
    description: "Intermediate English course focused on fluency and comprehension.",
    content: "Core B1 content."
  },
  B2: {
    title: "B2 Course",
    level: "B2",
    description: "Upper-intermediate English course.",
    content: "Core B2 content."
  },
  C1: {
    title: "C1 Course",
    level: "C1",
    description: "Advanced English course.",
    content: "Core C1 content."
  },
  C2: {
    title: "C2 Course",
    level: "C2",
    description: "Proficiency English course.",
    content: "Core C2 content."
  }
};

export const lessonTemplate = {
  id: "",
  lessonId: "",
  level: "",
  moduleId: "",
  moduleTitle: "",
  orderInModule: 1,
  ageGroup: "all",
  status: "draft",

  title: "",
  description: "",
  objectives: [],

  intro: {
    title: "",
    content: ""
  },

  vocabulary: {
    title: "",
    items: []
  },

  grammar: {
    title: "",
    explanation: "",
    rules: [],
    examples: []
  },

  reading: {
    title: "",
    author: "",
    text: "",
    questions: []
  },

  practice: {
    title: "",
    description: "",
    exercises: []
  },

  writing: {
    title: "",
    description: "",
    activities: []
  },

  speaking: {
    title: "",
    description: "",
    activities: []
  },

  evaluation: {
    title: "",
    selfAssessment: "",
    questions: []
  },

  resources: [],
  reflection: ""
};

export const createNewLesson = (id = "", title = "", description = "") => {
  const level = id.includes("_") ? id.split("_")[0] : "";

  return {
    ...structuredCloneSafe(lessonTemplate),
    id,
    lessonId: id,
    title,
    description,
    level,
    ageGroup: "all",
    status: "draft"
  };
};

export const createNewThemeLessonTemplate = (
  id = "",
  title = "",
  description = "",
  topic = ""
) => {
  return {
    ...structuredCloneSafe(lessonTemplate),
    id,
    lessonId: id,
    title,
    description,
    topic,
    level: "",
    ageGroup: "all",
    status: "draft"
  };
};

export const createDetailedLesson = (id = "", title = "", description = "") => {
  const level = id.includes("_") ? id.split("_")[0] : "";

  return {
    ...structuredCloneSafe(lessonTemplate),
    id,
    lessonId: id,
    title,
    description,
    level,
    ageGroup: "all",
    status: "draft"
  };
};

export const cleanLessonData = (data) => {
  const cleanObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    const cleaned = {};

    Object.keys(obj).forEach((key) => {
      const value = obj[key];

      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        const cleanedArray = value
          .map((item) => {
            if (item && typeof item === "object" && !Array.isArray(item)) {
              return cleanObject(item);
            }

            return item;
          })
          .filter((item) => item !== null && item !== undefined && item !== "");

        cleaned[key] = cleanedArray;
        return;
      }

      if (typeof value === "object") {
        cleaned[key] = cleanObject(value);
        return;
      }

      if (value !== "") {
        cleaned[key] = value;
      }
    });

    return cleaned;
  };

  return cleanObject(data);
};

export const validateLessonData = (data, mode = "level") => {
  const requiredFields =
    mode === "theme"
      ? ["id", "title", "topic"]
      : ["id", "title", "level", "ageGroup"];

  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  if (mode === "theme") return true;

  const allowedAgeGroups = ["kids_early", "kids", "teens", "adults", "all"];

  if (!allowedAgeGroups.includes(data.ageGroup)) {
    throw new Error(
      "Invalid ageGroup. Allowed values: kids_early, kids, teens, adults, all."
    );
  }

  if (!/^[A-C][1-2]_\d+$/.test(data.id)) {
    throw new Error("Invalid lesson ID format. Expected format: A1_1, B2_3.");
  }

  const levelFromId = data.id.split("_")[0];

  if (data.level !== levelFromId) {
    throw new Error("Level mismatch between ID and level field.");
  }

  return true;
};

export const generateLessonId = (level, number) => {
  return `${level}_${number}`;
};

export const generateThemeLessonId = (topicId, number) => {
  return `${topicId}_${number}`;
};

export const getNextLessonNumber = (existingLessons = [], level) => {
  const lessonNumbers = existingLessons
    .filter((lesson) => lesson.level === level || lesson.nivel === level)
    .map((lesson) => parseInt((lesson.id || "").split("_").pop(), 10))
    .filter((number) => !Number.isNaN(number));

  return lessonNumbers.length > 0 ? Math.max(...lessonNumbers) + 1 : 1;
};

export const getNextThemeLessonNumber = (existingLessons = []) => {
  const lessonNumbers = existingLessons
    .map((lesson) => parseInt((lesson.id || "").split("_").pop(), 10))
    .filter((number) => !Number.isNaN(number));

  return lessonNumbers.length > 0 ? Math.max(...lessonNumbers) + 1 : 1;
};

export const getLevelStructure = (levelId) => {
  return levelStructure[levelId] || null;
};

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

export default {
  levelStructure,
  lessonTemplate,
  createNewLesson,
  createNewThemeLessonTemplate,
  createDetailedLesson,
  cleanLessonData,
  validateLessonData,
  generateLessonId,
  generateThemeLessonId,
  getNextLessonNumber,
  getNextThemeLessonNumber,
  getLevelStructure
};