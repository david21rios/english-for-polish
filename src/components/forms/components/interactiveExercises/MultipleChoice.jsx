// src/components/forms/components/interactiveExercises/MultipleChoice.jsx

import { useId } from "react";
import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const getExistingValue = (source = {}, keys = [], fallback = "") => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key] ?? fallback;
    }
  }

  return fallback;
};

const normalizeOptions = (exercise = {}) => {
  if (
    Object.prototype.hasOwnProperty.call(exercise, "options") &&
    Array.isArray(exercise.options)
  ) {
    return exercise.options;
  }

  if (
    Object.prototype.hasOwnProperty.call(exercise, "opciones") &&
    Array.isArray(exercise.opciones)
  ) {
    return exercise.opciones;
  }

  return [];
};

const normalizeExercise = (exercise = {}) => ({
  ...exercise,

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
      ["instructions", "instrucciones"],
      ""
    )
  ),

  options: normalizeOptions(exercise).map((option) =>
    option === null || option === undefined ? "" : String(option)
  ),

  correctAnswer: String(
    getExistingValue(
      exercise,
      ["correctAnswer", "respuesta_correcta"],
      ""
    )
  )
});

const buildLegacyExercise = (exercise = {}) => ({
  pregunta: exercise.question ?? "",
  instrucciones: exercise.instructions ?? "",
  opciones: Array.isArray(exercise.options)
    ? exercise.options
    : [],
  respuesta_correcta: exercise.correctAnswer ?? ""
});

const MultipleChoice = ({
  exercise = null,
  ejercicio = null,
  onChange
}) => {
  const radioGroupId = useId();

  /*
   * `exercise` es el modelo canónico.
   * `ejercicio` se conserva solo como compatibilidad legacy.
   */
  const sourceExercise = exercise ?? ejercicio ?? {};
  const normalizedExercise = normalizeExercise(sourceExercise);

  const updateExercise = (updatedExercise) => {
    const canonicalExercise = normalizeExercise(updatedExercise);
    const legacyExercise = buildLegacyExercise(canonicalExercise);

    onChange({
      /*
       * Conservamos otros posibles campos del ejercicio, como `id` y `type`.
       */
      ...sourceExercise,

      /*
       * Modelo canónico.
       */
      ...canonicalExercise,

      /*
       * Compatibilidad legacy sincronizada.
       */
      ...legacyExercise
    });
  };

  const handleChange = (field, value) => {
    updateExercise({
      ...normalizedExercise,
      [field]: value
    });
  };

  const handleAddOption = () => {
    updateExercise({
      ...normalizedExercise,
      options: [...normalizedExercise.options, ""]
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...normalizedExercise.options];
    const previousValue = newOptions[index] ?? "";

    newOptions[index] = value;

    const nextCorrectAnswer =
      normalizedExercise.correctAnswer === previousValue
        ? value
        : normalizedExercise.correctAnswer;

    updateExercise({
      ...normalizedExercise,
      options: newOptions,
      correctAnswer: nextCorrectAnswer
    });
  };

  const handleRemoveOption = (index) => {
    const removedOption =
      normalizedExercise.options[index] ?? "";

    const newOptions = normalizedExercise.options.filter(
      (_, optionIndex) => optionIndex !== index
    );

    updateExercise({
      ...normalizedExercise,
      options: newOptions,
      correctAnswer:
        normalizedExercise.correctAnswer === removedOption
          ? ""
          : normalizedExercise.correctAnswer
    });
  };

  const handleCorrectAnswerChange = (option) => {
    /*
     * Una opción vacía no puede seleccionarse como respuesta correcta.
     */
    if (!option.trim()) return;

    handleChange("correctAnswer", option);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pytanie
        </label>

        <input
          type="text"
          value={normalizedExercise.question}
          onChange={(event) =>
            handleChange("question", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Wpisz pytanie..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Instrukcja
        </label>

        <textarea
          value={normalizedExercise.instructions}
          onChange={(event) =>
            handleChange("instructions", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={2}
          placeholder="Wpisz instrukcję dla ucznia..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Opcje odpowiedzi
          </label>

          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="mr-2" />
            Dodaj opcję
          </button>
        </div>

        {normalizedExercise.options.length > 0 ? (
          normalizedExercise.options.map((option, index) => (
            <div
              key={`${radioGroupId}-option-${index}`}
              className="flex items-center gap-2"
            >
              <input
                type="radio"
                name={`multiple-choice-correct-answer-${radioGroupId}`}
                checked={
                  option.trim() !== "" &&
                  normalizedExercise.correctAnswer === option
                }
                disabled={option.trim() === ""}
                onChange={() =>
                  handleCorrectAnswerChange(option)
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                aria-label={`Oznacz opcję ${index + 1} jako poprawną`}
              />

              <input
                type="text"
                value={option}
                onChange={(event) =>
                  handleOptionChange(index, event.target.value)
                }
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder={`Opcja ${index + 1}`}
              />

              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Usuń opcję ${index + 1}`}
                title="Usuń opcję"
              >
                <FaTrash />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">
            Nie dodano jeszcze opcji odpowiedzi.
          </p>
        )}
      </div>

      {normalizedExercise.options.length > 0 &&
        !normalizedExercise.correctAnswer && (
          <p className="text-sm text-yellow-600">
            Wybierz poprawną odpowiedź.
          </p>
        )}
    </div>
  );
};

MultipleChoice.propTypes = {
  exercise: PropTypes.object,
  ejercicio: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

export default MultipleChoice;