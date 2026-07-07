// src/components/forms/components/interactiveExercises/MatchingExercise.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeExercise = (exercise = {}) => ({
  ...exercise,

  instructions:
    exercise.instructions ||
    exercise.instrucciones ||
    "",

  leftPairs: Array.isArray(exercise.leftPairs)
    ? exercise.leftPairs
    : Array.isArray(exercise.pares_izquierda)
      ? exercise.pares_izquierda
      : [],

  rightPairs: Array.isArray(exercise.rightPairs)
    ? exercise.rightPairs
    : Array.isArray(exercise.pares_derecha)
      ? exercise.pares_derecha
      : [],

  correctMatches:
    exercise.correctMatches ||
    exercise.respuestas_correctas ||
    {}
});

const buildLegacyExercise = (exercise = {}) => ({
  ...exercise,
  instrucciones: exercise.instructions || "",
  pares_izquierda: exercise.leftPairs || [],
  pares_derecha: exercise.rightPairs || [],
  respuestas_correctas: exercise.correctMatches || {}
});

const MatchingExercise = ({ exercise, ejercicio, onChange }) => {
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

  const handleAddPair = () => {
    const nextIndex = normalizedExercise.leftPairs.length;

    updateExercise({
      ...normalizedExercise,
      leftPairs: [...normalizedExercise.leftPairs, ""],
      rightPairs: [...normalizedExercise.rightPairs, ""],
      correctMatches: {
        ...normalizedExercise.correctMatches,
        [`pair${nextIndex}`]: ""
      }
    });
  };

  const handlePairChange = (side, index, value) => {
    const field = side === "left" ? "leftPairs" : "rightPairs";
    const newPairs = [...normalizedExercise[field]];

    newPairs[index] = value;

    updateExercise({
      ...normalizedExercise,
      [field]: newPairs
    });
  };

  const handleAnswerChange = (index, rightValue) => {
    updateExercise({
      ...normalizedExercise,
      correctMatches: {
        ...normalizedExercise.correctMatches,
        [`pair${index}`]: rightValue
      }
    });
  };

  const handleRemovePair = (index) => {
    const newLeftPairs = normalizedExercise.leftPairs.filter(
      (_, pairIndex) => pairIndex !== index
    );

    const newRightPairs = normalizedExercise.rightPairs.filter(
      (_, pairIndex) => pairIndex !== index
    );

    const newCorrectMatches = {
      ...normalizedExercise.correctMatches
    };

    delete newCorrectMatches[`pair${index}`];

    updateExercise({
      ...normalizedExercise,
      leftPairs: newLeftPairs,
      rightPairs: newRightPairs,
      correctMatches: newCorrectMatches
    });
  };

  return (
    <div className="space-y-4">
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
          placeholder="Wpisz instrukcję dopasowywania elementów..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Pary do dopasowania
          </label>

          <button
            type="button"
            onClick={handleAddPair}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="inline mr-2" />
            Dodaj parę
          </button>
        </div>

        {normalizedExercise.leftPairs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4">
              <div className="font-medium text-sm text-gray-700 md:text-center">
                Lewa kolumna
              </div>

              <div className="hidden md:block" />

              <div className="font-medium text-sm text-gray-700 md:text-center">
                Prawidłowe dopasowanie
              </div>
            </div>

            {normalizedExercise.leftPairs.map((leftValue, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 md:gap-4 items-center"
              >
                <input
                  type="text"
                  value={leftValue}
                  onChange={(event) =>
                    handlePairChange("left", index, event.target.value)
                  }
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Element z lewej kolumny"
                />

                <button
                  type="button"
                  onClick={() => handleRemovePair(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń parę ${index + 1}`}
                  title="Usuń parę"
                >
                  <FaTrash />
                </button>

                <select
                  value={
                    normalizedExercise.correctMatches?.[`pair${index}`] ||
                    ""
                  }
                  onChange={(event) =>
                    handleAnswerChange(index, event.target.value)
                  }
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Wybierz poprawną parę</option>

                  {normalizedExercise.rightPairs.map((option, optionIndex) => (
                    <option key={optionIndex} value={option}>
                      {option || `Element prawy ${optionIndex + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Nie dodano jeszcze par do dopasowania.
          </p>
        )}
      </div>

      {normalizedExercise.rightPairs.length > 0 && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Elementy prawej kolumny
          </label>

          {normalizedExercise.rightPairs.map((rightValue, index) => (
            <input
              key={index}
              type="text"
              value={rightValue}
              onChange={(event) =>
                handlePairChange("right", index, event.target.value)
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder={`Element prawy ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

MatchingExercise.propTypes = {
  exercise: PropTypes.object,
  ejercicio: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

MatchingExercise.defaultProps = {
  exercise: null,
  ejercicio: null
};

export default MatchingExercise;