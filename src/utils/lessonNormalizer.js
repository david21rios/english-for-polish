// src/utils/lessonNormalizer.js

const DEFAULT_SCHEMA_VERSION = "1.0.0";

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
};

const normalizeString = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const normalizeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const mergeSource = (lesson = {}) => ({
  ...lesson,
  ...(lesson.lessonData || {}),

  contents: {
    ...(lesson.contents || {}),
    ...(lesson.lessonData?.contents || {})
  },

  evaluation: {
    ...(lesson.evaluation || {}),
    ...(lesson.lessonData?.evaluation || {})
  }
});

const normalizeVocabularyItem = (item = {}) => ({
  term: normalizeString(
    item.word ||
      item.palabra ||
      item.term ||
      item.termino
  ),
  variant: normalizeString(
    item.variant ||
      item.termino ||
      item.category ||
      item.categoria
  ),
  translation: normalizeString(item.translation || item.traduccion),
  definition: normalizeString(item.definition || item.definicion),
  example: normalizeString(item.example || item.ejemplo),
  audio: normalizeString(item.audio || item.audioSrc)
});

const normalizeQuestion = (question = {}) => ({
  type: normalizeString(question.type || question.tipo || "multiple_choice"),
  question: normalizeString(question.question || question.pregunta),
  options: normalizeArray(question.options || question.opciones),
  correctAnswer: normalizeString(
    question.correctAnswer ||
      question.correct_answer ||
      question.respuesta_correcta ||
      question.respuesta ||
      question.answer
  ),
  acceptedAnswers: normalizeArray(
    question.acceptedAnswers || question.respuestas_aceptadas
  ),
  feedback: normalizeString(question.feedback || question.retroalimentacion)
});

const normalizeExerciseType = (type = "") => {
  const normalized = String(type).toLowerCase().trim();

  const map = {
    seleccion_multiple: "multiple_choice",
    multiple_choice: "multiple_choice",
    completar: "fill_blank",
    fill_blank: "fill_blank",
    relacionar: "matching",
    matching: "matching",
    ordenar: "ordering",
    order: "ordering",
    ordering: "ordering"
  };

  return map[normalized] || "multiple_choice";
};

const normalizePracticeExercise = (exercise = {}) => {
  const type = normalizeExerciseType(exercise.type || exercise.tipo);

  if (type === "multiple_choice") {
    return {
      ...normalizeQuestion(exercise),
      type,
      instruction: normalizeString(
        exercise.instruction || exercise.instructions || exercise.instrucciones
      )
    };
  }

  if (type === "fill_blank") {
    return {
      type,
      instruction: normalizeString(
        exercise.instruction ||
          exercise.instructions ||
          exercise.instrucciones ||
          "Uzupełnij brakujące słowa."
      ),
      question: normalizeString(exercise.question || exercise.pregunta),
      text: normalizeString(exercise.text || exercise.texto),
      words: normalizeArray(exercise.words || exercise.palabras),
      correctAnswers:
        exercise.correctAnswers ||
        exercise.correct_answers ||
        exercise.respuestas_correctas ||
        exercise.respuestas ||
        {},
      acceptedAnswers:
        exercise.acceptedAnswers ||
        exercise.accepted_answers ||
        exercise.respuestas_aceptadas ||
        {}
    };
  }

  if (type === "matching") {
    return {
      type,
      instruction: normalizeString(
        exercise.instruction ||
          exercise.instructions ||
          exercise.instrucciones ||
          "Połącz elementy."
      ),
      leftItems: normalizeArray(
        exercise.leftItems ||
          exercise.leftPairs ||
          exercise.left_items ||
          exercise.pares_izquierda ||
          exercise.elementos_izquierda
      ),
      rightItems: normalizeArray(
        exercise.rightItems ||
          exercise.rightPairs ||
          exercise.right_items ||
          exercise.pares_derecha ||
          exercise.elementos_derecha
      ),
      correctPairs:
        exercise.correctPairs ||
        exercise.correctMatches ||
        exercise.correct_pairs ||
        exercise.pares_correctos ||
        exercise.respuestas_correctas ||
        {}
    };
  }

  if (type === "ordering") {
    const items = normalizeArray(exercise.items || exercise.elementos);

    const correctOrderValues = normalizeArray(
      exercise.correctOrderValues ||
        exercise.correct_order_values ||
        exercise.correctOrderText ||
        exercise.correct_order_text
    );

    const correctOrder = normalizeArray(
      exercise.correctOrder ||
        exercise.correct_order ||
        exercise.orden_correcto
    );

    return {
      type,
      instruction: normalizeString(
        exercise.instruction ||
          exercise.instructions ||
          exercise.instrucciones ||
          "Ułóż elementy w poprawnej kolejności."
      ),
      question: normalizeString(exercise.question || exercise.pregunta),
      items,
      correctOrder,
      correctOrderValues,
      correct_order_values: correctOrderValues
    };
  }

  return {
    ...exercise,
    type
  };
};

const normalizeWritingActivity = (activity = {}) => ({
  instruction: normalizeString(
    activity.instruction ||
      activity.instructions ||
      activity.instrucciones ||
      "Napisz odpowiedź po angielsku."
  ),
  prompt: normalizeString(activity.prompt || activity.consigna),
  guide: normalizeString(activity.guide || activity.guia),
  minimumWords: normalizeNumber(
    activity.minimumWords || activity.minWords || activity.extension_minima,
    1
  ),
  maximumWords: normalizeNumber(
    activity.maximumWords || activity.maxWords || activity.extension_maxima,
    0
  ),
  suggestedTimeMinutes: normalizeNumber(
    activity.suggestedTimeMinutes ||
      activity.suggestedMinutes ||
      activity.tiempo_sugerido,
    0
  ),
  criteria: normalizeArray(activity.criteria || activity.criterios)
});

const normalizeSpeakingActivity = (activity = {}) => ({
  instruction: normalizeString(
    activity.instruction ||
      activity.instructions ||
      activity.instrucciones ||
      "Nagraj odpowiedź po angielsku."
  ),
  prompt: normalizeString(activity.prompt || activity.consigna),
  guide: normalizeString(activity.guide || activity.guia),
  recommendedDuration: normalizeString(
    activity.recommendedDuration || activity.duracion_recomendada
  ),
  minimumSeconds: normalizeNumber(activity.minimumSeconds, 5),
  suggestedTimeMinutes: normalizeNumber(
    activity.suggestedTimeMinutes ||
      activity.suggestedMinutes ||
      activity.tiempo_sugerido,
    0
  ),
  criteria: normalizeArray(activity.criteria || activity.criterios)
});

export const normalizeLesson = (lesson = {}) => {
  const metadata = lesson.metadata || lesson.aiMetadata || {};
  const source = mergeSource(lesson);

  const vocabularySource =
    source.contents?.vocabulary ||
    source.content?.vocabulary ||
    source.vocabulary ||
    source.contenidos?.vocabulario ||
    source.content?.vocabulario ||
    {};

  const grammarSource =
    source.contents?.grammar ||
    source.content?.grammar ||
    source.grammar ||
    source.contenidos?.gramatica ||
    source.content?.gramatica ||
    {};

  const practiceSource =
    source.interactivePractice ||
    source.practice ||
    source.practica_interactiva ||
    {};

  const writingSource =
    source.writingProduction ||
    source.writing ||
    source.produccion_escrita ||
    {};

  const speakingSource =
    source.oralProduction ||
    source.speaking ||
    source.produccion_oral ||
    {};

  const evaluationSource = {
    ...(source.evaluacion || {}),
    ...(source.evaluation || {}),
    ...(source.lessonData?.evaluation || {})
  };

  return {
    schemaVersion:
      lesson.schemaVersion || metadata.schemaVersion || DEFAULT_SCHEMA_VERSION,

    metadata: {
      product: metadata.product || "Polish-learning",
      lessonId: source.lessonId || source.id || metadata.lessonId || "",
      lessonNumber: normalizeNumber(metadata.lessonNumber, 1),
      levelId: source.level || source.nivel || metadata.levelId || "A1",
      moduleId: source.moduleId || metadata.moduleId || "",
      moduleTitle: source.moduleTitle || metadata.moduleTitle || "",
      orderInModule: normalizeNumber(
        source.orderInModule || metadata.orderInModule,
        1
      ),
      targetLanguage: metadata.targetLanguage || "English",
      supportLanguage: metadata.supportLanguage || "Polish",
      baseLanguage: metadata.baseLanguage || "Polish",
      ageGroup: source.ageGroup || metadata.ageGroup || "all",
      status: source.status || metadata.status || "draft",
      generatedByAI: Boolean(source.generatedByAI || metadata.generatedByAI),
      approvedByTeacher: Boolean(
        source.approvedByTeacher || metadata.approvedByTeacher
      ),
      createdAt: source.createdAt || metadata.createdAt || null,
      updatedAt: source.updatedAt || metadata.updatedAt || null
    },

    lessonData: {
      id: source.id || source.lessonId || metadata.lessonId || "",
      lessonId: source.lessonId || source.id || metadata.lessonId || "",
      title: normalizeString(source.title || source.titulo),
      description: normalizeString(source.description || source.descripcion),
      level: source.level || source.nivel || metadata.levelId || "A1",
      moduleId: source.moduleId || metadata.moduleId || "",
      moduleTitle: source.moduleTitle || metadata.moduleTitle || "",
      orderInModule: normalizeNumber(
        source.orderInModule || metadata.orderInModule,
        1
      ),
      status: source.status || metadata.status || "draft",
      ageGroup: source.ageGroup || metadata.ageGroup || "all",

      objectives: normalizeArray(source.objectives || source.objetivos),

      intro: {
        title: normalizeString(source.intro?.title || "Introduction"),
        content: normalizeString(source.intro?.content || source.descripcion)
      },

      vocabulary: {
        title: normalizeString(vocabularySource.title || vocabularySource.titulo || "Vocabulary"),
        items: normalizeArray(
          vocabularySource.items ||
            vocabularySource.words ||
            vocabularySource.palabras
        ).map(normalizeVocabularyItem)
      },

      grammar: {
        title: normalizeString(
          grammarSource.title ||
            grammarSource.titulo ||
            "Grammar"
        ),
      
        explanation: normalizeString(
          grammarSource.explanation ||
            grammarSource.explicacion
        ),
      
        topics: normalizeArray(
          grammarSource.topics ||
            grammarSource.temas
        ),
      
        rules: normalizeArray(
          grammarSource.rules ||
            grammarSource.reglas
        ).map((rule = {}) => ({
          // Canonical fields
          title: normalizeString(rule.title || rule.titulo),
          explanation: normalizeString(
            rule.explanation || rule.explicacion
          ),
          examples: normalizeArray(
            rule.examples || rule.ejemplos
          ).map((example = {}) => ({
            sentence: normalizeString(example.sentence || example.frase),
            translation: normalizeString(
              example.translation || example.traduccion
            ),
            note: normalizeString(example.note || example.nota)
          })),
        
          // Legacy compatibility for LessonSectionRenderer
          titulo: normalizeString(rule.titulo || rule.title),
          explicacion: normalizeString(
            rule.explicacion || rule.explanation
          ),
          ejemplos: normalizeArray(
            rule.ejemplos || rule.examples
          ).map((example = {}) => ({
            frase: normalizeString(example.frase || example.sentence),
            traduccion: normalizeString(
              example.traduccion || example.translation
            ),
            nota: normalizeString(example.nota || example.note)
          }))
        })),
      
        examples: normalizeArray(
          grammarSource.examples ||
            grammarSource.ejemplos
        )
      },

      reading: {
        title: normalizeString(source.reading?.title || source.lectura?.titulo),
        author: normalizeString(source.reading?.author || source.lectura?.autor),
        text: normalizeString(
          source.reading?.text ||
            source.reading?.content ||
            source.lectura?.contenido
        ),
        questions: normalizeArray(
          source.reading?.questions || source.lectura?.preguntas
        ).map(normalizeQuestion)
      },

      practice: {
        title: normalizeString(
          practiceSource.title || practiceSource.titulo
        ),
        description: normalizeString(
          practiceSource.description || practiceSource.descripcion
        ),
        exercises: normalizeArray(
          practiceSource.exercises || practiceSource.ejercicios
        ).map(normalizePracticeExercise)
      },

      writing: {
        title: normalizeString(
          writingSource.title || writingSource.titulo
        ),
        description: normalizeString(
          writingSource.description || writingSource.descripcion
        ),
        activities: normalizeArray(
          writingSource.activities ||
            writingSource.exercises ||
            writingSource.ejercicios
        ).map(normalizeWritingActivity)
      },

      speaking: {
        title: normalizeString(
          speakingSource.title || speakingSource.titulo
        ),
        description: normalizeString(
          speakingSource.description || speakingSource.descripcion
        ),
        activities: normalizeArray(
          speakingSource.activities ||
            speakingSource.exercises ||
            speakingSource.ejercicios
        ).map(normalizeSpeakingActivity)
      },

      evaluation: {
        title: normalizeString(evaluationSource.title || "Evaluation"),
        selfAssessment: normalizeString(
          evaluationSource.selfAssessment ||
            evaluationSource.autoevaluacion
        ),
        questions: normalizeArray(
          evaluationSource.cuestionario ||
            evaluationSource.questions ||
            evaluationSource.quiz
        ).map(normalizeQuestion)
      },

      resources: normalizeArray(
        source.additionalResources ||
          source.resources ||
          source.recursos_adicionales
      ),

      reflection: normalizeString(
        source.finalReflection ||
          source.reflection ||
          source.reflexion_final
      )
    },

    auditReport: lesson.auditReport || {
      cefrAlignment: "pending",
      languageAccuracy: "pending",
      culturalLocalization: "pending",
      jsonValidation: "pending",
      warnings: [],
      errors: []
    }
  };
};

export const getCanonicalLessonData = (lesson = {}) => {
  return normalizeLesson(lesson).lessonData;
};

export default {
  normalizeLesson,
  getCanonicalLessonData
};