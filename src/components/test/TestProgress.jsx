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

const getOrderedLevels = (totalFilters = {}) => {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2"];

  return order.filter((level) => totalFilters[level]);
};

const getSectionData = (section) => {
  const data = {
    multipleChoice: {
      label: "Multiple Choice",
      shortLabel: "Choice",
      icon: <FaListAlt />
    },
    writing: {
      label: "Writing",
      shortLabel: "Writing",
      icon: <FaEdit />
    },
    reading: {
      label: "Reading",
      shortLabel: "Reading",
      icon: <FaBookOpen />
    },
    listening: {
      label: "Listening",
      shortLabel: "Listening",
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

const TestProgress = ({ currentFilter, currentSection, totalFilters }) => {
  const availableLevels = getOrderedLevels(totalFilters);
  const sections = SECTION_ORDER;

  const currentSectionIndex = Math.max(sections.indexOf(currentSection), 0);
  const currentLevelIndex = Math.max(availableLevels.indexOf(currentFilter), 0);

  const totalSteps = availableLevels.length * sections.length;
  const currentStep =
    currentLevelIndex * sections.length + currentSectionIndex + 1;

  const totalProgress =
    totalSteps > 0 ? Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100) : 0;

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
        No hay tests disponibles para mostrar progreso.
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-5 md:mb-6">
        <div>
          <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Spanish placement test
          </p>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            Assessment in progress
          </h2>

          <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
            Section {currentSectionIndex + 1} of {sections.length}:{" "}
            <span className="font-semibold">{currentSectionData.label}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-3 md:p-4 text-center">
            <FaLayerGroup className="mx-auto text-primary-600 mb-2" />
            <p className="text-lg md:text-xl font-bold text-primary-700">
              {currentLevelIndex + 1}/{availableLevels.length}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">
              Stages
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
              Sections
            </p>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 md:p-4 text-center">
            <FaCheckCircle className="mx-auto text-green-600 mb-2" />
            <p className="text-lg md:text-xl font-bold text-green-700">
              {Math.round(totalProgress)}%
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">
              Total
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2 text-xs md:text-sm text-gray-600">
            <span className="font-medium">Overall progress</span>
            <span className="font-semibold">{Math.round(totalProgress)}%</span>
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
            <span className="font-medium">Current stage progress</span>
            <span className="font-semibold">{Math.round(sectionProgress)}%</span>
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
                <span className="hidden sm:inline">{sectionData.label}</span>
                <span className="sm:hidden">{sectionData.shortLabel}</span>
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
          The exact CEFR level will be shown only after the test is completed.
        </p>
      </div>
    </section>
  );
};

export default TestProgress;