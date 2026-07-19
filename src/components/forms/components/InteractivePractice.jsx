// src/components/forms/components/InteractivePractice.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

import FillInBlank from "./interactiveExercises/FillInTheBlanck";
import MatchingExercise from "./interactiveExercises/MatchingExercise";
import MultipleChoice from "./interactiveExercises/MultipleChoice";
import OrderExercise from "./interactiveExercises/OrderExercise";

const EXERCISE_TYPES = {
  multiple_choice: "multiple_choice",
  fill_blank: "fill_blank",
  ordering: "ordering",
  matching: "matching"
};

const LEGACY_TYPES = {
  seleccion_multiple: EXERCISE_TYPES.multiple_choice,
  multiple_choice: EXERCISE_TYPES.multiple_choice,

  completar: EXERCISE_TYPES.fill_blank,
  fill_blank: EXERCISE_TYPES.fill_blank,

  ordenar: EXERCISE_TYPES.ordering,
  order: EXERCISE_TYPES.ordering,
  ordering: EXERCISE_TYPES.ordering,

  relacionar: EXERCISE_TYPES.matching,
  matching: EXERCISE_TYPES.matching
};

const LEGACY_TYPE_MAP = {
  multiple_choice: "seleccion_multiple",
  fill_blank: "completar",
  ordering: "ordenar",
  matching: "relacionar"
};

/**
 * Comprueba si una propiedad existe realmente.
 *
 * Esto permite distinguir entre:
 * - propiedad ausente;
 * - propiedad presente con valor vacío "";
 * - propiedad presente con arreglo vacío [];
 */
const hasOwn = (source, key) =>
  Object.prototype.hasOwnProperty.call(source || {}, key);

/**
 * Obtiene el primer campo existente sin descartar valores válidos
 * como "", 0, false o [].
 */
const getExistingValue = (
  source = {},
  keys = [],
  fallback = ""
) => {
  for (const key of keys) {
    if (hasOwn(source, key)) {
      return source[key] ?? fallback;
    }
  }

  return fallback;
};

/**
 * Obtiene el primer arreglo existente.
 *
 * Importante:
 * No elimina cadenas vacías porque son necesarias mientras el
 * docente está creando nuevas opciones, palabras, pares o elementos.
 */
const getExistingArray = (
  source = {},
  keys = [],
  fallback = []
) => {
  for (const key of keys) {
    if (hasOwn(source, key)) {
      return Array.isArray(source[key])
        ? [...source[key]]
        : fallback;
    }
  }

  return fallback;
};

const normalizeStringArray = (items = []) =>
  Array.isArray(items)
    ? items.map((item) =>
        item === null || item === undefined
          ? ""
          : String(item)
      )
    : [];

const createExerciseId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `exercise-${crypto.randomUUID()}`;
  }

  return `exercise-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const normalizeExerciseType = (type = "") => {
  const safeType = String(type || "")
    .trim()
    .toLowerCase();

  return (
    LEGACY_TYPES[safeType] ||
    EXERCISE_TYPES.multiple_choice
  );
};

const isIndex = (value) =>
  typeof value === "number" ||
  (
    typeof value === "string" &&
    /^\d+$/.test(value.trim())
  );

const sameItemsSet = (first = [], second = []) => {
  if (first.length !== second.length) {
    return false;
  }

  const normalizedFirst = first
    .map(String)
    .sort();

  const normalizedSecond = second
    .map(String)
    .sort();

  return (
    normalizedFirst.join("|") ===
    normalizedSecond.join("|")
  );
};

const buildCorrectOrderValues = (
  exercise = {},
  items = []
) => {
  const rawValues = normalizeStringArray(
    getExistingArray(
      exercise,
      [
        "correctOrderValues",
        "correct_order_values",
        "correctOrderText",
        "correct_order_text"
      ],
      []
    )
  );

  const rawOrder = getExistingArray(
    exercise,
    [
      "correctOrder",
      "correct_order",
      "orden_correcto"
    ],
    []
  );

  if (
    rawValues.length === items.length &&
    sameItemsSet(rawValues, items)
  ) {
    return rawValues;
  }

  if (
    rawOrder.length === items.length &&
    rawOrder.every(isIndex)
  ) {
    const values = rawOrder.map((index) => {
      const item = items[Number(index)];

      return item === null || item === undefined
        ? ""
        : String(item);
    });

    if (values.length === items.length) {
      return values;
    }
  }

  if (
    rawOrder.length === items.length &&
    sameItemsSet(rawOrder, items)
  ) {
    return normalizeStringArray(rawOrder);
  }

  return normalizeStringArray(items);
};

const buildCorrectOrderIndexes = (
  items = [],
  correctOrderValues = []
) =>
  correctOrderValues.map((value) => {
    const index = items.findIndex(
      (item) => String(item) === String(value)
    );

    return index >= 0 ? index : value;
  });

const normalizeExercise = (exercise = {}) => {
  const type = normalizeExerciseType(
    getExistingValue(
      exercise,
      ["type", "tipo"],
      EXERCISE_TYPES.multiple_choice
    )
  );

  const items = normalizeStringArray(
    getExistingArray(
      exercise,
      ["items", "elementos"],
      []
    )
  );

  const correctOrderValues =
    type === EXERCISE_TYPES.ordering
      ? buildCorrectOrderValues(exercise, items)
      : normalizeStringArray(
          getExistingArray(
            exercise,
            [
              "correctOrderValues",
              "correct_order_values"
            ],
            []
          )
        );

  const leftPairs = normalizeStringArray(
    getExistingArray(
      exercise,
      [
        "leftPairs",
        "leftItems",
        "left_items",
        "pares_izquierda",
        "elementos_izquierda"
      ],
      []
    )
  );

  const rightPairs = normalizeStringArray(
    getExistingArray(
      exercise,
      [
        "rightPairs",
        "rightItems",
        "right_items",
        "pares_derecha",
        "elementos_derecha"
      ],
      []
    )
  );

  return {
    ...exercise,

    id: String(
      getExistingValue(
        exercise,
        ["id"],
        ""
      )
    ),

    type,

    question: String(
      getExistingValue(
        exercise,
        ["question", "pregunta"],
        ""
      )
    ),

    instructions: String(
      getExistingValue(
        exercise,
        [
          "instructions",
          "instruction",
          "instrucciones"
        ],
        ""
      )
    ),

    options: normalizeStringArray(
      getExistingArray(
        exercise,
        ["options", "opciones"],
        []
      )
    ),

    correctAnswer: String(
      getExistingValue(
        exercise,
        [
          "correctAnswer",
          "correct_answer",
          "respuesta_correcta",
          "respuesta",
          "answer"
        ],
        ""
      )
    ),

    text: String(
      getExistingValue(
        exercise,
        ["text", "texto"],
        ""
      )
    ),

    words: normalizeStringArray(
      getExistingArray(
        exercise,
        ["words", "palabras"],
        []
      )
    ),

    answers: getExistingValue(
      exercise,
      [
        "answers",
        "correctAnswers",
        "correct_answers",
        "respuestas",
        "respuestas_correctas"
      ],
      {}
    ),

    acceptedAnswers: getExistingValue(
      exercise,
      [
        "acceptedAnswers",
        "accepted_answers",
        "respuestas_aceptadas"
      ],
      {}
    ),

    items,

    correctOrder: buildCorrectOrderIndexes(
      items,
      correctOrderValues
    ),

    correctOrderValues,

    correct_order_values: correctOrderValues,

    leftPairs,

    rightPairs,

    correctMatches: getExistingValue(
      exercise,
      [
        "correctMatches",
        "correctPairs",
        "correct_pairs",
        "respuestas_correctas",
        "pares_correctos"
      ],
      {}
    )
  };
};

const buildLegacyExercise = (exercise = {}) => {
  const normalized = normalizeExercise(exercise);

  const correctOrder = buildCorrectOrderIndexes(
    normalized.items,
    normalized.correctOrderValues
  );

  return {
    ...normalized,

    tipo:
      LEGACY_TYPE_MAP[normalized.type] ||
      normalized.type,

    pregunta: normalized.question ?? "",

    instrucciones:
      normalized.instructions ?? "",

    opciones: Array.isArray(normalized.options)
      ? normalized.options
      : [],

    respuesta_correcta:
      normalized.correctAnswer ?? "",

    texto: normalized.text ?? "",

    palabras: Array.isArray(normalized.words)
      ? normalized.words
      : [],

    respuestas:
      normalized.answers &&
      typeof normalized.answers === "object"
        ? normalized.answers
        : {},

    respuestas_aceptadas:
      normalized.acceptedAnswers &&
      typeof normalized.acceptedAnswers === "object"
        ? normalized.acceptedAnswers
        : {},

    elementos: Array.isArray(normalized.items)
      ? normalized.items
      : [],

    orden_correcto: correctOrder,

    correctOrder,

    correctOrderValues:
      normalized.correctOrderValues || [],

    correct_order_values:
      normalized.correctOrderValues || [],

    pares_izquierda:
      normalized.leftPairs || [],

    pares_derecha:
      normalized.rightPairs || [],

    respuestas_correctas:
      normalized.correctMatches || {}
  };
};

const normalizePractice = (practice = {}) => {
  const rawExercises = getExistingArray(
    practice,
    ["exercises", "ejercicios"],
    []
  );

  return {
    title: String(
      getExistingValue(
        practice,
        ["title", "titulo"],
        ""
      )
    ),

    description: String(
      getExistingValue(
        practice,
        ["description", "descripcion"],
        ""
      )
    ),

    exercises: rawExercises.map(normalizeExercise)
  };
};

const buildLegacyPractice = (practice = {}) => ({
  titulo: practice.title ?? "",
  descripcion: practice.description ?? "",

  ejercicios: Array.isArray(practice.exercises)
    ? practice.exercises.map(buildLegacyExercise)
    : []
});

const getPracticeSource = (formData = {}) => {
  if (hasOwn(formData, "interactivePractice")) {
    return formData.interactivePractice || {};
  }

  if (hasOwn(formData, "practica_interactiva")) {
    return formData.practica_interactiva || {};
  }

  return {};
};

const getExerciseTypeLabel = (type) => {
  const labels = {
    multiple_choice: "Wielokrotny wybór",
    fill_blank: "Uzupełnianie luk",
    ordering: "Porządkowanie",
    matching: "Dopasowywanie"
  };

  return labels[type] || "Ćwiczenie";
};

const buildEmptyExercise = (type) =>
  normalizeExercise({
    id: createExerciseId(),
    type,

    question: "",
    instructions: "",

    options: [],
    correctAnswer: "",

    text: "",
    words: [],
    answers: {},
    acceptedAnswers: {},

    items: [],
    correctOrder: [],
    correctOrderValues: [],
    correct_order_values: [],

    leftPairs: [],
    rightPairs: [],
    correctMatches: {}
  });

const InteractivePractice = ({
  formData,
  setFormData
}) => {
  const practice = normalizePractice(
    getPracticeSource(formData)
  );

  /**
   * Único punto responsable de sincronizar:
   *
   * - modelo canónico: interactivePractice
   * - modelo legacy: practica_interactiva
   */
  const updatePractice = (updatedPractice) => {
    const normalizedPractice =
      normalizePractice(updatedPractice);

    setFormData((previousFormData) => ({
      ...previousFormData,

      interactivePractice: normalizedPractice,

      practica_interactiva:
        buildLegacyPractice(normalizedPractice)
    }));
  };

  const handleChange = (field, value) => {
    updatePractice({
      ...practice,
      [field]: value
    });
  };

  const handleAddExercise = (type) => {
    const newExercise = buildEmptyExercise(type);

    updatePractice({
      ...practice,
      exercises: [
        ...practice.exercises,
        newExercise
      ]
    });
  };

  const handleUpdateExercise = (
    index,
    updatedExercise
  ) => {
    const nextExercises = [
      ...practice.exercises
    ];

    const currentExercise =
      nextExercises[index] || {};

    nextExercises[index] = normalizeExercise({
      ...currentExercise,
      ...updatedExercise,

      id:
        updatedExercise?.id ||
        currentExercise.id ||
        createExerciseId()
    });

    updatePractice({
      ...practice,
      exercises: nextExercises
    });
  };

  const handleRemoveExercise = (index) => {
    updatePractice({
      ...practice,

      exercises: practice.exercises.filter(
        (_, exerciseIndex) =>
          exerciseIndex !== index
      )
    });
  };

  const renderExerciseEditor = (
    exercise,
    index
  ) => {
    const canonicalExercise =
      normalizeExercise(exercise);

    const legacyExercise =
      buildLegacyExercise(canonicalExercise);

    const handleEditorChange = (
      updatedExercise
    ) => {
      handleUpdateExercise(
        index,
        updatedExercise
      );
    };

    const commonProps = {
      exercise: canonicalExercise,
      ejercicio: legacyExercise,
      onChange: handleEditorChange
    };

    if (
      canonicalExercise.type ===
      EXERCISE_TYPES.multiple_choice
    ) {
      return <MultipleChoice {...commonProps} />;
    }

    if (
      canonicalExercise.type ===
      EXERCISE_TYPES.fill_blank
    ) {
      return <FillInBlank {...commonProps} />;
    }

    if (
      canonicalExercise.type ===
      EXERCISE_TYPES.ordering
    ) {
      return <OrderExercise {...commonProps} />;
    }

    if (
      canonicalExercise.type ===
      EXERCISE_TYPES.matching
    ) {
      return (
        <MatchingExercise {...commonProps} />
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tytuł ćwiczeń interaktywnych
        </label>

        <input
          type="text"
          value={practice.title}
          onChange={(event) =>
            handleChange(
              "title",
              event.target.value
            )
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Wpisz tytuł ćwiczeń interaktywnych..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Opis
        </label>

        <textarea
          value={practice.description}
          onChange={(event) =>
            handleChange(
              "description",
              event.target.value
            )
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={4}
          placeholder="Wpisz opis ćwiczeń interaktywnych..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h3 className="text-lg font-medium">
            Ćwiczenia
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleAddExercise(
                  EXERCISE_TYPES.multiple_choice
                )
              }
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
            >
              <FaPlus className="mr-1" />
              Wielokrotny wybór
            </button>

            <button
              type="button"
              onClick={() =>
                handleAddExercise(
                  EXERCISE_TYPES.fill_blank
                )
              }
              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
            >
              <FaPlus className="mr-1" />
              Uzupełnianie luk
            </button>

            <button
              type="button"
              onClick={() =>
                handleAddExercise(
                  EXERCISE_TYPES.ordering
                )
              }
              className="inline-flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm transition-colors"
            >
              <FaPlus className="mr-1" />
              Porządkowanie
            </button>

            <button
              type="button"
              onClick={() =>
                handleAddExercise(
                  EXERCISE_TYPES.matching
                )
              }
              className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors"
            >
              <FaPlus className="mr-1" />
              Dopasowywanie
            </button>
          </div>
        </div>

        {practice.exercises.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Nie zdefiniowano jeszcze ćwiczeń interaktywnych.
          </p>
        ) : (
          practice.exercises.map(
            (exercise, index) => {
              const exerciseId =
                exercise.id ||
                `exercise-${index}`;

              return (
                <div
                  key={exerciseId}
                  className="border border-gray-200 p-4 rounded-lg space-y-4 bg-white"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <span className="font-medium">
                        {getExerciseTypeLabel(
                          exercise.type
                        )}
                      </span>

                      <p className="text-xs text-gray-500 mt-1">
                        Ćwiczenie {index + 1}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveExercise(index)
                      }
                      className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Usuń ćwiczenie ${
                        index + 1
                      }`}
                      title="Usuń ćwiczenie"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  {renderExerciseEditor(
                    exercise,
                    index
                  )}
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
};

InteractivePractice.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default InteractivePractice;