// src/components/forms/components/interactiveExercises/MultipleChoice.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeExercise = (exercise = {}) => ({
  ...exercise,

  question:
    exercise.question ||
    exercise.pregunta ||
    "",

  instructions:
    exercise.instructions ||
    exercise.instrucciones ||
    "",

  options: Array.isArray(exercise.options)
    ? exercise.options
    : Array.isArray(exercise.opciones)
      ? exercise.opciones
      : [],

  correctAnswer:
    exercise.correctAnswer ||
    exercise.respuesta_correcta ||
    ""
});

const buildLegacyExercise = (exercise = {}) => ({
  ...exercise,

  pregunta: exercise.question || "",
  instrucciones: exercise.instructions || "",
  opciones: exercise.options || [],
  respuesta_correcta: exercise.correctAnswer || ""
});

const MultipleChoice = ({ exercise, ejercicio, onChange }) => {
  const sourceExercise = exercise || ejercicio || {};
  const normalizedExercise = normalizeExercise(sourceExercise);

  const updateExercise = (updatedExercise) => {
    const canonicalExercise = normalizeExercise(updatedExercise);

    onChange({
      ...canonicalExercise,

      // Legacy compatibility during migration.
      ...buildLegacyExercise(canonicalExercise)
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
      options: [
        ...normalizedExercise.options,
        ""
      ]
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...normalizedExercise.options];
    const oldValue = newOptions[index];

    newOptions[index] = value;

    updateExercise({
      ...normalizedExercise,
      options: newOptions,

      correctAnswer:
        normalizedExercise.correctAnswer === oldValue
          ? value
          : normalizedExercise.correctAnswer
    });
  };

  const handleRemoveOption = (index) => {
    const removedOption = normalizedExercise.options[index];

    updateExercise({
      ...normalizedExercise,

      options: normalizedExercise.options.filter(
        (_, optionIndex) => optionIndex !== index
      ),

      correctAnswer:
        normalizedExercise.correctAnswer === removedOption
          ? ""
          : normalizedExercise.correctAnswer
    });
  };

  const handleCorrectAnswerChange = (option) => {
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
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="inline mr-2" />
            Dodaj opcję
          </button>
        </div>

        {normalizedExercise.options.length > 0 ? (
          normalizedExercise.options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              <input
                type="radio"
                name="multiple-choice-correct-answer"
                checked={
                  normalizedExercise.correctAnswer === option &&
                  option !== ""
                }
                onChange={() =>
                  handleCorrectAnswerChange(option)
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                aria-label={`Oznacz opcję ${index + 1} jako poprawną`}
              />

              <input
                type="text"
                value={option}
                onChange={(event) =>
                  handleOptionChange(
                    index,
                    event.target.value
                  )
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

MultipleChoice.defaultProps = {
  exercise: null,
  ejercicio: null
};

export default MultipleChoice;