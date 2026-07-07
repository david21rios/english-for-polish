// src/components/test/TestNavigation.jsx

import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle
} from "react-icons/fa";

const LAST_SECTION = "reading";

const TestNavigation = ({
  currentSection,
  handlePreviousSection,
  handleNextSection
}) => {
  const isFirstSection = currentSection === "multipleChoice";
  const isLastSection = currentSection === LAST_SECTION;

  return (
    <footer className="sticky bottom-3 z-30 mt-8">
      <div className="bg-white/95 backdrop-blur border border-gray-100 rounded-3xl shadow-lg p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={handlePreviousSection}
            disabled={isFirstSection}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all ${
              isFirstSection
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaArrowLeft />
            Poprzednia sekcja
          </button>

          <div className="hidden md:block text-center text-sm text-gray-500">
            Odpowiedz na wszystkie widoczne pytania przed przejściem dalej.
          </div>

          <button
            type="button"
            onClick={handleNextSection}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white transition-all ${
              isLastSection
                ? "bg-green-600 hover:bg-green-700"
                : "bg-secondary-500 hover:bg-secondary-600"
            }`}
          >
            {isLastSection ? (
              <>
                <FaCheckCircle />
                Sprawdź wyniki
              </>
            ) : (
              <>
                Następna sekcja
                <FaArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default TestNavigation;