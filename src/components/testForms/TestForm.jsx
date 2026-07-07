// src/components/testForms/TestForm.jsx

import { useState, useCallback, useEffect } from "react";
import {
  FaBookOpen,
  FaCheckCircle,
  FaClipboardList,
  FaEdit,
  FaLayerGroup,
  FaSave,
  FaTimes
} from "react-icons/fa";

import MultipleChoiceSection from "./sections/MultipleChoiceSection";
import WritingSection from "./sections/WritingSection";
import ReadingSection from "./sections/ReadingSection";

const INITIAL_STATE = {
  level: "",
  sections: {
    multipleChoice: { questions: [] },
    writing: { questions: [] },
    reading: { texts: [] }
  }
};

const LEVELS = [
  { id: "A1", title: "A1", description: "Początkujący" },
  { id: "A2", title: "A2", description: "Podstawowy" },
  { id: "B1", title: "B1", description: "Średni" },
  { id: "B2", title: "B2", description: "Wyższy średni" },
  { id: "C1", title: "C1", description: "Zaawansowany" },
  { id: "C2", title: "C2", description: "Biegły" }
];

const SECTIONS = [
  {
    id: "multipleChoice",
    label: "Wielokrotny wybór",
    shortLabel: "Wybór",
    icon: <FaClipboardList />
  },
  {
    id: "writing",
    label: "Pisanie",
    shortLabel: "Pisanie",
    icon: <FaEdit />
  },
  {
    id: "reading",
    label: "Czytanie",
    shortLabel: "Czytanie",
    icon: <FaBookOpen />
  }
];

const normalizeInitialData = (data) => ({
  ...INITIAL_STATE,
  ...data,
  sections: {
    multipleChoice: data?.sections?.multipleChoice || { questions: [] },
    writing: data?.sections?.writing || { questions: [] },
    reading: data?.sections?.reading || { texts: [] }
  }
});

const getSectionStatus = (sectionId, testData) => {
  if (sectionId === "multipleChoice") {
    return testData.sections?.multipleChoice?.questions?.length || 0;
  }

  if (sectionId === "writing") {
    return testData.sections?.writing?.questions?.length || 0;
  }

  if (sectionId === "reading") {
    return testData.sections?.reading?.texts?.length || 0;
  }

  return 0;
};

const TestForm = ({ initialData = null, onSubmit, onCancel, isSaving }) => {
  const [testData, setTestData] = useState(INITIAL_STATE);
  const [activeSection, setActiveSection] = useState("multipleChoice");
  const [error, setError] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTestData(normalizeInitialData(initialData));
    } else {
      setTestData(INITIAL_STATE);
    }

    setError(null);
    setHasSubmitted(false);
  }, [initialData]);

  const validateTestData = () => {
    if (!testData.level) {
      return "Musisz wybrać poziom testu.";
    }

    const validLevels = LEVELS.map((level) => level.id);

    if (!validLevels.includes(testData.level)) {
      return "Wybrany poziom nie jest prawidłowy.";
    }

    const multipleChoiceQuestions =
      testData.sections?.multipleChoice?.questions || [];

    const writingQuestions =
      testData.sections?.writing?.questions || [];

    const readingTexts =
      testData.sections?.reading?.texts || [];

    if (multipleChoiceQuestions.length === 0) {
      return "Dodaj co najmniej jedno pytanie wielokrotnego wyboru.";
    }

    if (writingQuestions.length === 0) {
      return "Dodaj co najmniej jedno zadanie pisemne.";
    }

    if (readingTexts.length === 0) {
      return "Dodaj co najmniej jeden tekst do czytania.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (hasSubmitted || isSaving) return;

    setHasSubmitted(true);
    setError(null);

    try {
      const validationError = validateTestData();

      if (validationError) {
        throw new Error(validationError);
      }

      await onSubmit?.({
        ...testData,
        level: testData.level,
        sections: {
          multipleChoice: testData.sections.multipleChoice || {
            questions: []
          },
          writing: testData.sections.writing || { questions: [] },
          reading: testData.sections.reading || { texts: [] }
        }
      });

      if (!initialData) {
        setTestData(INITIAL_STATE);
        setActiveSection("multipleChoice");
      }
    } catch (error) {
      console.error("Error saving test:", error);
      setError(error.message || "Nie udało się zapisać testu.");
    } finally {
      setHasSubmitted(false);
    }
  };

  const handleCancel = () => {
    setTestData(INITIAL_STATE);
    setActiveSection("multipleChoice");
    setError(null);
    setHasSubmitted(false);
    onCancel?.();
  };

  const handleSectionChange = useCallback((sectionName, sectionData) => {
    setTestData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionName]: sectionData
      }
    }));
  }, []);

  const disabled = Boolean(isSaving || hasSubmitted);

  const selectedLevel = LEVELS.find((level) => level.id === testData.level);

  const completionCount = SECTIONS.filter(
    (section) => getSectionStatus(section.id, testData) > 0
  ).length;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <header className="mb-5 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
              Kreator testów administratora
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              {initialData ? "Edytuj test" : "Utwórz nowy test"}
            </h2>

            <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
              Twórz testy według poziomów CEFR z pytaniami
              wielokrotnego wyboru, pisaniem i czytaniem.
            </p>
          </div>

          <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 min-w-[150px]">
            <p className="text-xs text-primary-700 font-semibold uppercase">
              Postęp
            </p>

            <p className="text-2xl font-bold text-primary-700 mt-1">
              {completionCount}/3
            </p>

            <p className="text-xs text-gray-600">
              sekcje z treścią
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-5 text-sm md:text-base">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <section className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
              <FaLayerGroup />
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-lg md:text-xl">
                Poziom testu
              </h3>

              <p className="text-sm text-gray-600 mt-1">
                Wybierz dokładny poziom CEFR, który będzie oceniany przez ten test.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {LEVELS.map((level) => {
              const isActive = testData.level === level.id;

              return (
                <button
                  key={level.id}
                  type="button"
                  disabled={Boolean(initialData) || disabled}
                  onClick={() =>
                    setTestData((prev) => ({
                      ...prev,
                      level: level.id
                    }))
                  }
                  className={`rounded-2xl border p-3 md:p-4 text-left transition-all ${
                    isActive
                      ? "bg-primary-600 border-primary-600 text-white shadow-md"
                      : "bg-gray-50 border-gray-100 text-gray-700 hover:border-primary-300 hover:bg-primary-50"
                  } ${
                    Boolean(initialData) || disabled
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }`}
                >
                  <p className="text-2xl font-black leading-none">
                    {level.title}
                  </p>

                  <p
                    className={`text-xs mt-2 ${
                      isActive ? "text-primary-100" : "text-gray-500"
                    }`}
                  >
                    {level.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedLevel && (
            <div className="mt-4 bg-green-50 border border-green-100 text-green-800 rounded-2xl p-3 text-sm flex items-center gap-2">
              <FaCheckCircle />
              Wybrany poziom: {selectedLevel.title} ·{" "}
              {selectedLevel.description}
            </div>
          )}

          {initialData && (
            <p className="text-xs text-gray-500 mt-3">
              Poziomu nie można zmienić podczas edycji istniejącego testu.
            </p>
          )}
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-lg md:text-xl">
              Sekcje testu
            </h3>

            <p className="text-sm text-gray-600 mt-1">
              Organizuj treść testu według ocenianych umiejętności.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              const itemCount = getSectionStatus(section.id, testData);

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  disabled={disabled}
                  className={`rounded-2xl border px-2 md:px-4 py-3 text-center transition-all ${
                    isActive
                      ? "bg-primary-600 border-primary-600 text-white shadow-md"
                      : "bg-gray-50 border-gray-100 text-gray-700 hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-center justify-center text-lg md:text-xl mb-1">
                    {section.icon}
                  </div>

                  <p className="text-xs md:text-sm font-semibold">
                    <span className="hidden sm:inline">
                      {section.label}
                    </span>
                    <span className="sm:hidden">
                      {section.shortLabel}
                    </span>
                  </p>

                  <p
                    className={`text-[11px] mt-1 ${
                      isActive ? "text-primary-100" : "text-gray-500"
                    }`}
                  >
                    {itemCount} {itemCount === 1 ? "element" : "elementy"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 md:mt-6">
            {activeSection === "multipleChoice" && (
              <MultipleChoiceSection
                level={testData.level}
                questions={testData.sections.multipleChoice.questions}
                onChange={(questions) =>
                  handleSectionChange("multipleChoice", { questions })
                }
                disabled={disabled}
              />
            )}

            {activeSection === "writing" && (
              <WritingSection
                level={testData.level}
                questions={testData.sections.writing.questions}
                onChange={(questions) =>
                  handleSectionChange("writing", { questions })
                }
                disabled={disabled}
              />
            )}

            {activeSection === "reading" && (
              <ReadingSection
                level={testData.level}
                texts={testData.sections.reading.texts}
                onChange={(texts) =>
                  handleSectionChange("reading", { texts })
                }
                disabled={disabled}
              />
            )}
          </div>
        </section>

        <footer className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border border-gray-100 rounded-3xl shadow-lg p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 rounded-2xl text-gray-700 font-semibold hover:bg-gray-50"
              disabled={disabled}
            >
              <FaTimes />
              Anuluj
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-semibold hover:bg-primary-700 disabled:opacity-50"
              disabled={disabled}
            >
              <FaSave />
              {isSaving
                ? "Zapisywanie..."
                : initialData
                ? "Zaktualizuj test"
                : "Zapisz test"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};

export default TestForm;