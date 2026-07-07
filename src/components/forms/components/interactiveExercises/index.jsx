// src/components/forms/components/interactiveExercises/index.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

import FillInTheBlank from "./FillInTheBlanck.jsx";
import MatchingExercise from "./MatchingExercise";
import MultipleChoice from "./MultipleChoice";
import OrderExercise from "./OrderExercise";

const EXERCISE_TYPES = {
  multiple_choice: "multiple_choice",
  fill_blank: "fill_blank",
  matching: "matching",
  ordering: "ordering"
};

const normalizeExercise = (exercise = {}) => ({
  ...exercise,
  type: exercise.type || exercise.tipo || EXERCISE_TYPES.multiple_choice,
  question: exercise.question || exercise.pregunta || "",
  instructions: exercise.instructions || exercise.instrucciones || ""
});

const buildLegacyExercise = (exercise = {}) => ({
  ...exercise,
  tipo: exercise.type || EXERCISE_TYPES.multiple_choice,
  pregunta: exercise.question || "",
  instrucciones: exercise.instructions || ""
});

const normalizeInteractiveExercises = (data = {}) => ({
  title: data.title || data.titulo || "",
  description: data.description || data.descripcion || "",
  exercises: (
    Array.isArray(data.exercises)
      ? data.exercises
      : Array.isArray(data.ejercicios)
        ? data.ejercicios
        : []
  ).map(normalizeExercise)
});

const buildLegacyInteractiveExercises = (data = {}) => ({
  titulo: data.title || "",
  descripcion: data.description || "",
  ejercicios: (data.exercises || []).map(buildLegacyExercise)
});

const getExerciseLabel = (type) => {
  const labels = {
    multiple_choice: "Wielokrotny wybór",
    fill_blank: "Uzupełnianie luk",
    matching: "Dopasowywanie",
    ordering: "Porządkowanie"
  };

  return labels[type] || "Ćwiczenie";
};

const InteractiveExercises = ({ formData, setFormData }) => {
  const interactiveExercises = normalizeInteractiveExercises(
    formData.interactiveExercises || formData.ejercicios_interactivos || {}
  );

  const updateInteractiveExercises = (updatedData) => {
    const normalizedData = normalizeInteractiveExercises(updatedData);

    setFormData((prev) => ({
      ...prev,

      // Canonical model.
      interactiveExercises: normalizedData,

      // Legacy compatibility during migration.
      ejercicios_interactivos: buildLegacyInteractiveExercises(normalizedData)
    }));
  };

  const handleChange = (field, value) => {
    updateInteractiveExercises({
      ...interactiveExercises,
      [field]: value
    });
  };

  const handleAddExercise = (type) => {
    const newExercise = {
      type,
      question: "",
      instructions: "",
      options: [],
      correctAnswer: "",
      text: "",
      words: [],
      answers: {},
      leftPairs: [],
      rightPairs: [],
      correctMatches: {},
      items: [],
      correctOrder: []
    };

    updateInteractiveExercises({
      ...interactiveExercises,
      exercises: [...interactiveExercises.exercises, newExercise]
    });
  };

  const handleRemoveExercise = (index) => {
    updateInteractiveExercises({
      ...interactiveExercises,
      exercises: interactiveExercises.exercises.filter(
        (_, exerciseIndex) => exerciseIndex !== index
      )
    });
  };

  const handleUpdateExercise = (index, updatedExercise) => {
    const newExercises = [...interactiveExercises.exercises];

    newExercises[index] = normalizeExercise(updatedExercise);

    updateInteractiveExercises({
      ...interactiveExercises,
      exercises: newExercises
    });
  };

  const renderExerciseEditor = (exercise, index) => {
    const commonProps = {
      exercise,
      onChange: (updatedExercise) =>
        handleUpdateExercise(index, updatedExercise)
    };

    if (exercise.type === EXERCISE_TYPES.multiple_choice) {
      return <MultipleChoice {...commonProps} />;
    }

    if (exercise.type === EXERCISE_TYPES.fill_blank) {
      return <FillInTheBlank {...commonProps} />;
    }

    if (exercise.type === EXERCISE_TYPES.matching) {
      return <MatchingExercise {...commonProps} />;
    }

    if (exercise.type === EXERCISE_TYPES.ordering) {
      return <OrderExercise {...commonProps} />;
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
          value={interactiveExercises.title}
          onChange={(event) => handleChange("title", event.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Tytuł sekcji..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Opis
        </label>

        <textarea
          value={interactiveExercises.description}
          onChange={(event) => handleChange("description", event.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={3}
          placeholder="Ogólny opis ćwiczeń..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h3 className="text-lg font-medium text-gray-900">
            Ćwiczenia
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAddExercise(EXERCISE_TYPES.multiple_choice)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Wielokrotny wybór
            </button>

            <button
              type="button"
              onClick={() => handleAddExercise(EXERCISE_TYPES.fill_blank)}
              className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Uzupełnianie luk
            </button>

            <button
              type="button"
              onClick={() => handleAddExercise(EXERCISE_TYPES.matching)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Dopasowywanie
            </button>

            <button
              type="button"
              onClick={() => handleAddExercise(EXERCISE_TYPES.ordering)}
              className="px-3 py-1.5 bg-yellow-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" />
              Porządkowanie
            </button>
          </div>
        </div>

        {interactiveExercises.exercises.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Nie zdefiniowano jeszcze ćwiczeń interaktywnych.
          </p>
        ) : (
          interactiveExercises.exercises.map((exercise, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-center gap-3">
                <span className="font-medium">
                  {getExerciseLabel(exercise.type)}
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

              {renderExerciseEditor(exercise, index)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

InteractiveExercises.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default InteractiveExercises;