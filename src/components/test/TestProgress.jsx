// src/components/test/TestProgress.jsx

import {
  FaBookOpen,
  FaCheckCircle,
  FaEdit,
  FaHeadphones,
  FaLayerGroup,
  FaListAlt
} from "react-icons/fa";

const SECTION_ORDER = ["multipleChoice", "writing", "reading"];
const CEFR_LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const getOrderedLevels = (totalFilters = {}) => {
  return CEFR_LEVEL_ORDER.filter((level) => totalFilters?.[level]);
};

const getSectionData = (section) => {
  const data = {
    multipleChoice: {
      label: "Wybór odpowiedzi",
      shortLabel: "Wybór",
      icon: <FaListAlt />
    },
    writing: {
      label: "Pisanie",
      shortLabel: "Pisanie",
      icon: <FaEdit />
    },
    reading: {
      label: "Czytanie",
      shortLabel: "Czytanie",
      icon: <FaBookOpen />
    },
    listening: {
      label: "Słuchanie",
      shortLabel: "Słuchanie",
      icon: <FaHeadphones />
    }
  };

  return (
    data[section] || {
      label: section,
      shortLabel: section,
      icon: <FaLayerGroup />
    }
  );
};

const TestProgress = ({
  currentFilter,
  currentSection,
  totalFilters = {}
}) => {
  const availableLevels = getOrderedLevels(totalFilters);
  const sections = SECTION_ORDER;

  const currentSectionIndex = Math.max(
    sections.indexOf(currentSection),
    0
  );

  const currentLevelIndex = Math.max(
    availableLevels.indexOf(currentFilter),
    0
  );

  const totalSteps = availableLevels.length * sections.length;

  const currentStep =
    currentLevelIndex * sections.length + currentSectionIndex + 1;

  const totalProgress =
    totalSteps > 0
      ? Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100)
      : 0;

  const sectionProgress =
    sections.length > 0
      ? Math.min(
          Math.max(((currentSectionIndex + 1) / sections.length) * 100, 0),
          100
        )
      : 0;

  const currentSectionData = getSectionData(currentSection);

  if (availableLevels.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-2xl">
        Brak dostępnych testów do wyświetlenia postępu.
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-5 md:mb-6">
        <div>
          <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Test poziomujący CEFR
          </p>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            Test w toku
          </h2>

          <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
            Sekcja {currentSectionIndex + 1} z {sections.length}:{" "}
            <span className="font-semibold">
              {currentSectionData.label}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-3 md:p-4 text-center">
            <FaLayerGroup className="mx-auto text-primary-600 mb-2" />

            <p className="text-lg md:text-xl font-bold text-primary-700">
              {currentLevelIndex + 1}/{availableLevels.length}
            </p>

            <p className="text-[10px] md:text-xs text-gray-600">
              Poziomy
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 md:p-4 text-center">
            <div className="mx-auto text-blue-600 mb-2 flex justify-center">
              {currentSectionData.icon}
            </div>

            <p className="text-lg md:text-xl font-bold text-blue-700">
              {currentSectionIndex + 1}/{sections.length}
            </p>

            <p className="text-[10px] md:text-xs text-gray-600">
              Sekcje
            </p>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 md:p-4 text-center">
            <FaCheckCircle className="mx-auto text-green-600 mb-2" />

            <p className="text-lg md:text-xl font-bold text-green-700">
              {Math.round(totalProgress)}%
            </p>

            <p className="text-[10px] md:text-xs text-gray-600">
              Razem
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2 text-xs md:text-sm text-gray-600">
            <span className="font-medium">
              Całkowity postęp
            </span>

            <span className="font-semibold">
              {Math.round(totalProgress)}%
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-600 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2 text-xs md:text-sm text-gray-600">
            <span className="font-medium">
              Postęp aktualnej sekcji
            </span>

            <span className="font-semibold">
              {Math.round(sectionProgress)}%
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-secondary-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${sectionProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 md:mt-6 grid grid-cols-3 gap-2 md:gap-3">
        {sections.map((section, index) => {
          const sectionData = getSectionData(section);
          const isCompleted = index < currentSectionIndex;
          const isActive = index === currentSectionIndex;

          return (
            <div
              key={section}
              className={`rounded-2xl border p-3 md:p-4 text-center transition-all ${
                isCompleted
                  ? "bg-green-50 border-green-200 text-green-700"
                  : isActive
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "bg-gray-50 border-gray-100 text-gray-500"
              }`}
            >
              <div className="flex justify-center mb-2 text-lg md:text-xl">
                {isCompleted ? <FaCheckCircle /> : sectionData.icon}
              </div>

              <p className="text-xs md:text-sm font-semibold">
                <span className="hidden sm:inline">
                  {sectionData.label}
                </span>

                <span className="sm:hidden">
                  {sectionData.shortLabel}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 md:mt-6">
        <div className="flex gap-2">
          {availableLevels.map((level, index) => (
            <div
              key={level}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                index < currentLevelIndex
                  ? "bg-primary-600"
                  : index === currentLevelIndex
                  ? "bg-secondary-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Dokładny poziom CEFR zostanie pokazany po zakończeniu testu.
        </p>
      </div>
    </section>
  );
};

export default TestProgress;