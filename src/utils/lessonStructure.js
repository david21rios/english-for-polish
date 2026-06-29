// src/utils/lessonStructure.js

export const levelStructure = {
  A1: {
    title: "Curso A1",
    level: "A1",
    description:
      "Curso para principiantes. Aprende saludos, verbos básicos y frases comunes.",
    content: "Contenido completo del curso A1. Aquí incluirás texto, ejemplos y más."
  },
  A2: {
    title: "Curso A2",
    level: "A2",
    description:
      "Curso para estudiantes de nivel A2. Frases más complejas y situaciones cotidianas.",
    content: "Contenido del curso A2..."
  },
  B1: {
    title: "Curso B1",
    level: "B1",
    description: "Curso intermedio. Mejora tu comprensión y fluidez.",
    content: "Contenido del curso B1..."
  },
  B2: {
    title: "Curso B2",
    level: "B2",
    description:
      "Curso intermedio-alto. Profundiza en gramática y conversación.",
    content: "Contenido del curso B2..."
  },
  C1: {
    title: "Curso C1",
    level: "C1",
    description:
      "Curso avanzado. Expresiones idiomáticas, textos complejos y más.",
    content: "Contenido del curso C1..."
  },
  C2: {
    title: "Curso C2",
    level: "C2",
    description:
      "Curso experto. Habla como un nativo con precisión y profundidad.",
    content: "Contenido del curso C2..."
  }
};

export const lessonTemplate = {
  id: "",
  lessonId: "",
  nivel: "",
  level: "",
  tema: "",
  ageGroup: "all",
  status: "published",
  titulo: "",
  descripcion: "",
  objetivos: [],
  contenidos: {
    vocabulario: {},
    gramatica: {
      temas: []
    }
  },
  actividades: [],
  lectura: {
    titulo: "",
    autor: "",
    contenido: ""
  },
  practica_interactiva: {
    titulo: "",
    descripcion: "",
    ejercicios: []
  },
  produccion_escrita: {
    titulo: "",
    descripcion: "",
    ejercicios: []
  },
  produccion_oral: {
    titulo: "",
    descripcion: "",
    ejercicios: []
  },
  evaluacion: {
    autoevaluacion: "",
    cuestionario: []
  },
  recursos_adicionales: [],
  reflexion_final: ""
};

export const createNewLesson = (id = "", titulo = "", descripcion = "") => {
  const nivel = id.includes("_") ? id.split("_")[0] : "";

  return {
    ...structuredCloneSafe(lessonTemplate),
    id,
    lessonId: id,
    titulo,
    descripcion,
    nivel,
    level: nivel,
    ageGroup: "all",
    status: "published"
  };
};

export const createNewThemeLessonTemplate = (
  id = "",
  titulo = "",
  descripcion = "",
  tema = ""
) => {
  const detectedTema = tema || "";

  return {
    ...structuredCloneSafe(lessonTemplate),
    id,
    lessonId: id,
    titulo,
    descripcion,
    tema: detectedTema,
    nivel: "",
    level: "",
    ageGroup: "all",
    status: "published"
  };
};

export const createDetailedLesson = (id = "", titulo = "", descripcion = "") => {
  const nivel = id.includes("_") ? id.split("_")[0] : "";

  return {
    ...structuredCloneSafe(lessonTemplate),
    id,
    lessonId: id,
    titulo,
    descripcion,
    nivel,
    level: nivel,
    ageGroup: "all",
    status: "published"
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
      ? ["id", "titulo", "tema"]
      : ["id", "titulo", "nivel", "ageGroup"];

  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  if (mode === "theme") {
    return true;
  }

  const allowedAgeGroups = ["kids_early", "kids", "teens", "adults", "all"];

  if (!allowedAgeGroups.includes(data.ageGroup)) {
    throw new Error(
      "Invalid ageGroup. Debe ser kids_early, kids, teens, adults, o all."
    );
  }

  if (!/^[A-C][1-2]_\d+$/.test(data.id)) {
    throw new Error("Invalid lesson ID format. Should be like: A1_1, B2_3, etc.");
  }

  const nivelFromId = data.id.split("_")[0];

  if (data.nivel !== nivelFromId) {
    throw new Error("Level mismatch between ID and nivel field");
  }

  return true;
};

export const generateLessonId = (nivel, numero) => {
  return `${nivel}_${numero}`;
};

export const generateThemeLessonId = (temaId, numero) => {
  return `${temaId}_${numero}`;
};

export const getNextLessonNumber = (existingLessons = [], nivel) => {
  const lessonNumbers = existingLessons
    .filter((lesson) => lesson.nivel === nivel || lesson.level === nivel)
    .map((lesson) => parseInt((lesson.id || "").split("_").pop()))
    .filter((num) => !Number.isNaN(num));

  return lessonNumbers.length > 0 ? Math.max(...lessonNumbers) + 1 : 1;
};

export const getNextThemeLessonNumber = (existingLessons = []) => {
  const lessonNumbers = existingLessons
    .map((lesson) => parseInt((lesson.id || "").split("_").pop()))
    .filter((num) => !Number.isNaN(num));

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