// src/components/test/TestQuestion.jsx

import { useMemo, useState } from "react";
import {
  FaBookOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaKeyboard,
  FaListUl,
  FaRobot
} from "react-icons/fa";

const VALID_SHORT_ENGLISH_WORDS = new Set([
  "a",
  "i",
  "am",
  "an",
  "as",
  "at",
  "be",
  "by",
  "do",
  "go",
  "he",
  "if",
  "in",
  "is",
  "it",
  "me",
  "my",
  "no",
  "of",
  "on",
  "or",
  "so",
  "to",
  "up",
  "us",
  "we"
]);

const countWords = (text = "") => {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

const cleanWord = (word = "") => {
  return word
    .replace(/[.,;:!?'"0-9()[\]{}]/g, "")
    .trim()
    .toLowerCase();
};

const isValidEnglishWordPattern = (word = "") => {
  const cleanedWord = cleanWord(word);

  if (!cleanedWord) return true;

  if (VALID_SHORT_ENGLISH_WORDS.has(cleanedWord)) {
    return true;
  }

  const hasVowel = /[aeiouy]/i.test(cleanedWord);
  const hasLongConsonantSequence =
    cleanedWord.length >= 5 &&
    /[bcdfghjklmnpqrstvwxz]{5,}/i.test(cleanedWord);

  const hasRepeatedChars = /(.)\1{3,}/i.test(cleanedWord);

  if (!hasVowel) return false;
  if (hasLongConsonantSequence) return false;
  if (hasRepeatedChars) return false;

  return true;
};

const checkTextValidity = (text = "") => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return {
      isValid: true,
      error: null
    };
  }

  if (/\s{3,}/.test(text)) {
    return {
      isValid: false,
      error: "Wykryto zbyt wiele kolejnych spacji."
    };
  }

  const words = trimmedText.split(/\s+/);

  const invalidWords = words.filter(
    (word) => !isValidEnglishWordPattern(word)
  );

  if (invalidWords.length > 0) {
    return {
      isValid: false,
      error: `Wykryto możliwe nieprawidłowe słowa: ${invalidWords.join(", ")}`
    };
  }

  return {
    isValid: true,
    error: null
  };
};

const QuestionHeader = ({ icon, index, title, subtitle }) => {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Pytanie {index + 1}
        </p>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 leading-snug break-words">
          {title}
        </h3>

        {subtitle && (
          <p className="text-gray-600 mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

const OptionButton = ({
  option,
  selected,
  onClick,
  optionIndex
}) => {
  const optionLetter = String.fromCharCode(65 + optionIndex);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border px-5 py-4 transition-all flex items-start gap-4 ${
        selected
          ? "bg-primary-600 text-white border-primary-600 shadow-md"
          : "bg-gray-50 text-gray-800 border-gray-100 hover:bg-primary-50 hover:border-primary-200"
      }`}
    >
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
          selected
            ? "bg-white text-primary-600"
            : "bg-white text-gray-600 border border-gray-200"
        }`}
      >
        {optionLetter}
      </span>

      <span className="leading-relaxed break-words min-w-0">
        {option}
      </span>

      {selected && (
        <FaCheckCircle className="ml-auto mt-1 shrink-0" />
      )}
    </button>
  );
};

const TestQuestion = ({
  questionData,
  index,
  selectedAnswer,
  onSelectAnswer,
  type
}) => {
  const [localError, setLocalError] = useState(null);

  if (!questionData) {
    return (
      <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
        <FaExclamationTriangle />
        Pytanie jest niedostępne.
      </div>
    );
  }

  const questionId =
    questionData.id || `${type || "question"}_${index}`;

  const questionText =
    questionData.question || "Brak treści pytania.";

  const options = Array.isArray(questionData.options)
    ? questionData.options
    : [];

  const currentText =
    typeof selectedAnswer === "string"
      ? selectedAnswer
      : "";

  const wordCount = useMemo(
    () => countWords(currentText),
    [currentText]
  );

  const handleTextChange = (text) => {
    const validation = checkTextValidity(text);

    setLocalError(validation.error);
    onSelectAnswer(questionId, text);
  };

  if (type === "multipleChoice") {
    return (
      <article className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <QuestionHeader
          icon={<FaListUl />}
          index={index}
          title={questionText}
          subtitle="Wybierz poprawną odpowiedź."
        />

        {options.length === 0 ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center gap-3">
            <FaExclamationTriangle />
            To pytanie nie ma skonfigurowanych odpowiedzi.
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((option, optionIndex) => (
              <OptionButton
                key={`${questionId}_${optionIndex}`}
                option={option}
                optionIndex={optionIndex}
                selected={selectedAnswer === option}
                onClick={() =>
                  onSelectAnswer(questionId, option)
                }
              />
            ))}
          </div>
        )}
      </article>
    );
  }

  if (type === "writing") {
    const minWords = Number(questionData.minWords) || 0;
    const maxWords = Number(questionData.maxWords) || 0;

    const showMinWordsWarning =
      Boolean(currentText.trim()) &&
      minWords > 0 &&
      wordCount < minWords;

    const showMaxWordsWarning =
      Boolean(currentText.trim()) &&
      maxWords > 0 &&
      wordCount > maxWords;

    return (
      <article className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <QuestionHeader
          icon={<FaKeyboard />}
          index={index}
          title={questionText}
          subtitle="Napisz pełną odpowiedź w języku angielskim. Odpowiedź zostanie oceniona po zakończeniu testu."
        />

        {questionData.example && (
          <div className="mb-5 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800">
            <strong>Przykład:</strong>{" "}
            {questionData.example}
          </div>
        )}

        <textarea
          className={`w-full p-5 border rounded-2xl min-h-[180px] transition-colors duration-200 resize-y focus:outline-none focus:ring-2 ${
            localError
              ? "border-red-500 bg-red-50 focus:ring-red-200"
              : "border-gray-300 focus:ring-primary-200"
          }`}
          value={currentText}
          onChange={(event) =>
            handleTextChange(event.target.value)
          }
          placeholder="Napisz odpowiedź po angielsku..."
          autoComplete="off"
          spellCheck={false}
        />

        <div className="mt-4 space-y-3">
          <div className="flex flex-col md:flex-row md:justify-between gap-2 text-sm">
            <span
              className={
                showMinWordsWarning || showMaxWordsWarning
                  ? "text-yellow-700"
                  : "text-gray-500"
              }
            >
              Liczba słów: {wordCount}
              {minWords > 0 && ` · minimum: ${minWords}`}
              {maxWords > 0 && ` · maksimum: ${maxWords}`}
            </span>

            <span className="inline-flex items-center gap-2 text-gray-500">
              <FaRobot />
              Odpowiedź zostanie oceniona po wysłaniu testu.
            </span>
          </div>

          {localError && currentText.trim() && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-medium flex items-start gap-3">
              <FaExclamationTriangle className="mt-1 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {showMinWordsWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm font-medium">
              Odpowiedź zawiera mniej słów niż wymagane minimum.
              Możesz kontynuować, ale odpowiedź może zostać uznana
              za niekompletną.
            </div>
          )}

          {showMaxWordsWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm font-medium">
              Odpowiedź przekracza zalecaną maksymalną liczbę słów.
            </div>
          )}

          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-sm text-primary-800">
            Twoja odpowiedź jest zapisywana do końcowej oceny.
            Wynik nie jest obliczany na tym etapie, aby uniknąć
            nieprecyzyjnej informacji zwrotnej.
          </div>
        </div>
      </article>
    );
  }

  if (type === "reading") {
    const readingQuestions = Array.isArray(questionData.questions)
      ? questionData.questions
      : [];

    return (
      <article className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <QuestionHeader
          icon={<FaBookOpen />}
          index={index}
          title="Tekst do czytania"
          subtitle="Przeczytaj uważnie tekst i odpowiedz na pytania."
        />

        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
            {questionData.text ||
              "Tekst do czytania jest niedostępny."}
          </p>
        </div>

        {readingQuestions.length === 0 ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center gap-3">
            <FaExclamationTriangle />
            Ten tekst nie ma skonfigurowanych pytań.
          </div>
        ) : (
          <div className="space-y-6">
            {readingQuestions.map(
              (question, questionIndex) => {
                const readingOptions = Array.isArray(
                  question.options
                )
                  ? question.options
                  : [];

                const readingQuestionId =
                  question.id ||
                  `${questionId}_reading_${questionIndex}`;

                return (
                  <div
                    key={readingQuestionId}
                    className="bg-white border border-gray-100 rounded-2xl p-5"
                  >
                    <p className="font-bold text-gray-900 mb-4">
                      {index + 1}.{questionIndex + 1}{" "}
                      {question.question ||
                        "Brak treści pytania."}
                    </p>

                    {readingOptions.length === 0 ? (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
                        To pytanie nie ma skonfigurowanych odpowiedzi.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {readingOptions.map(
                          (option, optionIndex) => (
                            <OptionButton
                              key={`${readingQuestionId}_${optionIndex}`}
                              option={option}
                              optionIndex={optionIndex}
                              selected={
                                selectedAnswer?.[
                                  readingQuestionId
                                ] === option
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
  }

  return (
    <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
      <FaExclamationTriangle />
      Nieobsługiwany typ pytania.
    </div>
  );
};

export default TestQuestion;