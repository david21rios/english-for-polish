// src/components/forms/components/interactiveExercises/FillInTheBlanck.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeExercise = (exercise = {}) => ({
  ...exercise,

  instructions:
    exercise.instructions ||
    exercise.instrucciones ||
    "",

  text:
    exercise.text ||
    exercise.texto ||
    "",

  words: Array.isArray(exercise.words)
    ? exercise.words
    : Array.isArray(exercise.palabras)
      ? exercise.palabras
      : [],

  answers:
    exercise.answers ||
    exercise.respuestas ||
    {}
});

const buildLegacyExercise = (exercise = {}) => ({
  ...exercise,
  instrucciones: exercise.instructions || "",
  texto: exercise.text || "",
  palabras: exercise.words || [],
  respuestas: exercise.answers || {}
});

const FillInTheBlank = ({ exercise, ejercicio, onChange }) => {
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

  const handleAddWord = () => {
    const nextIndex = normalizedExercise.words.length;

    updateExercise({
      ...normalizedExercise,
      words: [...normalizedExercise.words, ""],
      answers: {
        ...normalizedExercise.answers,
        [`blank${nextIndex}`]: ""
      }
    });
  };

  const handleWordChange = (index, value) => {
    const newWords = [...normalizedExercise.words];

    newWords[index] = value;

    updateExercise({
      ...normalizedExercise,
      words: newWords
    });
  };

  const handleAnswerChange = (blankId, value) => {
    updateExercise({
      ...normalizedExercise,
      answers: {
        ...normalizedExercise.answers,
        [blankId]: value
      }
    });
  };

  const handleRemoveWord = (index) => {
    const newWords = normalizedExercise.words.filter(
      (_, wordIndex) => wordIndex !== index
    );

    const newAnswers = { ...normalizedExercise.answers };

    delete newAnswers[`blank${index}`];

    updateExercise({
      ...normalizedExercise,
      words: newWords,
      answers: newAnswers
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
          placeholder="Wpisz instrukcję do ćwiczenia..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tekst z lukami
        </label>

        <textarea
          value={normalizedExercise.text}
          onChange={(event) =>
            handleChange("text", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={4}
          placeholder="Wpisz tekst, używając ___ w miejscach luk..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Słowa i poprawne odpowiedzi
          </label>

          <button
            type="button"
            onClick={handleAddWord}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="inline mr-2" />
            Dodaj słowo
          </button>
        </div>

        {normalizedExercise.words.length > 0 ? (
          normalizedExercise.words.map((word, index) => {
            const blankId = `blank${index}`;

            return (
              <div
                key={blankId}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={word}
                    onChange={(event) =>
                      handleWordChange(index, event.target.value)
                    }
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Słowo widoczne"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveWord(index)}
                    className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Usuń słowo ${index + 1}`}
                    title="Usuń słowo"
                  >
                    <FaTrash />
                  </button>
                </div>

                <input
                  type="text"
                  value={normalizedExercise.answers?.[blankId] || ""}
                  onChange={(event) =>
                    handleAnswerChange(blankId, event.target.value)
                  }
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Poprawna odpowiedź"
                />
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 italic">
            Nie dodano jeszcze słów ani odpowiedzi.
          </p>
        )}
      </div>
    </div>
  );
};

FillInTheBlank.propTypes = {
  exercise: PropTypes.object,
  ejercicio: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

FillInTheBlank.defaultProps = {
  exercise: null,
  ejercicio: null
};

export default FillInTheBlank;