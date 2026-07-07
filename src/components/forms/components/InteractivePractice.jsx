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
  seleccion_multiple: "multiple_choice",
  completar: "fill_blank",
  ordenar: "ordering",
  order: "ordering",
  relacionar: "matching"
};

const LEGACY_TYPE_MAP = {
  multiple_choice: "seleccion_multiple",
  fill_blank: "completar",
  ordering: "ordenar",
  matching: "relacionar"
};

const cleanArray = (items = []) =>
  Array.isArray(items)
    ? items.filter((item) => item !== null && item !== undefined && item !== "")
    : [];

const normalizeExerciseType = (type = "") =>
  LEGACY_TYPES[type] || type || EXERCISE_TYPES.multiple_choice;

const isIndex = (value) =>
  typeof value === "number" ||
  (typeof value === "string" && /^\d+$/.test(value.trim()));

const sameItemsSet = (a = [], b = []) =>
  a.map(String).sort().join("|") === b.map(String).sort().join("|");

const buildCorrectOrderValues = (exercise = {}, items = []) => {
  const rawValues = cleanArray(
    exercise.correctOrderValues ||
      exercise.correct_order_values ||
      exercise.correctOrderText ||
      exercise.correct_order_text
  );

  const rawOrder = cleanArray(
    exercise.correctOrder ||
      exercise.correct_order ||
      exercise.orden_correcto
  );

  if (
    rawValues.length === items.length &&
    sameItemsSet(rawValues, items)
  ) {
    return rawValues.map(String);
  }

  if (
    rawOrder.length === items.length &&
    rawOrder.every(isIndex)
  ) {
    const values = rawOrder
      .map((index) => items[Number(index)])
      .filter(Boolean);

    if (values.length === items.length) {
      return values.map(String);
    }
  }

  if (
    rawOrder.length === items.length &&
    sameItemsSet(rawOrder, items)
  ) {
    return rawOrder.map(String);
  }

  return items.map(String);
};

const buildCorrectOrderIndexes = (items = [], correctOrderValues = []) =>
  correctOrderValues.map((value) => {
    const index = items.findIndex((item) => String(item) === String(value));
    return index >= 0 ? index : value;
  });

const normalizeExercise = (exercise = {}) => {
  const type = normalizeExerciseType(exercise.type || exercise.tipo);
  const items = cleanArray(exercise.items || exercise.elementos);
  const correctOrderValues =
    type === EXERCISE_TYPES.ordering
      ? buildCorrectOrderValues(exercise, items)
      : cleanArray(
          exercise.correctOrderValues || exercise.correct_order_values
        );

  return {
    ...exercise,
    type,
    question: exercise.question || exercise.pregunta || "",
    instructions: exercise.instructions || exercise.instrucciones || "",
    options: cleanArray(exercise.options || exercise.opciones),
    correctAnswer: exercise.correctAnswer || exercise.respuesta_correcta || "",
    text: exercise.text || exercise.texto || "",
    words: cleanArray(exercise.words || exercise.palabras),
    answers: exercise.answers || exercise.respuestas || {},

    items,
    correctOrder: buildCorrectOrderIndexes(items, correctOrderValues),
    correctOrderValues,
    correct_order_values: correctOrderValues,

    leftPairs: cleanArray(exercise.leftPairs || exercise.pares_izquierda),
    rightPairs: cleanArray(exercise.rightPairs || exercise.pares_derecha),
    correctMatches: exercise.correctMatches || exercise.respuestas_correctas || {}
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
    tipo: LEGACY_TYPE_MAP[normalized.type] || normalized.type,
    pregunta: normalized.question || "",
    instrucciones: normalized.instructions || "",
    opciones: normalized.options || [],
    respuesta_correcta: normalized.correctAnswer || "",
    texto: normalized.text || "",
    palabras: normalized.words || [],
    respuestas: normalized.answers || {},

    elementos: normalized.items || [],
    orden_correcto: correctOrder,
    correctOrder: correctOrder,
    correctOrderValues: normalized.correctOrderValues || [],
    correct_order_values: normalized.correctOrderValues || [],

    pares_izquierda: normalized.leftPairs || [],
    pares_derecha: normalized.rightPairs || [],
    respuestas_correctas: normalized.correctMatches || {}
  };
};

const normalizePractice = (practice = {}) => ({
  title: practice.title || practice.titulo || "",
  description: practice.description || practice.descripcion || "",
  exercises: (
    Array.isArray(practice.exercises)
      ? practice.exercises
      : Array.isArray(practice.ejercicios)
        ? practice.ejercicios
        : []
  ).map(normalizeExercise)
});

const buildLegacyPractice = (practice = {}) => ({
  titulo: practice.title || "",
  descripcion: practice.description || "",
  ejercicios: (practice.exercises || []).map(buildLegacyExercise)
});

const getExerciseTypeLabel = (type) => {
  const labels = {
    multiple_choice: "Wielokrotny wybór",
    fill_blank: "Uzupełnianie luk",
    ordering: "Porządkowanie",
    matching: "Dopasowywanie"
  };

  return labels[type] || "Ćwiczenie";
};

const InteractivePractice = ({ formData, setFormData }) => {
  const practice = normalizePractice(
    formData.interactivePractice ||
      formData.practica_interactiva ||
      {}
  );

  const updatePractice = (updatedPractice) => {
    const normalizedPractice = normalizePractice(updatedPractice);

    setFormData((prev) => ({
      ...prev,
      interactivePractice: normalizedPractice,
      practica_interactiva: buildLegacyPractice(normalizedPractice)
    }));
  };

  const handleChange = (field, value) => {
    updatePractice({
      ...practice,
      [field]: value
    });
  };

  const handleAddExercise = (type) => {
    const newExercise = normalizeExercise({
      type,
      question: "",
      instructions: "",
      options: [],
      correctAnswer: "",
      text: "",
      words: [],
      answers: {},
      items: [],
      correctOrder: [],
      correctOrderValues: [],
      correct_order_values: [],
      leftPairs: [],
      rightPairs: [],
      correctMatches: {}
    });

    updatePractice({
      ...practice,
      exercises: [...practice.exercises, newExercise]
    });
  };

  const handleExerciseChange = (index, field, value) => {
    const newExercises = [...practice.exercises];

    newExercises[index] = normalizeExercise({
      ...newExercises[index],
      [field]: value
    });

    updatePractice({
      ...practice,
      exercises: newExercises
    });
  };

  const handleUpdateExercise = (index, updatedExercise) => {
    const newExercises = [...practice.exercises];

    newExercises[index] = normalizeExercise(updatedExercise);

    updatePractice({
      ...practice,
      exercises: newExercises
    });
  };

  const handleRemoveExercise = (index) => {
    updatePractice({
      ...practice,
      exercises: practice.exercises.filter(
        (_, exerciseIndex) => exerciseIndex !== index
      )
    });
  };

  const renderExerciseEditor = (exercise, index) => {
    const legacyExercise = buildLegacyExercise(exercise);

    const handleLegacyChange = (updatedLegacyExercise) => {
      handleUpdateExercise(index, updatedLegacyExercise);
    };

    if (exercise.type === EXERCISE_TYPES.multiple_choice) {
      return (
        <MultipleChoice
          ejercicio={legacyExercise}
          onChange={handleLegacyChange}
        />
      );
    }

    if (exercise.type === EXERCISE_TYPES.fill_blank) {
      return (
        <FillInBlank
          ejercicio={legacyExercise}
          onChange={handleLegacyChange}
        />
      );
    }

    if (exercise.type === EXERCISE_TYPES.ordering) {
      return (
        <OrderExercise
          ejercicio={legacyExercise}
          onChange={handleLegacyChange}
        />
      );
    }

    if (exercise.type === EXERCISE_TYPES.matching) {
      return (
        <MatchingExercise
          ejercicio={legacyExercise}
          onChange={handleLegacyChange}
        />
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
          onChange={(event) => handleChange("title", event.target.value)}
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
          onChange={(event) => handleChange("description", event.target.value)}
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
              onClick={() => handleAddExercise(EXERCISE_TYPES.multiple_choice)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Wielokrotny wybór
            </button>

            <button
              type="button"
              onClick={() => handleAddExercise(EXERCISE_TYPES.fill_blank)}
              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Uzupełnianie luk
            </button>

            <button
              type="button"
              onClick={() => handleAddExercise(EXERCISE_TYPES.ordering)}
              className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Porządkowanie
            </button>

            <button
              type="button"
              onClick={() => handleAddExercise(EXERCISE_TYPES.matching)}
              className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Dopasowywanie
            </button>
          </div>
        </div>

        {practice.exercises.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Nie zdefiniowano jeszcze ćwiczeń interaktywnych.
          </p>
        ) : (
          practice.exercises.map((exercise, index) => (
            <div
              key={index}
              className="border border-gray-200 p-4 rounded-lg space-y-4 bg-white"
            >
              <div className="flex justify-between items-center gap-3">
                <span className="font-medium">
                  {getExerciseTypeLabel(exercise.type)}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveExercise(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń ćwiczenie ${index + 1}`}
                  title="Usuń ćwiczenie"
                >
                  <FaTrash />
                </button>
              </div>

              <input
                type="text"
                value={exercise.question || ""}
                onChange={(event) =>
                  handleExerciseChange(index, "question", event.target.value)
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Pytanie lub instrukcja..."
              />

              {renderExerciseEditor(exercise, index)}
            </div>
          ))
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