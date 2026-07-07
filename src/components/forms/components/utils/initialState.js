// src/components/forms/components/utils/initialState.js

import { generateUniqueId } from "./helpers";

export const getEmptyLessonStructure = () => {
  const now = new Date().toISOString();

  return {
    id: "",
    lessonId: "",
    level: "A1",
    nivel: "A1",
    moduleId: "",
    orderInModule: 1,

    ageGroup: "all",
    status: "draft",

    titulo: "",
    descripcion: "",

    objetivos: [],

    contenidos: {
      vocabulario: {
        titulo: "",
        palabras: []
      },
      gramatica: {
        temas: [],
        reglas: []
      }
    },

    actividades: [],

    lectura: {
      titulo: "",
      autor: "",
      contenido: "",
      preguntas: []
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

    ejercicios_interactivos: {
      titulo: "",
      descripcion: "",
      ejercicios: []
    },

    evaluacion: {
      autoevaluacion: "",
      cuestionario: [],
      criterios_evaluacion: []
    },

    recursos_adicionales: [],

    reflexion_final: "",

    metadata: {
      createdAt: now,
      updatedAt: now,
      version: "1.0",
      status: "draft"
    }
  };
};

export const getEmptyExerciseStructure = (type) => {
  const baseStructure = {
    id: generateUniqueId("exercise-"),
    tipo: type,
    instrucciones: "",
    puntuacion: 0
  };

  switch (type) {
    case "multiple_choice":
      return {
        ...baseStructure,
        pregunta: "",
        opciones: [],
        respuesta_correcta: ""
      };

    case "fill_blank":
      return {
        ...baseStructure,
        texto: "",
        palabras: [],
        respuestas: {}
      };

    case "matching":
      return {
        ...baseStructure,
        pares_izquierda: [],
        pares_derecha: [],
        respuestas_correctas: {}
      };

    case "ordering":
      return {
        ...baseStructure,
        elementos: [],
        orden_correcto: []
      };

    default:
      return baseStructure;
  }
};