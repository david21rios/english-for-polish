// src/components/test/WritingSection.jsx

import { useMemo, useState } from "react";
import PropTypes from "prop-types";

import {
  FaCheckCircle,
  FaEdit,
  FaExclamationTriangle,
  FaRobot
} from "react-icons/fa";

const countWords = (text = "") =>
  String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const normalizeText = (text = "") =>
  String(text)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ");

const hasExcessiveWhitespace = (text = "") =>
  /[ \t]{4,}/.test(String(text));

const hasExcessiveRepeatedCharacters = (text = "") =>
  /(.)\1{5,}/i.test(String(text));

const hasExcessiveRepeatedWords = (text = "") => {
  const words = String(text)
    .toLowerCase()
    .match(/[a-z'-]+/g);

  if (!words || words.length < 8) {
    return false;
  }

  const frequencies = words.reduce((accumulator, word) => {
    accumulator[word] = (accumulator[word] || 0) + 1;
    return accumulator;
  }, {});

  const maximumFrequency = Math.max(
    ...Object.values(frequencies)
  );

  return maximumFrequency / words.length >= 0.65;
};

const checkTextQuality = (text = "") => {
  const normalizedText = normalizeText(text).trim();

  if (!normalizedText) {
    return {
      status: "empty",
      message: null
    };
  }

  if (hasExcessiveWhitespace(text)) {
    return {
      status: "warning",
      message:
        "W odpowiedzi wykryto wiele kolejnych spacji. Sprawdź formatowanie tekstu."
    };
  }

  if (hasExcessiveRepeatedCharacters(normalizedText)) {
    return {
      status: "warning",
      message:
        "W odpowiedzi wykryto nietypowo powtarzające się znaki. Sprawdź wpisany tekst."
    };
  }

  if (hasExcessiveRepeatedWords(normalizedText)) {
    return {
      status: "warning",
      message:
        "Jedno słowo powtarza się bardzo często. Sprawdź, czy odpowiedź jest kompletna."
    };
  }

  return {
    status: "valid",
    message: null
  };
};

const normalizeQuestion = (question = {}, index = 0) => ({
  ...question,

  id:
    question.id ||
    `writing_${index}`,

  question:
    question.question ||
    question.prompt ||
    "",

  prompt:
    question.prompt ||
    question.question ||
    "",

  instructions:
    question.instructions ||
    "",

  minWords:
    Number(question.minWords) || 0,

  maxWords:
    Number(question.maxWords) || 0
});

const WritingTask = ({
  question,
  index,
  currentText,
  onChange
}) => {
  const [localWarning, setLocalWarning] = useState(null);

  const wordCount = useMemo(
    () => countWords(currentText),
    [currentText]
  );

  const minWords = question.minWords;
  const maxWords = question.maxWords;

  const hasText =
    currentText.trim().length > 0;

  const isBelowMinimum =
    hasText &&
    minWords > 0 &&
    wordCount < minWords;

  const isAboveMaximum =
    hasText &&
    maxWords > 0 &&
    wordCount > maxWords;

  const isWithinRecommendedLength =
    hasText &&
    !isBelowMinimum &&
    !isAboveMaximum;

  const handleTextChange = (value) => {
    const qualityResult =
      checkTextQuality(value);

    setLocalWarning(
      qualityResult.message
    );

    onChange(
      question.id,
      value
    );
  };

  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <header className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-xl text-primary-600">
          <FaEdit />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Zadanie pisemne {index + 1}
          </p>

          <h3 className="mt-1 break-words text-xl font-bold leading-snug text-gray-900 md:text-2xl">
            {question.question ||
              "Brak treści zadania."}
          </h3>

          {question.instructions && (
            <p className="mt-3 leading-relaxed text-gray-600">
              {question.instructions}
            </p>
          )}
        </div>
      </header>

      {/*
       * Nie wyświetlamy:
       *
       * - example;
       * - expectedAnswer;
       * - sampleAnswer.
       *
       * Są to dane przeznaczone dla systemu oceny lub nauczyciela.
       * Pokazanie ich podczas testu ujawniłoby odpowiedź modelową.
       */}

      <label
        htmlFor={`writing-answer-${question.id}`}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Twoja odpowiedź
      </label>

      <textarea
        id={`writing-answer-${question.id}`}
        value={currentText}
        onChange={(event) =>
          handleTextChange(
            event.target.value
          )
        }
        placeholder="Napisz odpowiedź po angielsku..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        aria-describedby={`writing-information-${question.id}`}
        className={`min-h-[220px] w-full resize-y rounded-2xl border p-5 leading-relaxed transition-colors duration-200 focus:outline-none focus:ring-2 ${
          localWarning
            ? "border-yellow-400 bg-yellow-50/40 focus:ring-yellow-200"
            : "border-gray-300 bg-white focus:border-primary-400 focus:ring-primary-200"
        }`}
      />

      <div
        id={`writing-information-${question.id}`}
        className="mt-4 space-y-3"
      >
        <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
          <span
            className={`font-medium ${
              isBelowMinimum ||
              isAboveMaximum
                ? "text-yellow-700"
                : isWithinRecommendedLength
                  ? "text-green-700"
                  : "text-gray-500"
            }`}
          >
            Liczba słów: {wordCount}

            {minWords > 0 &&
              ` · minimum: ${minWords}`}

            {maxWords > 0 &&
              ` · maksimum: ${maxWords}`}
          </span>

          <span className="inline-flex items-center gap-2 text-gray-500">
            <FaRobot />
            Ocena nastąpi po zakończeniu poziomu.
          </span>
        </div>

        {localWarning && hasText && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800"
          >
            <FaExclamationTriangle className="mt-1 shrink-0" />

            <span>{localWarning}</span>
          </div>
        )}

        {isBelowMinimum && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
            Odpowiedź zawiera mniej słów niż wymagane minimum. Zostanie
            zapisana, ale może zostać uznana za niekompletną i obniżyć wynik.
          </div>
        )}

        {isAboveMaximum && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
            Odpowiedź przekracza zalecaną maksymalną liczbę słów. Skróć tekst,
            zachowując najważniejsze informacje.
          </div>
        )}

        {isWithinRecommendedLength && (
          <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            <FaCheckCircle className="mt-1 shrink-0" />

            <span>
              Odpowiedź spełnia wymagania dotyczące liczby słów.
            </span>
          </div>
        )}

        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm leading-relaxed text-primary-800">
          Odpowiedź zostanie oceniona pod względem realizacji zadania,
          gramatyki, słownictwa, spójności, poprawności zapisu oraz zgodności
          z wymaganym poziomem CEFR. Jeżeli automatyczna ocena nie będzie
          dostępna, wynik zostanie oznaczony jako tymczasowy i przekazany do
          późniejszej weryfikacji.
        </div>
      </div>
    </article>
  );
};

WritingTask.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    question: PropTypes.string,
    prompt: PropTypes.string,
    instructions: PropTypes.string,
    minWords: PropTypes.number,
    maxWords: PropTypes.number
  }).isRequired,

  index: PropTypes.number.isRequired,

  currentText: PropTypes.string.isRequired,

  onChange: PropTypes.func.isRequired
};

const WritingSection = ({
  questions = [],
  answers = {},
  setAnswers
}) => {
  const normalizedQuestions = useMemo(
    () =>
      Array.isArray(questions)
        ? questions
            .filter(Boolean)
            .map(normalizeQuestion)
        : [],
    [questions]
  );

  const writingAnswers =
    answers?.writing &&
    typeof answers.writing === "object" &&
    !Array.isArray(answers.writing)
      ? answers.writing
      : {};

  const handleAnswer = (
    questionId,
    text
  ) => {
    setAnswers((previous) => ({
      ...previous,

      writing: {
        ...(previous?.writing || {}),

        [questionId]: text
      }
    }));
  };

  if (normalizedQuestions.length === 0) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800"
      >
        Brak zadań pisemnych dla tej sekcji.
      </div>
    );
  }

  return (
    <section
      className="space-y-8"
      aria-labelledby="writing-section-title"
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2
          id="writing-section-title"
          className="text-xl font-bold text-blue-900"
        >
          Ocena pisania
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-blue-800 md:text-base">
          Odpowiedz samodzielnie po angielsku. Przestrzegaj limitów słów i
          wykonaj wszystkie elementy polecenia. Nie otrzymasz podpowiedzi ani
          modelowej odpowiedzi podczas testu.
        </p>
      </div>

      {normalizedQuestions.map(
        (question, index) => (
          <WritingTask
            key={question.id}
            question={question}
            index={index}
            currentText={
              typeof writingAnswers[
                question.id
              ] === "string"
                ? writingAnswers[
                    question.id
                  ]
                : ""
            }
            onChange={handleAnswer}
          />
        )
      )}
    </section>
  );
};

WritingSection.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.object
  ),

  answers: PropTypes.shape({
    writing: PropTypes.object
  }),

  setAnswers: PropTypes.func.isRequired
};

export default WritingSection;