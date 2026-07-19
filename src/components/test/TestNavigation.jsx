// src/components/test/TestNavigation.jsx

import PropTypes from "prop-types";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";

const SECTION_ORDER = [
  "multipleChoice",
  "writing",
  "reading"
];

const SECTION_LABELS = {
  multipleChoice: "Wybór odpowiedzi",
  writing: "Pisanie",
  reading: "Czytanie"
};

const TestNavigation = ({
  currentSection,
  handlePreviousSection,
  handleNextSection,
  unansweredCount = 0,
  currentLevel = "",
  disableNext = false,
  isSubmitting = false
}) => {
  const currentIndex = SECTION_ORDER.indexOf(currentSection);

  const isFirstSection = currentIndex === 0;
  const isLastSection = currentIndex === SECTION_ORDER.length - 1;

  const currentLabel =
    SECTION_LABELS[currentSection] || currentSection;

  return (
    <footer className="bottom-3 z-40 mt-8">
      <div className="rounded-3xl border border-gray-100 bg-white/95 backdrop-blur shadow-xl">

        {/* ---------- Información ---------- */}

        <div className="border-b border-gray-100 px-6 py-4">

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-xs uppercase tracking-wider text-primary-600 font-bold">
                Poziom {currentLevel}
              </p>

              <h3 className="text-lg font-bold text-gray-900">
                Sekcja: {currentLabel}
              </h3>

            </div>

            <div className="text-sm text-gray-500">

              Sekcja {currentIndex + 1} z {SECTION_ORDER.length}

            </div>

          </div>

        </div>

        {/* ---------- Advertencia ---------- */}

        {unansweredCount > 0 && (
          <div className="mx-5 mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">

            <div className="flex items-start gap-3">

              <FaExclamationTriangle className="mt-1 text-yellow-600" />

              <div>

                <p className="font-semibold text-yellow-800">
                  Nie wszystkie pytania zostały rozwiązane.
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  Pozostało {unansweredCount}{" "}
                  {unansweredCount === 1
                    ? "pytanie"
                    : "pytań"}{" "}
                  bez odpowiedzi.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ---------- Navegación ---------- */}

        <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">

          <button
            type="button"
            onClick={handlePreviousSection}
            disabled={isFirstSection || isSubmitting}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold transition-all
              ${
                isFirstSection
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            <FaArrowLeft />

            Poprzednia sekcja
          </button>

          <div className="hidden text-center text-sm text-gray-500 lg:block">

            Przed przejściem dalej upewnij się, że odpowiedziałeś na wszystkie pytania w bieżącej sekcji.

          </div>

          <button
            type="button"
            onClick={handleNextSection}
            disabled={disableNext || isSubmitting}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white transition-all

              ${
                disableNext || isSubmitting
                  ? "cursor-not-allowed bg-gray-300"
                  : isLastSection
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-secondary-500 hover:bg-secondary-600"
              }`}
          >
            {isSubmitting ? (
              <>
                Przetwarzanie...
              </>
            ) : isLastSection ? (
              <>
                <FaCheckCircle />

                Zakończ poziom
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

TestNavigation.propTypes = {
  currentSection: PropTypes.oneOf([
    "multipleChoice",
    "writing",
    "reading"
  ]).isRequired,

  currentLevel: PropTypes.string,

  unansweredCount: PropTypes.number,

  disableNext: PropTypes.bool,

  isSubmitting: PropTypes.bool,

  handlePreviousSection: PropTypes.func.isRequired,

  handleNextSection: PropTypes.func.isRequired
};

export default TestNavigation;