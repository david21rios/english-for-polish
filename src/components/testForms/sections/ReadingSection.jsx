// src/components/testForms/sections/ReadingSection.jsx

import { v4 as uuidv4 } from "uuid";
import {
  FaBookReader,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaQuestionCircle,
  FaTrash
} from "react-icons/fa";

const OPTION_LABELS = ["A", "B", "C", "D"];

const createEmptyQuestion = () => ({
  id: uuidv4(),
  question: "",
  options: ["", "", "", ""],
  correctAnswer: ""
});

const createEmptyText = () => ({
  id: uuidv4(),
  text: "",
  questions: []
});

const normalizeOptions = (options = []) => {
  const safeOptions = Array.isArray(options) ? [...options] : [];

  while (safeOptions.length < 4) {
    safeOptions.push("");
  }

  return safeOptions.slice(0, 4);
};

const normalizeQuestion = (question = {}) => ({
  id: question.id || uuidv4(),
  question: question.question || "",
  options: normalizeOptions(question.options),
  correctAnswer: question.correctAnswer || ""
});

const normalizeText = (text = {}) => ({
  id: text.id || uuidv4(),
  text: text.text || "",
  questions: Array.isArray(text.questions)
    ? text.questions.map(normalizeQuestion)
    : []
});

const getWordCount = (value = "") => {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter((word) => word.length > 0).length;
};

const getQuestionStatus = (question) => {
  const normalizedQuestion = normalizeQuestion(question);
  const questionText = normalizedQuestion.question.trim();

  const filledOptions = normalizedQuestion.options.filter((option) =>
    option.trim()
  ).length;

  const hasCorrectAnswer = Boolean(
    normalizedQuestion.correctAnswer.trim()
  );

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

const getTextStatus = (textItem) => {
  const normalizedText = normalizeText(textItem);
  const wordCount = getWordCount(normalizedText.text);

  const readyQuestions = normalizedText.questions.filter(
    (question) => getQuestionStatus(question).status === "ready"
  ).length;

  if (wordCount === 0 && normalizedText.questions.length === 0) {
    return {
      status: "empty",
      label: "Niekompletne",
      className: "bg-gray-100 text-gray-600",
      icon: <FaExclamationTriangle />
    };
  }

  if (
    wordCount < 20 ||
    normalizedText.questions.length === 0 ||
    readyQuestions === 0
  ) {
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

const ReadingSection = ({
  texts = [],
  onChange,
  disabled = false
}) => {
  const safeTexts = Array.isArray(texts) ? texts.map(normalizeText) : [];

  const addText = () => {
    onChange([...safeTexts, createEmptyText()]);
  };

  const updateText = (index, field, value) => {
    const updatedTexts = safeTexts.map((textItem, textIndex) => {
      if (textIndex !== index) return textItem;

      return {
        ...textItem,
        [field]: value
      };
    });

    onChange(updatedTexts);
  };

  const removeText = (index) => {
    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć ten tekst do czytania?"
    );

    if (!confirmDelete) return;

    onChange(safeTexts.filter((_, textIndex) => textIndex !== index));
  };

  const addQuestion = (textIndex) => {
    const updatedTexts = safeTexts.map((textItem, currentTextIndex) => {
      if (currentTextIndex !== textIndex) return textItem;

      return {
        ...textItem,
        questions: [...textItem.questions, createEmptyQuestion()]
      };
    });

    onChange(updatedTexts);
  };

  const updateQuestion = (textIndex, questionIndex, field, value) => {
    const updatedTexts = safeTexts.map((textItem, currentTextIndex) => {
      if (currentTextIndex !== textIndex) return textItem;

      const updatedQuestions = textItem.questions.map(
        (question, currentQuestionIndex) => {
          if (currentQuestionIndex !== questionIndex) return question;

          return {
            ...question,
            [field]: value
          };
        }
      );

      return {
        ...textItem,
        questions: updatedQuestions
      };
    });

    onChange(updatedTexts);
  };

  const updateOption = (textIndex, questionIndex, optionIndex, value) => {
    const updatedTexts = safeTexts.map((textItem, currentTextIndex) => {
      if (currentTextIndex !== textIndex) return textItem;

      const updatedQuestions = textItem.questions.map(
        (question, currentQuestionIndex) => {
          if (currentQuestionIndex !== questionIndex) return question;

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

      return {
        ...textItem,
        questions: updatedQuestions
      };
    });

    onChange(updatedTexts);
  };

  const setCorrectAnswer = (textIndex, questionIndex, optionValue) => {
    if (!optionValue.trim()) return;

    updateQuestion(textIndex, questionIndex, "correctAnswer", optionValue);
  };

  const removeQuestion = (textIndex, questionIndex) => {
    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć to pytanie do tekstu?"
    );

    if (!confirmDelete) return;

    const updatedTexts = safeTexts.map((textItem, currentTextIndex) => {
      if (currentTextIndex !== textIndex) return textItem;

      return {
        ...textItem,
        questions: textItem.questions.filter(
          (_, currentQuestionIndex) =>
            currentQuestionIndex !== questionIndex
        )
      };
    });

    onChange(updatedTexts);
  };

  const totalQuestions = safeTexts.reduce(
    (total, textItem) => total + textItem.questions.length,
    0
  );

  const readyTexts = safeTexts.filter(
    (textItem) => getTextStatus(textItem).status === "ready"
  ).length;

  return (
    <section className="space-y-5">
      <header className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 rounded-3xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-yellow-500 text-white flex items-center justify-center shrink-0">
              <FaBookReader />
            </div>

            <div>
              <p className="text-xs md:text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                Ocena czytania
              </p>

              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                Teksty do czytania
              </h3>

              <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
                Twórz teksty sprawdzające rozumienie czytanego tekstu
                oraz pytania wielokrotnego wyboru. Ta sekcja ocenia
                rozumienie ogólne, szczegóły i słownictwo w kontekście.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addText}
            disabled={disabled}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus />
            Dodaj tekst
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-3">
            <p className="text-xs text-gray-500">Teksty</p>

            <p className="text-2xl font-bold text-gray-900">
              {safeTexts.length}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3">
            <p className="text-xs text-gray-500">Gotowe</p>

            <p className="text-2xl font-bold text-green-700">
              {readyTexts}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3">
            <p className="text-xs text-gray-500">Pytania</p>

            <p className="text-2xl font-bold text-yellow-700">
              {totalQuestions}
            </p>
          </div>
        </div>
      </header>

      {safeTexts.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-3xl mb-4">
            <FaBookReader />
          </div>

          <h4 className="text-xl font-bold text-gray-900">
            Nie ma jeszcze tekstów do czytania
          </h4>

          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Dodaj tekst, a następnie utwórz pytania sprawdzające
            rozumienie czytanego tekstu.
          </p>

          <button
            type="button"
            onClick={addText}
            disabled={disabled}
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 disabled:opacity-50"
          >
            <FaPlus />
            Dodaj pierwszy tekst
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {safeTexts.map((textItem, textIndex) => {
            const textStatus = getTextStatus(textItem);
            const wordCount = getWordCount(textItem.text);

            return (
              <article
                key={textItem.id || textIndex}
                className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
              >
                <div className="bg-gray-50 border-b border-gray-100 px-4 md:px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-yellow-500 text-white flex items-center justify-center font-bold shrink-0">
                        {textIndex + 1}
                      </span>

                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-base md:text-lg">
                          Tekst {textIndex + 1}
                        </h4>

                        <p className="text-xs md:text-sm text-gray-500">
                          {wordCount} słów · {textItem.questions.length} pytań
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${textStatus.className}`}
                      >
                        {textStatus.icon}
                        {textStatus.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeText(textIndex)}
                        disabled={disabled}
                        className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                        title="Usuń tekst"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <span
                    className={`sm:hidden mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${textStatus.className}`}
                  >
                    {textStatus.icon}
                    {textStatus.label}
                  </span>
                </div>

                <div className="p-4 md:p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tekst do czytania
                    </label>

                    <textarea
                      value={textItem.text}
                      onChange={(event) =>
                        updateText(textIndex, "text", event.target.value)
                      }
                      placeholder="Write the reading text here..."
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                      rows="8"
                      disabled={disabled}
                    />

                    <p className="text-xs text-gray-500 mt-2">
                      Rekomendacja: używaj tekstów jasnych, spójnych i
                      odpowiednich dla wybranego poziomu CEFR.
                    </p>
                  </div>

                  <section className="bg-gray-50 border border-gray-100 rounded-3xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-start gap-2">
                        <FaQuestionCircle className="text-yellow-600 mt-1 shrink-0" />

                        <div>
                          <h5 className="font-bold text-gray-900">
                            Pytania do tekstu
                          </h5>

                          <p className="text-xs text-gray-500 mt-1">
                            Każde pytanie powinno mieć odpowiedzi i jedną
                            poprawną opcję.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addQuestion(textIndex)}
                        disabled={disabled}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50"
                      >
                        <FaPlus />
                        Dodaj pytanie
                      </button>
                    </div>

                    {textItem.questions.length === 0 ? (
                      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-5 text-center text-sm text-gray-600">
                        Nie ma jeszcze pytań do tego tekstu.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {textItem.questions.map(
                          (question, questionIndex) => {
                            const questionStatus =
                              getQuestionStatus(question);

                            const options = normalizeOptions(
                              question.options
                            );

                            return (
                              <div
                                key={question.id || questionIndex}
                                className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
                              >
                                <div className="border-b border-gray-100 bg-white px-4 py-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h6 className="font-bold text-gray-900">
                                        Pytanie {questionIndex + 1}
                                      </h6>

                                      <p className="text-xs text-gray-500">
                                        Rozumienie tekstu
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${questionStatus.className}`}
                                      >
                                        {questionStatus.icon}
                                        {questionStatus.label}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeQuestion(
                                            textIndex,
                                            questionIndex
                                          )
                                        }
                                        disabled={disabled}
                                        className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                                        title="Usuń pytanie"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </div>

                                  <span
                                    className={`sm:hidden mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${questionStatus.className}`}
                                  >
                                    {questionStatus.icon}
                                    {questionStatus.label}
                                  </span>
                                </div>

                                <div className="p-4 space-y-4">
                                  <textarea
                                    value={question.question}
                                    onChange={(event) =>
                                      updateQuestion(
                                        textIndex,
                                        questionIndex,
                                        "question",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Write the reading comprehension question here..."
                                    rows="2"
                                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                    disabled={disabled}
                                  />

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
                                                  textIndex,
                                                  questionIndex,
                                                  option
                                                )
                                              }
                                              disabled={
                                                disabled || !option.trim()
                                              }
                                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border shrink-0 transition-all ${
                                                isCorrect
                                                  ? "bg-green-600 border-green-600 text-white"
                                                  : "bg-white border-gray-300 text-gray-600 hover:border-yellow-400"
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
                                                  textIndex,
                                                  questionIndex,
                                                  optionIndex,
                                                  event.target.value
                                                )
                                              }
                                              placeholder={`Opcja ${OPTION_LABELS[optionIndex]}`}
                                              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
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

                                  {!question.correctAnswer && (
                                    <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
                                      <FaExclamationTriangle className="mt-0.5 shrink-0" />

                                      <p>
                                        To pytanie nie ma jeszcze wybranej
                                        poprawnej odpowiedzi.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReadingSection;