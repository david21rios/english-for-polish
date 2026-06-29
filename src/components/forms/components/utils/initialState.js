import { generateUniqueId } from './helpers';

export const getEmptyLessonStructure = () => ({
  id: '',
  ageGroup: "all",
  status: "draft", // 🔥 IMPORTANTE: ahora en nivel raíz

  titulo: '',
  descripcion: '',

  objetivos: [],

  contenidos: {
    vocabulario: {},
    gramatica: {
      temas: []
    }
  },

  actividades: [],

  lectura: {
    titulo: '',
    autor: '',
    contenido: '',
    preguntas: []
  },

  practica_interactiva: {
    titulo: '',
    descripcion: '',
    ejercicios: []
  },

  produccion_escrita: {
    titulo: '',
    descripcion: '',
    ejercicios: []
  },

  produccion_oral: {
    titulo: '',
    descripcion: '',
    ejercicios: []
  },

  ejercicios_interactivos: {
    titulo: '',
    descripcion: '',
    ejercicios: []
  },

  evaluacion: {
    autoevaluacion: '',
    cuestionario: [],
    criterios_evaluacion: []
  },

  recursos_adicionales: [],

  reflexion_final: '',

  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0',
    status: 'draft' // (opcional mantener para histórico)
  }
});

export const getEmptyExerciseStructure = (type) => {
  const baseStructure = {
    id: generateUniqueId('exercise-'),
    tipo: type,
    instrucciones: '',
    puntuacion: 0
  };

  switch (type) {

    case 'multiple_choice':
      return {
        ...baseStructure,
        pregunta: '',
        opciones: [],
        respuesta_correcta: ''
      };

    case 'fill_blank':
      return {
        ...baseStructure,
        texto: '',
        palabras: [],
        respuestas: {}
      };

    case 'matching':
      return {
        ...baseStructure,
        pares_izquierda: [],
        pares_derecha: [],
        respuestas_correctas: {}
      };

    case 'ordering':
      return {
        ...baseStructure,
        elementos: [],
        orden_correcto: []
      };

    default:
      return baseStructure;
  }
};