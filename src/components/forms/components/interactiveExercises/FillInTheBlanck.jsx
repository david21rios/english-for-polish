// src/components/forms/components/interactiveExercises/FillInTheBlanck.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const hasOwn = (source, key) =>
  Object.prototype.hasOwnProperty.call(source || {}, key);

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

const normalizeAnswers = (value) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return { ...value };
  }

  return {};
};

const normalizeExercise = (exercise = {}) => ({
  ...exercise,

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

  answers: normalizeAnswers(
    getExistingValue(
      exercise,
      [
        "answers",
        "correctAnswers",
        "correct_answers",
        "respuestas",
        "respuestas_correctas"
      ],
      {}
    )
  )
});

const buildLegacyExercise = (exercise = {}) => ({
  instrucciones: exercise.instructions ?? "",
  texto: exercise.text ?? "",

  palabras: Array.isArray(exercise.words)
    ? exercise.words
    : [],

  respuestas: normalizeAnswers(exercise.answers)
});

const rebuildAnswersAfterRemoval = (
  words = [],
  answers = {},
  removedIndex
) => {
  const nextAnswers = {};

  words.forEach((_, newIndex) => {
    const oldIndex =
      newIndex < removedIndex
        ? newIndex
        : newIndex + 1;

    nextAnswers[`blank${newIndex}`] =
      answers[`blank${oldIndex}`] ?? "";
  });

  return nextAnswers;
};

const FillInTheBlank = ({
  exercise = null,
  ejercicio = null,
  onChange
}) => {
  /*
   * El modelo canónico tiene prioridad.
   * El modelo legacy se conserva únicamente como fallback.
   */
  const sourceExercise =
    exercise ?? ejercicio ?? {};

  const normalizedExercise =
    normalizeExercise(sourceExercise);

  const updateExercise = (updatedExercise) => {
    const canonicalExercise =
      normalizeExercise(updatedExercise);

    const legacyExercise =
      buildLegacyExercise(canonicalExercise);

    onChange({
      /*
       * Conserva campos externos como id, type y metadata.
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

  const handleAddWord = () => {
    const nextIndex =
      normalizedExercise.words.length;

    updateExercise({
      ...normalizedExercise,

      words: [
        ...normalizedExercise.words,
        ""
      ],

      answers: {
        ...normalizedExercise.answers,
        [`blank${nextIndex}`]: ""
      }
    });
  };

  const handleWordChange = (index, value) => {
    const nextWords = [
      ...normalizedExercise.words
    ];

    nextWords[index] = value;

    updateExercise({
      ...normalizedExercise,
      words: nextWords
    });
  };

  const handleAnswerChange = (
    blankId,
    value
  ) => {
    updateExercise({
      ...normalizedExercise,

      answers: {
        ...normalizedExercise.answers,
        [blankId]: value
      }
    });
  };

  const handleRemoveWord = (index) => {
    const nextWords =
      normalizedExercise.words.filter(
        (_, wordIndex) =>
          wordIndex !== index
      );

    const nextAnswers =
      rebuildAnswersAfterRemoval(
        nextWords,
        normalizedExercise.answers,
        index
      );

    updateExercise({
      ...normalizedExercise,
      words: nextWords,
      answers: nextAnswers
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
            handleChange(
              "instructions",
              event.target.value
            )
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
            handleChange(
              "text",
              event.target.value
            )
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
            className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="mr-2" />
            Dodaj słowo
          </button>
        </div>

        {normalizedExercise.words.length > 0 ? (
          normalizedExercise.words.map(
            (word, index) => {
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
                        handleWordChange(
                          index,
                          event.target.value
                        )
                      }
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder={`Słowo ${index + 1}`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveWord(index)
                      }
                      className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Usuń słowo ${index + 1}`}
                      title="Usuń słowo"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={
                      normalizedExercise.answers[
                        blankId
                      ] ?? ""
                    }
                    onChange={(event) =>
                      handleAnswerChange(
                        blankId,
                        event.target.value
                      )
                    }
                    className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Poprawna odpowiedź"
                  />
                </div>
              );
            }
          )
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

export default FillInTheBlank;