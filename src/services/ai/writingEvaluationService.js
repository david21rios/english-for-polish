// src/services/ai/writingEvaluationService.js

import { sendAIMessage } from "./aiService";

const DEFAULT_CEFR_LEVEL = "A1";

const VALID_CEFR_LEVELS = new Set([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
]);

const CRITERIA_KEYS = [
  "taskAchievement",
  "grammar",
  "vocabulary",
  "coherence",
  "register",
  "mechanics",
  "cefrAppropriateness"
];

const DEFAULT_RUBRIC = {
  taskAchievement: 25,
  grammar: 20,
  vocabulary: 15,
  coherence: 15,
  register: 10,
  mechanics: 5,
  cefrAppropriateness: 10
};

const clampScore = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(numericValue))
  );
};

const normalizeText = (value = "") => {
  return String(value)
    .replace(/\r\n/g, "\n")
    .trim();
};

const normalizeLevel = (level = DEFAULT_CEFR_LEVEL) => {
  const normalizedLevel = String(level)
    .trim()
    .toUpperCase();

  return VALID_CEFR_LEVELS.has(normalizedLevel)
    ? normalizedLevel
    : DEFAULT_CEFR_LEVEL;
};

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const countWords = (text = "") => {
  return normalizeText(text)
    .split(/\s+/)
    .filter(Boolean)
    .length;
};

const normalizeStringArray = (
  value,
  maximumItems = 6
) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, maximumItems);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maximumItems);
  }

  return [];
};

const normalizeCriteriaList = (question = {}) => {
  return normalizeStringArray(
    question.criteria ||
      question.assessmentCriteria ||
      question.assessment_criteria ||
      question.kryteria,
    12
  );
};

const normalizeKeywordCategories = (question = {}) => {
  const rawCategories =
    question.keywordCategories ||
    question.keyword_categories ||
    question.categories ||
    question.keywordGroups ||
    [];

  if (!Array.isArray(rawCategories)) {
    return [];
  }

  return rawCategories
    .map((category, index) => {
      if (typeof category === "string") {
        return {
          name: `Category ${index + 1}`,
          keywords: normalizeStringArray(category, 30)
        };
      }

      if (!isPlainObject(category)) {
        return null;
      }

      const name =
        category.name ||
        category.category ||
        category.label ||
        category.title ||
        category.categoryName ||
        `Category ${index + 1}`;

      const keywords = normalizeStringArray(
        category.keywords ||
          category.words ||
          category.values ||
          category.items ||
          category.examples,
        30
      );

      return {
        name: String(name).trim(),
        keywords
      };
    })
    .filter(
      (category) =>
        category &&
        category.name &&
        category.keywords.length > 0
    );
};

const getQuestionPrompt = (question = {}) => {
  return normalizeText(
    question.question ||
      question.prompt ||
      question.task ||
      question.instructions ||
      question.trescZadania ||
      question.treśćZadania ||
      ""
  );
};

const getExpectedAnswer = (question = {}) => {
  return normalizeText(
    question.example ||
      question.expectedAnswer ||
      question.expected_answer ||
      question.sampleAnswer ||
      question.modelAnswer ||
      question.przykladOczekiwanejOdpowiedzi ||
      question.przykładOczekiwanejOdpowiedzi ||
      ""
  );
};

const getMinimumWords = (question = {}) => {
  const value = Number(
    question.minWords ??
      question.minimumWords ??
      question.min_words ??
      question.minimalnaLiczbaSlow
  );

  return Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
};

const getMaximumWords = (question = {}) => {
  const value = Number(
    question.maxWords ??
      question.maximumWords ??
      question.max_words ??
      question.maksymalnaLiczbaSlow
  );

  return Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
};

const normalizeRubric = (rubric = {}) => {
  const source = isPlainObject(rubric)
    ? rubric
    : {};

  const mergedRubric = {
    ...DEFAULT_RUBRIC,
    ...source
  };

  const safeRubric = Object.fromEntries(
    CRITERIA_KEYS.map((key) => [
      key,
      Math.max(
        Number(mergedRubric[key]) || 0,
        0
      )
    ])
  );

  const totalWeight = Object.values(
    safeRubric
  ).reduce(
    (total, weight) => total + weight,
    0
  );

  if (totalWeight <= 0) {
    return { ...DEFAULT_RUBRIC };
  }

  return Object.fromEntries(
    Object.entries(safeRubric).map(
      ([key, weight]) => [
        key,
        Number(
          (
            (weight / totalWeight) *
            100
          ).toFixed(2)
        )
      ]
    )
  );
};

const extractJson = (responseText = "") => {
  const cleanedResponse = String(responseText)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace =
    cleanedResponse.indexOf("{");

  const lastBrace =
    cleanedResponse.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    throw new Error(
      "No valid JSON object was found in the Gemini response."
    );
  }

  const jsonText = cleanedResponse
    .slice(firstBrace, lastBrace + 1)
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");

  return JSON.parse(jsonText);
};

const normalizeCriterion = (
  criterion = {},
  fallbackWeight = 0
) => {
  const source = isPlainObject(criterion)
    ? criterion
    : {};

  return {
    score: clampScore(source.score),

    weight:
      Number(source.weight) ||
      fallbackWeight,

    commentPolish: normalizeText(
      source.commentPolish ||
      source.comment ||
      ""
    )
  };
};

const calculateWeightedScore = (
  criteria = {}
) => {
  const totalWeight = CRITERIA_KEYS.reduce(
    (total, key) => {
      return (
        total +
        Math.max(
          Number(criteria[key]?.weight) || 0,
          0
        )
      );
    },
    0
  );

  if (totalWeight <= 0) {
    return 0;
  }

  const weightedScore = CRITERIA_KEYS.reduce(
    (total, key) => {
      const criterion = criteria[key];

      const score = clampScore(
        criterion?.score
      );

      const weight = Math.max(
        Number(criterion?.weight) || 0,
        0
      );

      return total + score * weight;
    },
    0
  );

  return clampScore(
    weightedScore / totalWeight
  );
};

const normalizeGeminiEvaluation = ({
  evaluation = {},
  level,
  rubric
}) => {
  if (!isPlainObject(evaluation)) {
    throw new Error(
      "Gemini returned an invalid evaluation object."
    );
  }

  const normalizedRubric =
    normalizeRubric(rubric);

  const criteria =
    isPlainObject(evaluation.criteria)
      ? evaluation.criteria
      : {};

  const normalizedCriteria = {
    taskAchievement: normalizeCriterion(
      criteria.taskAchievement,
      normalizedRubric.taskAchievement
    ),

    grammar: normalizeCriterion(
      criteria.grammar,
      normalizedRubric.grammar
    ),

    vocabulary: normalizeCriterion(
      criteria.vocabulary,
      normalizedRubric.vocabulary
    ),

    coherence: normalizeCriterion(
      criteria.coherence,
      normalizedRubric.coherence
    ),

    register: normalizeCriterion(
      criteria.register ||
        criteria.communicativeAchievement,
      normalizedRubric.register
    ),

    mechanics: normalizeCriterion(
      criteria.mechanics ||
        criteria.spellingAndPunctuation,
      normalizedRubric.mechanics
    ),

    cefrAppropriateness: normalizeCriterion(
      criteria.cefrAppropriateness ||
        criteria.cefrMatch,
      normalizedRubric.cefrAppropriateness
    )
  };

  /*
   * La puntuación oficial se calcula en la aplicación
   * usando exclusivamente los criterios y pesos definidos.
   *
   * El totalScore enviado por Gemini se conserva únicamente
   * como dato diagnóstico, pero no controla la nota final.
   */
  const weightedScore =
    calculateWeightedScore(
      normalizedCriteria
    );

  const reportedTotalScoreValue =
    Number(
      evaluation.totalScore ??
      evaluation.score ??
      evaluation.overallScore
    );

  const reportedTotalScore =
    Number.isFinite(
      reportedTotalScoreValue
    )
      ? clampScore(
          reportedTotalScoreValue
        )
      : null;

  /*
   * Cuando Gemini devuelve una evaluación válida,
   * su totalScore es la calificación oficial porque ya incorpora:
   *
   * - cumplimiento real de la consigna;
   * - respuestas fuera de tema;
   * - mezcla de idiomas;
   * - repetición;
   * - tipo de texto;
   * - competencia comunicativa;
   * - adecuación CEFR.
   *
   * El promedio ponderado local queda solamente como respaldo.
   */
  const totalScore =
    reportedTotalScore !== null
      ? reportedTotalScore
      : clampScore(weightedScore);

  const normalizedDetectedLevel =
    String(
      evaluation.detectedCefrLevel ||
      evaluation.detectedLevel ||
      ""
    )
      .trim()
      .toUpperCase();

  const detectedCefrLevel =
    VALID_CEFR_LEVELS.has(
      normalizedDetectedLevel
    )
      ? normalizedDetectedLevel
      : level;

  const normalizedAssessedLevel =
    String(
      evaluation.cefrLevelAssessed ||
      ""
    )
      .trim()
      .toUpperCase();

  const cefrLevelAssessed =
    VALID_CEFR_LEVELS.has(
      normalizedAssessedLevel
    )
      ? normalizedAssessedLevel
      : level;

  const offTopic =
    evaluation.offTopic === true ||
    evaluation.isOffTopic === true;

  const containsNonEnglish =
    evaluation.containsNonEnglish === true ||
    evaluation.nonEnglishContent === true;

  const copiedOrRepeated =
    evaluation.copiedOrRepeated === true ||
    evaluation.excessiveRepetition === true ||
    evaluation.repeatedContent === true;

  const inappropriateLanguage =
    evaluation.inappropriateLanguage === true ||
    evaluation.containsProfanity === true;

  const meaninglessContent =
    evaluation.meaninglessContent === true ||
    evaluation.gibberish === true ||
    evaluation.fillerContent === true;

  /*
   * Una tarea no puede considerarse completada cuando
   * Gemini determinó que está fuera de tema o que su
   * contenido es esencialmente irrelevante o de relleno.
   */
  const taskCompleted =
    evaluation.taskCompleted === true &&
    !offTopic &&
    !meaninglessContent;

  const confidence =
    clampScore(
      evaluation.confidence
    );

  /*
   * IMPORTANTE:
   *
   * Una respuesta mala, fuera de tema, repetida,
   * parcialmente escrita en otro idioma o con nota baja
   * sigue siendo evaluable de manera definitiva.
   *
   * Solo se solicita revisión manual cuando Gemini la pide
   * expresamente por incertidumbre real o cuando su nivel
   * de confianza es inferior al mínimo aceptado.
   */
  const requiresManualReview =
    evaluation.requiresManualReview === true ||
    confidence < 60;

  const scoreDifference =
    reportedTotalScore === null
      ? null
      : Math.abs(
          totalScore -
          reportedTotalScore
        );

  return {
    status: "evaluated",
    provider: "gemini",

    score: totalScore,
    totalScore,

    /*
     * Información diagnóstica:
     * permite comparar el total declarado por Gemini
     * con el cálculo oficial realizado por la aplicación.
     */
    reportedTotalScore,
    scoreDifference,

    criteria:
      normalizedCriteria,

    strengthsPolish:
      normalizeStringArray(
        evaluation.strengthsPolish ||
        evaluation.strengths,
        4
      ),

    improvementsPolish:
      normalizeStringArray(
        evaluation.improvementsPolish ||
        evaluation.improvements ||
        evaluation.areasForImprovement,
        4
      ),

    feedbackPolish:
      normalizeText(
        evaluation.feedbackPolish ||
        evaluation.feedback ||
        "Ocena została zakończona, ale nie wygenerowano szczegółowej informacji zwrotnej."
      ),

    cefrLevelAssessed,
    detectedCefrLevel,

    taskCompleted,
    offTopic,
    containsNonEnglish,
    copiedOrRepeated,
    inappropriateLanguage,
    meaninglessContent,

    detectedLanguages:
      normalizeStringArray(
        evaluation.detectedLanguages,
        5
      ),

    requiresManualReview,

    confidence,

    /*
     * Una evaluación es definitiva siempre que Gemini
     * haya podido asignar una calificación confiable.
     * Obtener una nota muy baja no la vuelve provisional.
     */
    isFinal:
      !requiresManualReview,

    evaluatedAt:
      new Date().toISOString()
  };
};

const buildUnavailableEvaluation = ({
  error,
  localEvaluation = null,
  level
}) => {
  const estimatedScore =
    typeof localEvaluation?.score ===
    "number"
      ? clampScore(
          localEvaluation.score
        )
      : 0;

  return {
    status: "estimated",
    provider: "local",

    score: estimatedScore,
    totalScore: estimatedScore,

    criteria: null,

    strengthsPolish: [],
    improvementsPolish: [],

    feedbackPolish:
      "Wynik części pisemnej jest obecnie szacowany. Odpowiedź została zapisana i zostanie dokładnie oceniona automatycznie lub przez nauczyciela.",

    cefrLevelAssessed: level,
    detectedCefrLevel: null,

    taskCompleted: null,
    offTopic: null,
    containsNonEnglish: null,
    copiedOrRepeated: null,
    inappropriateLanguage: null,
    meaninglessContent: null,

    detectedLanguages: [],

    requiresManualReview: true,
    confidence: 0,
    isFinal: false,

    error: {
      code:
        error?.code ||
        "GEMINI_UNAVAILABLE",

      message:
        error instanceof Error
          ? error.message
          : String(error)
    },

    evaluatedAt:
      new Date().toISOString()
  };
};

const buildInvalidEvaluation = ({
  level,
  message
}) => {
  return {
    status: "invalid",
    provider: "local",

    score: 0,
    totalScore: 0,

    criteria: {
      taskAchievement: {
        score: 0,
        weight:
          DEFAULT_RUBRIC.taskAchievement,
        commentPolish:
          "Nie udzielono odpowiedzi na zadanie."
      },

      grammar: {
        score: 0,
        weight:
          DEFAULT_RUBRIC.grammar,
        commentPolish:
          "Brak tekstu do oceny."
      },

      vocabulary: {
        score: 0,
        weight:
          DEFAULT_RUBRIC.vocabulary,
        commentPolish:
          "Brak tekstu do oceny."
      },

      coherence: {
        score: 0,
        weight:
          DEFAULT_RUBRIC.coherence,
        commentPolish:
          "Brak tekstu do oceny."
      },

      register: {
        score: 0,
        weight:
          DEFAULT_RUBRIC.register,
        commentPolish:
          "Brak tekstu do oceny."
      },

      mechanics: {
        score: 0,
        weight:
          DEFAULT_RUBRIC.mechanics,
        commentPolish:
          "Brak tekstu do oceny."
      },

      cefrAppropriateness: {
        score: 0,
        weight:
          DEFAULT_RUBRIC.cefrAppropriateness,
        commentPolish:
          "Nie można określić poziomu CEFR."
      }
    },

    strengthsPolish: [],

    improvementsPolish: [
      "Należy udzielić pełnej odpowiedzi po angielsku."
    ],

    feedbackPolish:
      message ||
      "Nie podano odpowiedzi do oceny.",

    cefrLevelAssessed: level,
    detectedCefrLevel: null,

    taskCompleted: false,
    offTopic: true,
    containsNonEnglish: false,
    copiedOrRepeated: false,
    inappropriateLanguage: false,
    meaninglessContent: false,

    detectedLanguages: [],

    requiresManualReview: true,
    confidence: 100,
    isFinal: true,

    evaluatedAt:
      new Date().toISOString()
  };
};

const buildWritingTaskContext = ({
  question,
  answer,
  level,
  localEvaluation,
  rubric
}) => {
  const taskPrompt =
    getQuestionPrompt(question);

  const expectedAnswer =
    getExpectedAnswer(question);

  const criteria =
    normalizeCriteriaList(question);

  const keywordCategories =
    normalizeKeywordCategories(question);

  const minWords =
    getMinimumWords(question);

  const maxWords =
    getMaximumWords(question);

  const normalizedRubric =
    normalizeRubric(rubric);

  const wordCount =
    countWords(answer);

  return {
    level,
    taskPrompt,
    expectedAnswer,
    criteria,
    keywordCategories,
    minWords,
    maxWords,
    wordCount,
    localEvaluation,
    rubric: normalizedRubric
  };
};

const buildEvaluationUserMessage = ({
  answer,
  taskContext
}) => {
  return `
Evaluate the following learner response as part of a CEFR English placement test.

EXPECTED CEFR LEVEL:
${taskContext.level}

WRITING TASK:
${taskContext.taskPrompt || "No task description was provided."}

SAMPLE ANSWER FOR EXAMINER REFERENCE ONLY:
${taskContext.expectedAnswer || "No sample answer was provided."}

IMPORTANT:
The sample answer is only a reference.
The learner does not need to reproduce the same wording or ideas.

MINIMUM NUMBER OF WORDS:
${taskContext.minWords || "Not specified"}

MAXIMUM NUMBER OF WORDS:
${taskContext.maxWords || "Not specified"}

ACTUAL NUMBER OF WORDS:
${taskContext.wordCount}

ASSESSMENT CRITERIA:
${
  taskContext.criteria.length > 0
    ? taskContext.criteria.join(", ")
    : "Task achievement, grammar, vocabulary, coherence, register, mechanics and CEFR appropriateness."
}

EXPECTED KEYWORD CATEGORIES:
${
  taskContext.keywordCategories.length > 0
    ? JSON.stringify(
        taskContext.keywordCategories,
        null,
        2
      )
    : "No keyword categories were provided."
}

LOCAL TECHNICAL EVALUATION:
${
  taskContext.localEvaluation
    ? JSON.stringify(
        taskContext.localEvaluation,
        null,
        2
      )
    : "No local evaluation is available."
}

SCORING RUBRIC:
${JSON.stringify(
  taskContext.rubric,
  null,
  2
)}

LEARNER RESPONSE:
${answer}

Evaluate meaning, relevance and task completion.

Do not reward the learner merely for writing grammatically acceptable English.

Strongly penalise:

- answers unrelated to the task;
- missing required points;
- excessive repetition or copied text;
- meaningless filler used only to reach the word count;
- substantial content written in a language other than English;
- inappropriate or offensive register;
- failure to use the required text type;
- failure to use an appropriate CEFR level.

Return only one valid JSON object using exactly this structure:

{
  "totalScore": 0,
  "cefrLevelAssessed": "${taskContext.level}",
  "detectedCefrLevel": "${taskContext.level}",
  "criteria": {
    "taskAchievement": {
      "score": 0,
      "weight": ${taskContext.rubric.taskAchievement},
      "commentPolish": ""
    },
    "grammar": {
      "score": 0,
      "weight": ${taskContext.rubric.grammar},
      "commentPolish": ""
    },
    "vocabulary": {
      "score": 0,
      "weight": ${taskContext.rubric.vocabulary},
      "commentPolish": ""
    },
    "coherence": {
      "score": 0,
      "weight": ${taskContext.rubric.coherence},
      "commentPolish": ""
    },
    "register": {
      "score": 0,
      "weight": ${taskContext.rubric.register},
      "commentPolish": ""
    },
    "mechanics": {
      "score": 0,
      "weight": ${taskContext.rubric.mechanics},
      "commentPolish": ""
    },
    "cefrAppropriateness": {
      "score": 0,
      "weight": ${taskContext.rubric.cefrAppropriateness},
      "commentPolish": ""
    }
  },
  "strengthsPolish": [],
  "improvementsPolish": [],
  "feedbackPolish": "",
  "taskCompleted": false,
  "offTopic": false,
  "containsNonEnglish": false,
  "copiedOrRepeated": false,
  "inappropriateLanguage": false,
  "meaninglessContent": false,
  "detectedLanguages": ["English"],
  "requiresManualReview": false,
  "confidence": 0
}

Rules:

- Every score must be between 0 and 100.
- Feedback and comments must be written in Polish.
- If the answer is off-topic, Task Achievement must normally be below 20.
- If the response is substantially non-English, the total score must normally be below 30.
- If the response contains excessive repetition, Coherence and Vocabulary must be strongly reduced.
- If the learner does not follow the required text type, reduce Task Achievement and Register.
- If the answer fulfils the task with different valid ideas, accept it.
- Do not reveal or quote the sample answer.
- Do not include Markdown.
- Do not include text outside the JSON object.
  `.trim();
};

export const evaluateWritingWithGemini =
  async ({
    answer = "",
    question = {},
    level = DEFAULT_CEFR_LEVEL,
    localEvaluation = null,
    rubric = {}
  }) => {
    const normalizedAnswer =
      normalizeText(answer);

    const normalizedLevel =
      normalizeLevel(level);

    if (!normalizedAnswer) {
      return buildInvalidEvaluation({
        level: normalizedLevel,
        message:
          "Nie podano odpowiedzi do oceny."
      });
    }

    const taskContext =
      buildWritingTaskContext({
        question,
        answer: normalizedAnswer,
        level: normalizedLevel,
        localEvaluation,
        rubric
      });

    try {

      const responseText =
        await sendAIMessage({
          mode:
            "writing_evaluator",

          currentLevel:
            normalizedLevel,

          targetLanguage:
            "English",

          baseLanguage:
            "Polish",

          writingTask:
            question,

          rubric:
            taskContext.rubric,

          userMessage:
            buildEvaluationUserMessage({
              answer:
                normalizedAnswer,

              taskContext
            }),

          context:
            "This is a CEFR placement test writing evaluation. Assess task relevance, communicative achievement, language quality and CEFR appropriateness. Return only valid JSON.",

          auditContext: {
            operation:
              "writing_evaluation"
          },

          forceJson: true
        });

      const parsedEvaluation =
        extractJson(responseText);

      const normalizedEvaluation =
        normalizeGeminiEvaluation({
          evaluation:
            parsedEvaluation,

          level:
            normalizedLevel,

          rubric:
            taskContext.rubric
        });

      return normalizedEvaluation;
    } catch (error) {
      console.error(
        "Gemini Writing evaluation failed:",
        error
      );

      console.error(
        "WRITING ERROR:",
        error
      );

      console.groupEnd();

      return buildUnavailableEvaluation({
        error,
        localEvaluation,
        level:
          normalizedLevel
      });
    }
  };

export default {
  evaluateWritingWithGemini
};
