// src/components/testForms/sections/WritingSection.jsx

import { v4 as uuidv4 } from "uuid";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaKeyboard,
  FaLightbulb,
  FaPlus,
  FaTags,
  FaTrash
} from "react-icons/fa";

const createEmptyQuestion = () => ({
  id: uuidv4(),
  question: "",
  example: "",
  minWords: 0,
  maxWords: 0,
  evaluationCriteria: [],
  keywordCategories: []
});

const normalizeQuestion = (question = {}) => ({
  id: question.id || uuidv4(),
  question: question.question || "",
  example: question.example || "",
  minWords: Number(question.minWords) || 0,
  maxWords: Number(question.maxWords) || 0,
  evaluationCriteria: Array.isArray(question.evaluationCriteria)
    ? question.evaluationCriteria
    : [],
  keywordCategories: Array.isArray(question.keywordCategories)
    ? question.keywordCategories
    : []
});

const getKeywordsText = (category = {}) => {
  if (typeof category._keywordsRaw === "string") {
    return category._keywordsRaw;
  }

  if (Array.isArray(category.keywords)) {
    return category.keywords.join(", ");
  }

  return "";
};

const getQuestionStatus = (question) => {
  const normalizedQuestion = normalizeQuestion(question);

  const hasPrompt = normalizedQuestion.question.trim().length > 0;
  const hasMinWords = normalizedQuestion.minWords > 0;

  const hasCriteria = normalizedQuestion.evaluationCriteria.some(
    (criteria) => criteria.trim()
  );

  if (!hasPrompt && !hasMinWords && !hasCriteria) {
    return {
      status: "empty",
      label: "Niekompletne",
      className: "bg-gray-100 text-gray-600",
      icon: <FaExclamationTriangle />
    };
  }

  if (!hasPrompt || !hasMinWords || !hasCriteria) {
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

const WritingSection = ({
  questions = [],
  onChange,
  disabled = false
}) => {
  const safeQuestions = Array.isArray(questions)
    ? questions.map(normalizeQuestion)
    : [];

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

  const removeQuestion = (index) => {
    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć to zadanie pisemne?"
    );

    if (!confirmDelete) return;

    onChange(
      safeQuestions.filter(
        (_, questionIndex) => questionIndex !== index
      )
    );
  };

  const addEvaluationCriteria = (questionIndex) => {
    const updatedQuestions = safeQuestions.map(
      (question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;

        return {
          ...question,
          evaluationCriteria: [
            ...question.evaluationCriteria,
            ""
          ]
        };
      }
    );

    onChange(updatedQuestions);
  };

  const updateEvaluationCriteria = (
    questionIndex,
    criteriaIndex,
    value
  ) => {
    const updatedQuestions = safeQuestions.map(
      (question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;

        const updatedCriteria =
          question.evaluationCriteria.map(
            (criteria, currentCriteriaIndex) =>
              currentCriteriaIndex === criteriaIndex
                ? value
                : criteria
          );

        return {
          ...question,
          evaluationCriteria: updatedCriteria
        };
      }
    );

    onChange(updatedQuestions);
  };

  const removeEvaluationCriteria = (
    questionIndex,
    criteriaIndex
  ) => {
    const updatedQuestions = safeQuestions.map(
      (question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;

        return {
          ...question,
          evaluationCriteria:
            question.evaluationCriteria.filter(
              (_, currentCriteriaIndex) =>
                currentCriteriaIndex !== criteriaIndex
            )
        };
      }
    );

    onChange(updatedQuestions);
  };

  const addKeywordCategory = (questionIndex) => {
    const updatedQuestions = safeQuestions.map(
      (question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;

        return {
          ...question,
          keywordCategories: [
            ...question.keywordCategories,
            {
              category: "",
              keywords: [],
              _keywordsRaw: ""
            }
          ]
        };
      }
    );

    onChange(updatedQuestions);
  };

  const updateKeywordCategory = (
    questionIndex,
    categoryIndex,
    field,
    value
  ) => {
    const updatedQuestions = safeQuestions.map(
      (question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;

        const updatedCategories =
          question.keywordCategories.map(
            (category, currentCategoryIndex) => {
              if (currentCategoryIndex !== categoryIndex) {
                return category;
              }

              if (field === "keywords") {
                return {
                  ...category,
                  _keywordsRaw: value,
                  keywords: value
                    .split(",")
                    .map((keyword) => keyword.trim())
                    .filter(Boolean)
                };
              }

              return {
                ...category,
                [field]: value
              };
            }
          );

        return {
          ...question,
          keywordCategories: updatedCategories
        };
      }
    );

    onChange(updatedQuestions);
  };

  const removeKeywordCategory = (
    questionIndex,
    categoryIndex
  ) => {
    const updatedQuestions = safeQuestions.map(
      (question, currentIndex) => {
        if (currentIndex !== questionIndex) return question;

        return {
          ...question,
          keywordCategories:
            question.keywordCategories.filter(
              (_, currentCategoryIndex) =>
                currentCategoryIndex !== categoryIndex
            )
        };
      }
    );

    onChange(updatedQuestions);
  };

  const readyQuestions = safeQuestions.filter(
    (question) =>
      getQuestionStatus(question).status === "ready"
  ).length;

  return (
    <section className="space-y-5">
      <header className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-3xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center shrink-0">
              <FaKeyboard />
            </div>

            <div>
              <p className="text-xs md:text-sm font-semibold text-green-700 uppercase tracking-wide">
                Ocena pisania
              </p>

              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                Zadania pisemne
              </h3>

              <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
                Twórz zadania sprawdzające umiejętność pisania,
                określ kryteria oceny, sugerowaną liczbę słów oraz
                kategorie kluczowego słownictwa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            disabled={disabled}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus />
            Dodaj zadanie
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-3">
            <p className="text-xs text-gray-500">
              Łącznie
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {safeQuestions.length}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3">
            <p className="text-xs text-gray-500">
              Gotowe
            </p>

            <p className="text-2xl font-bold text-green-700">
              {readyQuestions}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500">
              Wymagane
            </p>

            <p className="text-sm font-semibold text-gray-900 mt-1">
              Zadanie + minimalna liczba słów + co najmniej
              1 kryterium
            </p>
          </div>
        </div>
      </header>

      {safeQuestions.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-3xl mb-4">
            <FaKeyboard />
          </div>

          <h4 className="text-xl font-bold text-gray-900">
            Nie ma jeszcze żadnych zadań pisemnych
          </h4>

          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Dodaj pierwsze zadanie, aby ocenić umiejętność
            pisania, słownictwo, spójność i gramatykę.
          </p>

          <button
            type="button"
            onClick={addQuestion}
            disabled={disabled}
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            <FaPlus />
            Dodaj pierwsze zadanie
          </button>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {safeQuestions.map(
            (question, questionIndex) => {
              const status = getQuestionStatus(question);

              return (
                <article
                  key={question.id || questionIndex}
                  className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
                >
                  <div className="bg-gray-50 border-b border-gray-100 px-4 md:px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center font-bold shrink-0">
                          {questionIndex + 1}
                        </span>

                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-base md:text-lg">
                            Zadanie pisemne{" "}
                            {questionIndex + 1}
                          </h4>

                          <p className="text-xs md:text-sm text-gray-500">
                            Polecenie, przykład, liczba słów
                            i kryteria oceny.
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
                          onClick={() =>
                            removeQuestion(questionIndex)
                          }
                          disabled={disabled}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                          title="Usuń zadanie"
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
                        Treść zadania
                      </label>

                      <textarea
                        value={question.question}
                        onChange={(event) =>
                          updateQuestion(
                            questionIndex,
                            "question",
                            event.target.value
                          )
                        }
                        placeholder="Przykład: Write a short email introducing yourself to a new classmate."
                        rows="3"
                        className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        disabled={disabled}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Przykład oczekiwanej odpowiedzi
                      </label>

                      <textarea
                        value={question.example}
                        onChange={(event) =>
                          updateQuestion(
                            questionIndex,
                            "example",
                            event.target.value
                          )
                        }
                        placeholder="Przykładowa odpowiedź dla osoby oceniającej lub do testów wewnętrznych."
                        rows="3"
                        className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        disabled={disabled}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Minimalna liczba słów
                        </label>

                        <input
                          type="number"
                          value={question.minWords}
                          onChange={(event) =>
                            updateQuestion(
                              questionIndex,
                              "minWords",
                              Number(event.target.value) || 0
                            )
                          }
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                          min="0"
                          disabled={disabled}
                        />
                      </div>

                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Maksymalna liczba słów
                        </label>

                        <input
                          type="number"
                          value={question.maxWords}
                          onChange={(event) =>
                            updateQuestion(
                              questionIndex,
                              "maxWords",
                              Number(event.target.value) || 0
                            )
                          }
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                          min="0"
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                      <div className="flex items-start gap-2">
                        <FaLightbulb className="text-blue-600 mt-1 shrink-0" />

                        <p className="text-sm text-blue-800 leading-relaxed">
                          W przyszłej wersji kryteria te będą mogły
                          zostać wykorzystane przez AI do oceny
                          spójności, gramatyki, słownictwa,
                          realizacji zadania oraz poziomu CEFR.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h5 className="font-bold text-gray-900">
                          Kryteria oceny
                        </h5>

                        <button
                          type="button"
                          onClick={() =>
                            addEvaluationCriteria(
                              questionIndex
                            )
                          }
                          disabled={disabled}
                          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
                        >
                          <FaPlus />
                          Dodaj kryterium
                        </button>
                      </div>

                      {question.evaluationCriteria.length ===
                      0 ? (
                        <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
                          <FaExclamationTriangle className="mt-0.5 shrink-0" />

                          <p>
                            Dodaj co najmniej jedno kryterium,
                            aby zadanie było kompletne.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {question.evaluationCriteria.map(
                            (criteria, criteriaIndex) => (
                              <div
                                key={criteriaIndex}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  value={criteria}
                                  onChange={(event) =>
                                    updateEvaluationCriteria(
                                      questionIndex,
                                      criteriaIndex,
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder="Przykład: Uses complete sentences."
                                  disabled={disabled}
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeEvaluationCriteria(
                                      questionIndex,
                                      criteriaIndex
                                    )
                                  }
                                  disabled={disabled}
                                  className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center shrink-0 disabled:opacity-50"
                                  title="Usuń kryterium"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-gray-900">
                            Kategorie słów kluczowych
                          </h5>

                          <p className="text-xs text-gray-500 mt-1">
                            Pomocne przy ocenie oczekiwanego
                            słownictwa.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addKeywordCategory(questionIndex)
                          }
                          disabled={disabled}
                          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
                        >
                          <FaPlus />
                          Dodaj kategorię
                        </button>
                      </div>

                      {question.keywordCategories.length ===
                      0 ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-600 flex items-start gap-2">
                          <FaTags className="mt-0.5 shrink-0 text-gray-400" />

                          <p>
                            Nie ma kategorii słów kluczowych.
                            Na tym etapie są one opcjonalne.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {question.keywordCategories.map(
                            (category, categoryIndex) => (
                              <div
                                key={categoryIndex}
                                className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={
                                      category.category || ""
                                    }
                                    onChange={(event) =>
                                      updateKeywordCategory(
                                        questionIndex,
                                        categoryIndex,
                                        "category",
                                        event.target.value
                                      )
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    placeholder="Przykład: Family vocabulary"
                                    disabled={disabled}
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeKeywordCategory(
                                        questionIndex,
                                        categoryIndex
                                      )
                                    }
                                    disabled={disabled}
                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center shrink-0 disabled:opacity-50"
                                    title="Usuń kategorię"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>

                                <textarea
                                  value={getKeywordsText(
                                    category
                                  )}
                                  onChange={(event) =>
                                    updateKeywordCategory(
                                      questionIndex,
                                      categoryIndex,
                                      "keywords",
                                      event.target.value
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none"
                                  placeholder="father, mother, sister, brother..."
                                  rows="2"
                                  disabled={disabled}
                                />
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
};

export default WritingSection;