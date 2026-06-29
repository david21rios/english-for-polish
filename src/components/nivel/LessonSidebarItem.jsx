// src/components/nivel/LessonSidebarItem.jsx

import { useState } from "react";
import {
  FaBookOpen,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaLock
} from "react-icons/fa";

const LessonSidebarItem = ({
  lesson,
  currentLesson,
  currentSectionIndex,
  completedSections = [],
  lessonSections = [],
  sectionHasRequiredWork,
  isSectionAccessible,
  handleLessonClick,
  handleSectionClick,
  setSidebarOpen
}) => {
  const isCurrentLesson = currentLesson?.id === lesson.id;
  const [isOpen, setIsOpen] = useState(isCurrentLesson);

  const handleOpenLesson = async () => {
    await handleLessonClick(lesson.id);
    setIsOpen(true);
    setSidebarOpen?.(false);
  };

  const handleToggleSections = (event) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isCurrentLesson
          ? "border-primary-200 bg-primary-50"
          : "border-gray-100 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={handleOpenLesson}
          className="flex-1 flex items-start gap-2 text-left min-w-0"
        >
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isCurrentLesson
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <FaBookOpen />
          </span>

          <span className="min-w-0">
            <span
              className={`block text-sm font-semibold truncate ${
                isCurrentLesson ? "text-primary-700" : "text-gray-800"
              }`}
            >
              {lesson.titulo || "Untitled lesson"}
            </span>

            <span className="block text-xs text-gray-500 truncate">
              {lesson.id}
            </span>
          </span>
        </button>

        {isCurrentLesson && (
          <button
            type="button"
            onClick={handleToggleSections}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary-600"
            title="Show lesson sections"
          >
            {isOpen ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        )}
      </div>

      {isCurrentLesson && isOpen && (
        <div className="border-t border-primary-100 p-2 space-y-1">
          {lessonSections.map((section, index) => {
            const isCurrentSection = index === currentSectionIndex;
            const isCompleted = completedSections.includes(section.id);
            const isRequired = sectionHasRequiredWork?.(section.id);
            const isAccessible = isSectionAccessible?.(index);

            return (
              <button
                key={section.id}
                type="button"
                disabled={!isAccessible}
                onClick={() => {
                  handleSectionClick(index);
                  setSidebarOpen?.(false);
                }}
                className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  isCurrentSection
                    ? "bg-primary-600 text-white"
                    : isAccessible
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <span className="w-5 flex justify-center shrink-0">
                  {isCompleted ? (
                    <FaCheckCircle />
                  ) : !isAccessible ? (
                    <FaLock />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                  )}
                </span>

                <span className="flex-1 truncate">
                  {section.title}
                </span>

                {isRequired && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isCurrentSection
                        ? "bg-white/20 text-white"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    req
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LessonSidebarItem;