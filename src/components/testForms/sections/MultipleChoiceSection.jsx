// src/components/testForms/sections/MultipleChoiceSection.jsx

import { v4 as uuidv4 } from "uuid";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaListOl,
  FaPlus,
  FaTrash
} from "react-icons/fa";

const OPTION_LABELS = ["A", "B", "C", "D"];

const createEmptyQuestion = () => ({
  id: uuidv4(),
  question: "",
  options: ["", "", "", ""],
  correctAnswer: ""
});

const normalizeOptions = (options = []) => {
  const safeOptions = Array.isArray(options) ? [...options] : [];

  while (safeOptions.length < 4) {
    safeOptions.push("");
  }

  return safeOptions.slice(0, 4);
};

const getQuestionStatus = (question) => {
  const questionText = question?.question?.trim() || "";
  const options = normalizeOptions(question?.options);
  const filledOptions = options.filter((option) => option.trim()).length;
  const hasCorrectAnswer = Boolean(question?.correctAnswer?.trim());

  if (!questionText && filledOptions === 0 && !hasCorrectAnswer) {
    return {
      status: "empty",
      label: "Niekompletne",
      className: "bg-gray-100 text-gray-600",
      icon: <FaExclamationTriangle />
    };
  }

  if (!questionText || filledOptions < 2 || !hasCorrectAnswer) {
    return {
      status: "warning",
      label: "Wymaga sprawdzenia",
      className: "bg-yellow-100 text-yellow-700",
      icon: <FaExclamationTriangle />
    };
  }

  return {
    status: "ready",
    label: "Gotowe",
    className: "bg-green-100 text-green-700",
    icon: <FaCheckCircle />
  };
};

const MultipleChoiceSection = ({
  questions = [],
  onChange,
  disabled = false
}) => {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const addQuestion = () => {
    onChange([...safeQuestions, createEmptyQuestion()]);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = safeQuestions.map(
      (question, questionIndex) => {
        if (questionIndex !== index) return question;

        return {
          ...question,
          [field]: value
        };
      }
    );

    onChange(updatedQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = safeQuestions.map(
      (question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;

        const currentOptions = normalizeOptions(question.options);
        const previousOptionValue = currentOptions[optionIndex];

        const updatedOptions = currentOptions.map(
          (option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? value : option
        );

        const shouldClearCorrectAnswer =
          question.correctAnswer === previousOptionValue &&
          value.trim() === "";

        const shouldSyncCorrectAnswer =
          question.correctAnswer === previousOptionValue &&
          value.trim() !== "";

        return {
          ...question,
          options: updatedOptions,
          correctAnswer: shouldClearCorrectAnswer
            ? ""
            : shouldSyncCorrectAnswer
              ? value
              : question.correctAnswer
        };
      }
    );

    onChange(updatedQuestions);
  };

  const setCorrectAnswer = (questionIndex, optionValue) => {
    if (!optionValue.trim()) return;

    updateQuestion(questionIndex, "correctAnswer", optionValue);
  };

  const removeQuestion = (index) => {
    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć to pytanie wielokrotnego wyboru?"
    );

    if (!confirmDelete) return;

    onChange(
      safeQuestions.filter(
        (_, questionIndex) => questionIndex !== index
      )
    );
  };

  const readyQuestions = safeQuestions.filter(
    (question) => getQuestionStatus(question).status === "ready"
  ).length;

  return (
    <section className="space-y-5">
      <header className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-3xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0">
              <FaListOl />
            </div>

            <div>
              <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Wielokrotny wybór
              </p>

              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                Pytania wielokrotnego wyboru
              </h3>

              <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
                Twórz pytania z czterema opcjami odpowiedzi i oznacz
                jedną poprawną odpowiedź. Ten typ pytań jest odpowiedni
                do sprawdzania gramatyki, słownictwa, rozumienia i
                praktycznego użycia języka.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            disabled={disabled}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus />
            Dodaj pytanie
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-3">
            <p className="text-xs text-gray-500">Łącznie</p>

            <p className="text-2xl font-bold text-gray-900">
              {safeQuestions.length}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3">
            <p className="text-xs text-gray-500">Gotowe</p>

            <p className="text-2xl font-bold text-green-700">
              {readyQuestions}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500">Wymagane</p>

            <p className="text-sm font-semibold text-gray-900 mt-1">
              Pytanie + co najmniej 2 opcje + poprawna odpowiedź
            </p>
          </div>
        </div>
      </header>

      {safeQuestions.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-3xl mb-4">
            <FaListOl />
          </div>

          <h4 className="text-xl font-bold text-gray-900">
            Nie ma jeszcze żadnych pytań
          </h4>

          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Dodaj pierwsze pytanie, aby rozpocząć tworzenie tej sekcji
            testu.
          </p>

          <button
            type="button"
            onClick={addQuestion}
            disabled={disabled}
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            <FaPlus />
            Dodaj pierwsze pytanie
          </button>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {safeQuestions.map((question, questionIndex) => {
            const status = getQuestionStatus(question);
            const options = normalizeOptions(question.options);

            return (
              <article
                key={question.id || questionIndex}
                className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
              >
                <div className="bg-gray-50 border-b border-gray-100 px-4 md:px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold shrink-0">
                        {questionIndex + 1}
                      </span>

                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-base md:text-lg">
                          Pytanie {questionIndex + 1}
                        </h4>

                        <p className="text-xs md:text-sm text-gray-500">
                          Zdefiniuj treść pytania, opcje odpowiedzi i
                          poprawną odpowiedź.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        disabled={disabled}
                        className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                        title="Usuń pytanie"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <span
                    className={`sm:hidden mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <div className="p-4 md:p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Treść pytania
                    </label>

                    <textarea
                      value={question.question || ""}
                      onChange={(event) =>
                        updateQuestion(
                          questionIndex,
                          "question",
                          event.target.value
                        )
                      }
                      placeholder="Przykład: Choose the correct sentence."
                      rows="3"
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Opcje odpowiedzi
                      </label>

                      <p className="text-xs text-gray-500">
                        Oznacz poprawną odpowiedź, klikając odpowiednią
                        literę.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {options.map((option, optionIndex) => {
                        const isCorrect =
                          question.correctAnswer &&
                          question.correctAnswer === option &&
                          option.trim();

                        return (
                          <div
                            key={`${question.id}-${optionIndex}`}
                            className={`rounded-2xl border p-3 transition-all ${
                              isCorrect
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setCorrectAnswer(
                                    questionIndex,
                                    option
                                  )
                                }
                                disabled={disabled || !option.trim()}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border shrink-0 transition-all ${
                                  isCorrect
                                    ? "bg-green-600 border-green-600 text-white"
                                    : "bg-white border-gray-300 text-gray-600 hover:border-primary-400"
                                } ${
                                  disabled || !option.trim()
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                                }`}
                                title="Oznacz jako poprawną odpowiedź"
                              >
                                {OPTION_LABELS[optionIndex]}
                              </button>

                              <input
                                type="text"
                                value={option}
                                onChange={(event) =>
                                  updateOption(
                                    questionIndex,
                                    optionIndex,
                                    event.target.value
                                  )
                                }
                                placeholder={`Opcja ${OPTION_LABELS[optionIndex]}`}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                disabled={disabled}
                              />
                            </div>

                            {isCorrect && (
                              <p className="mt-2 text-xs font-semibold text-green-700 inline-flex items-center gap-1">
                                <FaCheckCircle />
                                Poprawna odpowiedź
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!question.correctAnswer && (
                    <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
                      <FaExclamationTriangle className="mt-0.5 shrink-0" />

                      <p>
                        To pytanie nie ma jeszcze wybranej poprawnej
                        odpowiedzi.
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MultipleChoiceSection;