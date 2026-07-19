// src/components/test/TestQuestion.jsx

import { useMemo, useState } from "react";
import PropTypes from "prop-types";

import {
  FaBookOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaKeyboard,
  FaListUl,
  FaRobot
} from "react-icons/fa";

const SUPPORTED_TYPES = new Set([
  "multipleChoice",
  "writing",
  "reading"
]);

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
        "W odpowiedzi jedno słowo powtarza się bardzo często. Sprawdź, czy tekst jest kompletny."
    };
  }

  return {
    status: "valid",
    message: null
  };
};

const QuestionHeader = ({
  icon,
  index,
  title,
  subtitle
}) => {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-xl text-primary-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          Pytanie {index + 1}
        </p>

        <h3 className="mt-1 break-words text-xl font-bold leading-snug text-gray-900 md:text-2xl">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-2 leading-relaxed text-gray-600">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

QuestionHeader.propTypes = {
  icon: PropTypes.node.isRequired,
  index: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string
};

const OptionButton = ({
  option,
  selected,
  onClick,
  optionIndex,
  questionId
}) => {
  const optionLetter = String.fromCharCode(
    65 + optionIndex
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Odpowiedź ${optionLetter}: ${option}`}
      className={`flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 ${
        selected
          ? "border-primary-600 bg-primary-600 text-white shadow-md"
          : "border-gray-100 bg-gray-50 text-gray-800 hover:border-primary-200 hover:bg-primary-50"
      }`}
      data-question-id={questionId}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
          selected
            ? "bg-white text-primary-600"
            : "border border-gray-200 bg-white text-gray-600"
        }`}
      >
        {optionLetter}
      </span>

      <span className="min-w-0 break-words leading-relaxed">
        {option || "Odpowiedź jest niedostępna."}
      </span>

      {selected && (
        <FaCheckCircle className="ml-auto mt-1 shrink-0" />
      )}
    </button>
  );
};

OptionButton.propTypes = {
  option: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  optionIndex: PropTypes.number.isRequired,
  questionId: PropTypes.string.isRequired
};

const TestQuestion = ({
  questionData,
  index,
  selectedAnswer,
  onSelectAnswer,
  type
}) => {
  const [localWarning, setLocalWarning] =
    useState(null);

  const safeQuestionData =
    questionData &&
    typeof questionData === "object"
      ? questionData
      : {};

  const questionId =
    safeQuestionData.id ||
    `${type || "question"}_${index}`;

  const questionText =
    safeQuestionData.question ||
    safeQuestionData.prompt ||
    "Brak treści pytania.";

  const options = Array.isArray(
    safeQuestionData.options
  )
    ? safeQuestionData.options.filter(
        (option) =>
          option !== null &&
          option !== undefined
      )
    : [];

  const currentText =
    typeof selectedAnswer === "string"
      ? selectedAnswer
      : "";

  const wordCount = useMemo(
    () => countWords(currentText),
    [currentText]
  );

  if (!questionData) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
      >
        <FaExclamationTriangle />
        Pytanie jest niedostępne.
      </div>
    );
  }

  if (!SUPPORTED_TYPES.has(type)) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
      >
        <FaExclamationTriangle />
        Nieobsługiwany typ pytania.
      </div>
    );
  }

  const handleTextChange = (value) => {
    const qualityResult =
      checkTextQuality(value);

    setLocalWarning(
      qualityResult.message
    );

    onSelectAnswer(
      questionId,
      value
    );
  };

  if (type === "multipleChoice") {
    return (
      <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <QuestionHeader
          icon={<FaListUl />}
          index={index}
          title={questionText}
          subtitle={
            safeQuestionData.instructions ||
            "Wybierz jedną poprawną odpowiedź."
          }
        />

        {options.length === 0 ? (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <FaExclamationTriangle />
            To pytanie nie ma skonfigurowanych odpowiedzi.
          </div>
        ) : (
          <div className="space-y-3">
            {options.map(
              (option, optionIndex) => (
                <OptionButton
                  key={`${questionId}_${optionIndex}`}
                  questionId={questionId}
                  option={String(option)}
                  optionIndex={optionIndex}
                  selected={
                    selectedAnswer === option
                  }
                  onClick={() =>
                    onSelectAnswer(
                      questionId,
                      option
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </article>
    );
  }

  if (type === "writing") {
    const minWords =
      Number(
        safeQuestionData.minWords
      ) || 0;

    const maxWords =
      Number(
        safeQuestionData.maxWords
      ) || 0;

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

    return (
      <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <QuestionHeader
          icon={<FaKeyboard />}
          index={index}
          title={questionText}
          subtitle={
            safeQuestionData.instructions ||
            "Napisz samodzielną odpowiedź w języku angielskim."
          }
        />

        {/*
         * Nie pokazujemy pola example / expectedAnswer.
         *
         * Jest ono przeznaczone dla evaluatorów i wyświetlenie go
         * podczas Placement Testu ujawniłoby modelową odpowiedź.
         */}

        <textarea
          id={`writing-answer-${questionId}`}
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
          aria-describedby={`writing-info-${questionId}`}
          className={`min-h-[220px] w-full resize-y rounded-2xl border p-5 leading-relaxed transition-colors duration-200 focus:outline-none focus:ring-2 ${
            localWarning
              ? "border-yellow-400 bg-yellow-50/40 focus:ring-yellow-200"
              : "border-gray-300 bg-white focus:border-primary-400 focus:ring-primary-200"
          }`}
        />

        <div
          id={`writing-info-${questionId}`}
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
              Ocena zostanie wykonana po zakończeniu poziomu.
            </span>
          </div>

          {localWarning &&
            hasText && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800"
              >
                <FaExclamationTriangle className="mt-1 shrink-0" />

                <span>
                  {localWarning}
                </span>
              </div>
            )}

          {isBelowMinimum && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
              Odpowiedź zawiera mniej słów niż wymagane minimum. Możesz ją
              zapisać, ale zostanie potraktowana jako niekompletna i może
              obniżyć wynik.
            </div>
          )}

          {isAboveMaximum && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
              Odpowiedź przekracza zalecaną maksymalną liczbę słów. Skróć tekst,
              zachowując najważniejsze informacje.
            </div>
          )}

          {isWithinRecommendedLength && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
              Odpowiedź spełnia wymagania dotyczące liczby słów.
            </div>
          )}

          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm leading-relaxed text-primary-800">
            Odpowiedź zostanie oceniona pod względem realizacji zadania,
            gramatyki, słownictwa, spójności, poprawności zapisu i zgodności z
            wymaganym poziomem CEFR. Jeżeli automatyczna ocena nie będzie
            dostępna, wynik części pisemnej zostanie oznaczony jako tymczasowy.
          </div>
        </div>
      </article>
    );
  }

  /*
   * Aktualny TestSectionRenderer przekazuje teksty czytania bezpośrednio
   * do ReadingSection. Ten blok pozostaje jako warstwa zgodności dla
   * innych przepływów, które mogą używać TestQuestion dla Reading.
   */
  const readingQuestions =
    Array.isArray(
      safeQuestionData.questions
    )
      ? safeQuestionData.questions
      : [];

  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <QuestionHeader
        icon={<FaBookOpen />}
        index={index}
        title={
          safeQuestionData.title ||
          "Tekst do czytania"
        }
        subtitle="Przeczytaj uważnie tekst i odpowiedz na pytania."
      />

      <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <p className="whitespace-pre-line text-lg leading-relaxed text-gray-800">
          {safeQuestionData.text ||
            "Tekst do czytania jest niedostępny."}
        </p>
      </div>

      {readingQuestions.length === 0 ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <FaExclamationTriangle />
          Ten tekst nie ma skonfigurowanych pytań.
        </div>
      ) : (
        <div className="space-y-6">
          {readingQuestions.map(
            (
              readingQuestion,
              questionIndex
            ) => {
              const readingOptions =
                Array.isArray(
                  readingQuestion.options
                )
                  ? readingQuestion.options
                  : [];

              const readingQuestionId =
                readingQuestion.id ||
                `${questionId}_reading_${questionIndex}`;

              const readingSelectedAnswer =
                selectedAnswer &&
                typeof selectedAnswer ===
                  "object"
                  ? selectedAnswer[
                      readingQuestionId
                    ]
                  : "";

              return (
                <div
                  key={readingQuestionId}
                  className="rounded-2xl border border-gray-100 bg-white p-5"
                >
                  <p className="mb-4 font-bold text-gray-900">
                    {index + 1}.
                    {questionIndex + 1}{" "}
                    {readingQuestion.question ||
                      "Brak treści pytania."}
                  </p>

                  {readingOptions.length ===
                  0 ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      To pytanie nie ma skonfigurowanych odpowiedzi.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {readingOptions.map(
                        (
                          option,
                          optionIndex
                        ) => (
                          <OptionButton
                            key={`${readingQuestionId}_${optionIndex}`}
                            questionId={
                              readingQuestionId
                            }
                            option={String(
                              option
                            )}
                            optionIndex={
                              optionIndex
                            }
                            selected={
                              readingSelectedAnswer ===
                              option
                            }
                            onClick={() =>
                              onSelectAnswer(
                                readingQuestionId,
                                option
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </article>
  );
};

TestQuestion.propTypes = {
  questionData: PropTypes.object,

  index: PropTypes.number.isRequired,

  selectedAnswer: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),

  onSelectAnswer:
    PropTypes.func.isRequired,

  type: PropTypes.oneOf([
    "multipleChoice",
    "writing",
    "reading"
  ]).isRequired
};

export default TestQuestion;