// src/components/test/TestProgress.jsx

import PropTypes from "prop-types";

import {
  FaBookOpen,
  FaCheckCircle,
  FaEdit,
  FaHeadphones,
  FaLayerGroup,
  FaListAlt,
  FaMicrophone
} from "react-icons/fa";

const CEFR_LEVEL_ORDER = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
];

/*
 * Añadir "listening" y "speaking" cuando esas secciones formen parte
 * del flujo activo del Placement Test.
 */
const SECTION_ORDER = [
  "multipleChoice",
  "writing",
  "reading"
];

const SECTION_DATA = {
  multipleChoice: {
    label: "Wybór odpowiedzi",
    shortLabel: "Wybór",
    icon: FaListAlt
  },

  writing: {
    label: "Pisanie",
    shortLabel: "Pisanie",
    icon: FaEdit
  },

  reading: {
    label: "Czytanie",
    shortLabel: "Czytanie",
    icon: FaBookOpen
  },

  listening: {
    label: "Słuchanie",
    shortLabel: "Słuchanie",
    icon: FaHeadphones
  },

  speaking: {
    label: "Mówienie",
    shortLabel: "Mówienie",
    icon: FaMicrophone
  }
};

const clampPercentage = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numericValue));
};

const getOrderedLevels = (tests = {}) => {
  return CEFR_LEVEL_ORDER.filter(
    (level) => Boolean(tests?.[level])
  );
};

const getSectionData = (section) => {
  return (
    SECTION_DATA[section] || {
      label: section || "Sekcja",
      shortLabel: section || "Sekcja",
      icon: FaLayerGroup
    }
  );
};

const TestProgress = ({
  currentFilter,
  currentSection,
  totalFilters = {}
}) => {
  const availableLevels =
    getOrderedLevels(totalFilters);

  if (availableLevels.length === 0) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
      >
        Brak dostępnych testów do wyświetlenia postępu.
      </div>
    );
  }

  const resolvedLevelIndex =
    availableLevels.indexOf(currentFilter);

  const currentLevelIndex =
    resolvedLevelIndex >= 0
      ? resolvedLevelIndex
      : 0;

  const resolvedSectionIndex =
    SECTION_ORDER.indexOf(currentSection);

  const currentSectionIndex =
    resolvedSectionIndex >= 0
      ? resolvedSectionIndex
      : 0;

  const currentSectionData =
    getSectionData(currentSection);

  const CurrentSectionIcon =
    currentSectionData.icon;

  const completedLevelSteps =
    currentLevelIndex * SECTION_ORDER.length;

  const currentSectionStep =
    currentSectionIndex + 1;

  const completedSteps =
    completedLevelSteps + currentSectionStep;

  const maximumPossibleSteps =
    availableLevels.length *
    SECTION_ORDER.length;

  /*
   * Este porcentaje representa el avance dentro del recorrido máximo
   * disponible A1–C2. El test puede finalizar antes si el estudiante
   * no alcanza el puntaje requerido para continuar.
   */
  const totalProgress =
    maximumPossibleSteps > 0
      ? clampPercentage(
          (completedSteps /
            maximumPossibleSteps) *
            100
        )
      : 0;

  const levelProgress =
    SECTION_ORDER.length > 0
      ? clampPercentage(
          ((currentSectionIndex + 1) /
            SECTION_ORDER.length) *
            100
        )
      : 0;

  return (
    <section
      className="rounded-3xl border border-gray-100 bg-white p-4 shadow-lg md:p-6"
      aria-labelledby="test-progress-title"
    >
      <div className="mb-5 flex flex-col gap-5 md:mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 md:text-sm">
            Test poziomujący CEFR
          </p>

          <h2
            id="test-progress-title"
            className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl"
          >
            Test w toku
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-600 md:text-base">
            Poziom{" "}
            <span className="font-semibold text-gray-900">
              {currentFilter}
            </span>
            {" · "}
            sekcja{" "}
            {currentSectionIndex + 1} z{" "}
            {SECTION_ORDER.length}:{" "}
            <span className="font-semibold text-gray-900">
              {currentSectionData.label}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-3 text-center md:p-4">
            <FaLayerGroup className="mx-auto mb-2 text-primary-600" />

            <p className="text-lg font-bold text-primary-700 md:text-xl">
              {currentLevelIndex + 1}/
              {availableLevels.length}
            </p>

            <p className="text-[10px] text-gray-600 md:text-xs">
              Poziom
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center md:p-4">
            <CurrentSectionIcon className="mx-auto mb-2 text-blue-600" />

            <p className="text-lg font-bold text-blue-700 md:text-xl">
              {currentSectionIndex + 1}/
              {SECTION_ORDER.length}
            </p>

            <p className="text-[10px] text-gray-600 md:text-xs">
              Sekcja
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-3 text-center md:p-4">
            <FaCheckCircle className="mx-auto mb-2 text-green-600" />

            <p className="text-lg font-bold text-green-700 md:text-xl">
              {Math.round(levelProgress)}%
            </p>

            <p className="text-[10px] text-gray-600 md:text-xs">
              Poziom
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex justify-between gap-4 text-xs text-gray-600 md:text-sm">
            <span className="font-medium">
              Postęp bieżącego poziomu
            </span>

            <span className="font-semibold">
              {Math.round(levelProgress)}%
            </span>
          </div>

          <div
            className="h-3 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-label="Postęp bieżącego poziomu"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(
              levelProgress
            )}
          >
            <div
              className="h-3 rounded-full bg-gradient-to-r from-secondary-500 to-blue-500 transition-all duration-500"
              style={{
                width: `${levelProgress}%`
              }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between gap-4 text-xs text-gray-600 md:text-sm">
            <span className="font-medium">
              Postęp maksymalnej ścieżki testu
            </span>

            <span className="font-semibold">
              {Math.round(totalProgress)}%
            </span>
          </div>

          <div
            className="h-3 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-label="Postęp maksymalnej ścieżki testu"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(
              totalProgress
            )}
          >
            <div
              className="h-3 rounded-full bg-gradient-to-r from-primary-600 to-green-500 transition-all duration-500"
              style={{
                width: `${totalProgress}%`
              }}
            />
          </div>

          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Test może zakończyć się wcześniej, jeżeli wynik bieżącego poziomu
            będzie niższy niż wymagane minimum.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 md:mt-6 md:gap-3">
        {SECTION_ORDER.map(
          (section, index) => {
            const sectionData =
              getSectionData(section);

            const SectionIcon =
              sectionData.icon;

            const isCompleted =
              index <
              currentSectionIndex;

            const isActive =
              index ===
              currentSectionIndex;

            return (
              <div
                key={section}
                className={`rounded-2xl border p-3 text-center transition-all md:p-4 ${
                  isCompleted
                    ? "border-green-200 bg-green-50 text-green-700"
                    : isActive
                      ? "border-primary-200 bg-primary-50 text-primary-700 shadow-sm"
                      : "border-gray-100 bg-gray-50 text-gray-500"
                }`}
                aria-current={
                  isActive
                    ? "step"
                    : undefined
                }
              >
                <div className="mb-2 flex justify-center text-lg md:text-xl">
                  {isCompleted ? (
                    <FaCheckCircle />
                  ) : (
                    <SectionIcon />
                  )}
                </div>

                <p className="text-xs font-semibold md:text-sm">
                  <span className="hidden sm:inline">
                    {sectionData.label}
                  </span>

                  <span className="sm:hidden">
                    {
                      sectionData.shortLabel
                    }
                  </span>
                </p>

                <p className="mt-1 text-[10px] opacity-80 md:text-xs">
                  {isCompleted
                    ? "Zakończona"
                    : isActive
                      ? "Aktualna"
                      : "Następna"}
                </p>
              </div>
            );
          }
        )}
      </div>

      <div className="mt-5 md:mt-6">
        <div className="flex gap-2">
          {availableLevels.map(
            (level, index) => {
              const isCompleted =
                index <
                currentLevelIndex;

              const isActive =
                index ===
                currentLevelIndex;

              return (
                <div
                  key={level}
                  className="flex-1"
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500"
                        : isActive
                          ? "bg-secondary-500"
                          : "bg-gray-200"
                    }`}
                  />

                  <p
                    className={`mt-2 text-center text-[10px] font-semibold md:text-xs ${
                      isActive
                        ? "text-secondary-700"
                        : isCompleted
                          ? "text-green-700"
                          : "text-gray-400"
                    }`}
                  >
                    {level}
                  </p>
                </div>
              );
            }
          )}
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Dokładny zalecany poziom CEFR zostanie przedstawiony po zakończeniu
          testu.
        </p>
      </div>
    </section>
  );
};

TestProgress.propTypes = {
  currentFilter: PropTypes.oneOf(
    CEFR_LEVEL_ORDER
  ).isRequired,

  currentSection: PropTypes.oneOf([
    "multipleChoice",
    "writing",
    "reading",
    "listening",
    "speaking"
  ]).isRequired,

  totalFilters: PropTypes.object
};

export default TestProgress;