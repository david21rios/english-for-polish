// src/components/nivel/SectionNavigation.jsx

import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaLock
} from "react-icons/fa";

const SectionNavigation = ({
  currentSectionIndex = 0,
  totalSections = 0,
  canAdvanceCurrentSection,
  goToPreviousSection,
  goToNextSection
}) => {
  const isFirstSection = currentSectionIndex <= 0;
  const isLastSection = currentSectionIndex >= totalSections - 1;

  const canAdvance =
    typeof canAdvanceCurrentSection === "function"
      ? canAdvanceCurrentSection()
      : true;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <button
          type="button"
          onClick={goToPreviousSection}
          disabled={isFirstSection}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${
            isFirstSection
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <FaArrowLeft />
          Poprzednia sekcja
        </button>

        <button
          type="button"
          onClick={goToNextSection}
          disabled={!canAdvance}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${
            !canAdvance
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isLastSection
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-primary-600 text-white hover:bg-primary-700"
          }`}
        >
          {!canAdvance ? (
            <>
              <FaLock />
              Najpierw ukończ aktywność
            </>
          ) : isLastSection ? (
            <>
              Zakończ sekcję
              <FaCheckCircle />
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
  );
};

export default SectionNavigation;